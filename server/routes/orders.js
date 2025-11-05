const express = require('express')
const router = express.Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const notifications = require('../services/notifications')
const prisma = require('../lib/db')

const USE_DB = !!process.env.DATABASE_URL

// validation helpers
function validPhone(phone){ return /^\d{10}$/.test(phone) }
function validPIN(pin){ return /^\d{6}$/.test(pin) }
function luhnCheck(num){
  const s = (num+'').replace(/\D/g,'')
  let sum = 0; let shouldDouble = false
  for(let i = s.length-1; i>=0; i--){
    let d = parseInt(s.charAt(i),10)
    if(shouldDouble){ d = d*2; if(d>9) d -=9 }
    sum += d
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}
function validateExpiry(exp){
  if(!exp) return false
  const parts = exp.split('/').map(p=>p.trim())
  if(parts.length!==2) return false
  let mm = Number(parts[0]); let yy = Number(parts[1])
  if(mm<1 || mm>12) return false
  if(parts[1].length===2) yy += 2000
  const expiry = new Date(yy, mm-1, 1)
  const last = new Date(expiry.getFullYear(), expiry.getMonth()+1, 0)
  return last >= new Date()
}
function validCVV(cvv){ return /^\d{3,4}$/.test(cvv) }
function validateUPI(vpa){ return /^[a-zA-Z0-9._\-]{2,}@[a-zA-Z]{2,}$/.test(vpa) }

// Create order - requires authenticated user; userId comes from token
router.post('/', requireAuth, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Order creation disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const payload = req.body
    // require cart_id
    if(!payload.cart_id) return res.status(400).json({ error:'cart_id required' })
    // validate shipping
    const s = payload.shipping || {}
    if(!s.name || !s.address || !s.city || !s.state || !s.postal || !s.phone) return res.status(400).json({ error:'Incomplete shipping details' })
    if(!validPhone(s.phone)) return res.status(400).json({ error:'Invalid phone format' })
    if(!validPIN(s.postal)) return res.status(400).json({ error:'Invalid PIN format' })
    // validate payment
    const p = payload.payment || {}
    if(!payload.paymentMethod && !payload.payment) {
      // backward compatibility: payment field may be a string
    }
    const method = payload.paymentMethod || payload.payment || 'cod'
    if(!['card','upi','cod'].includes(method)) return res.status(400).json({ error:'Invalid payment method' })
    if(method==='card'){
      const card = payload.card || {}
      if(!card.number || !card.exp || !card.cvv) return res.status(400).json({ error:'Incomplete card details' })
      if(!/^[0-9]{13,19}$/.test(card.number) || !luhnCheck(card.number)) return res.status(400).json({ error:'Invalid card number' })
      if(!validateExpiry(card.exp)) return res.status(400).json({ error:'Invalid expiry' })
      if(!validCVV(card.cvv)) return res.status(400).json({ error:'Invalid CVV' })
    }
    if(method==='upi'){
      const vpa = (payload.upi || {}).vpa || (payload.card||{}).number
      if(!vpa || !validateUPI(vpa)) return res.status(400).json({ error:'Invalid UPI VPA' })
    }

    const orderId = 'ORD_' + Date.now()
    const items = payload.items || []
    
    // create order with related order items
    const order = await prisma.order.create({
      data: {
        id: orderId,
        userId: req.user?.sub,
        cart_id: payload.cart_id,
        shipping: payload.shipping,
        paymentMethod: method,
        subtotal: payload.subtotal || 0,
        total: payload.total || 0,
        status: 'Processing',
        items: {
          create: items.map(item => ({
            productId: item.product_id || item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { items: true }
    })
    
    // fire-and-forget notifications (email/SMS/WhatsApp) if configured
    const recipient = {
      email: req.user?.email,
      phone: (order.shipping && order.shipping.phone) || undefined
    }
    Promise.resolve()
      .then(()=> notifications.notifyOrderCreated(order, recipient))
      .catch(err=> console.warn('notifyOrderCreated failed:', err?.message || err))
    res.json({ order })
  }catch(err){
    console.error('order POST error:', err)
    res.status(500).json({ error:'Failed to create order' })
  }
})

// fetch a single order; user must own it or be admin
router.get('/:id', requireAuth, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Orders disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const id = req.params.id
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if(!order) return res.status(404).json({ error: 'Order not found' })
    if(req.user.role !== 'admin' && order.userId !== req.user.sub) return res.status(403).json({ error:'Forbidden' })
    res.json(order)
  }catch(err){
    console.error('order GET error:', err)
    res.status(500).json({ error:'Failed to fetch order' })
  }
})

// list orders: admin gets all; users get only their own
router.get('/', requireAuth, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Orders disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const userId = req.query.userId
    let where = {}
    if(req.user.role === 'admin'){
      if(userId) where = { userId }
    } else {
      where = { userId: req.user.sub }
    }
    const orders = await prisma.order.findMany({ where, include: { items: true }, orderBy: { date: 'desc' } })
    res.json(orders)
  }catch(err){
    console.error('orders GET error:', err)
    res.status(500).json({ error:'Failed to fetch orders' })
  }
})

// admin can update status/tracking
router.put('/:id', requireAuth, requireAdmin, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Order updates disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const id = req.params.id
    const updates = req.body || {}
    const before = await prisma.order.findUnique({ where: { id }, include: { items: true } })
    if(!before) return res.status(404).json({ error:'Order not found' })
    
    const allowed = ['status','tracking']
    const data = {}
    allowed.forEach(k=>{ if(updates[k] !== undefined) data[k] = updates[k] })
    
    const order = await prisma.order.update({ where: { id }, data, include: { items: true } })
    
    // lookup recipient from user and order shipping phone
    const buyer = await prisma.user.findUnique({ where: { id: order.userId } })
    const recipient = {
      email: buyer?.email,
      phone: (order.shipping && order.shipping.phone) || undefined
    }
    Promise.resolve()
      .then(()=> notifications.notifyOrderUpdated(before, order, recipient))
      .catch(err=> console.warn('notifyOrderUpdated failed:', err?.message || err))
    res.json(order)
  }catch(err){
    if(err.code === 'P2025') return res.status(404).json({ error:'Order not found' })
    console.error('order PUT error:', err)
    res.status(500).json({ error:'Failed to update order' })
  }
})

module.exports = router
