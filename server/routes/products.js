const express = require('express')
const router = express.Router()
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { safeDbOperation, prisma } = require('../lib/safe-db')
const path = require('path')
const fs = require('fs')

// Fallback data
const getFallbackProducts = () => {
  try {
    const dataFile = path.join(__dirname, '..', 'data', 'products.json')
    return JSON.parse(fs.readFileSync(dataFile, 'utf8'))
  } catch (error) {
    console.error('Failed to load fallback products:', error)
    return []
  }
}

router.get('/', async (req,res)=>{
  try{
    console.log('Fetching products...')
    
    // Try database first with timeout
    const products = await safeDbOperation(
      prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
    )
    
    if (products) {
      console.log(`Found ${products.length} products from database`)
      return res.json(products)
    }
    
    // Fallback to JSON file
    console.log('Using fallback products')
    const fallbackProducts = getFallbackProducts()
    return res.json(fallbackProducts)
    
  }catch(err){
    console.error('products GET error:', err)
    
    // Always return something, even if it's empty
    const fallbackProducts = getFallbackProducts()
    return res.json(fallbackProducts)
  }
})

router.get('/:id', async (req,res)=>{
  try{
    if(!USE_DB){
      const path = require('path')
      const fs = require('fs')
      const dataFile = path.join(__dirname, '..', 'data', 'products.json')
      const list = JSON.parse(fs.readFileSync(dataFile,'utf8'))
      const item = list.find(p=> p.product_id===req.params.id)
      if(!item) return res.status(404).json({error:'Not found'})
      return res.json(item)
    }
    const item = await prisma.product.findUnique({ where: { product_id: req.params.id } })
    if(!item) return res.status(404).json({error:'Not found'})
    res.json(item)
  }catch(err){
    console.error('product GET error:', err)
    res.status(500).json({ error:'Failed to fetch product' })
  }
})

// Admin: create product
router.post('/', requireAuth, requireAdmin, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Product creation disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const body = req.body || {}
    const product = await prisma.product.create({
      data: {
        product_id: body.product_id || 'P_' + Date.now(),
        title_tamil: body.title_tamil || '',
        title_english: body.title_english || '',
        author: body.author || '',
        price: Number(body.price) || 0,
        description: body.description || '',
        category: Array.isArray(body.category) ? body.category : (body.category? [body.category] : []),
        isbn_13: body.isbn_13 || '',
        publisher: body.publisher || '',
        publication_year: body.publication_year || new Date().getFullYear(),
        page_count: body.page_count || 0,
        cover_image_url: body.cover_image_url || '',
        stock_quantity: body.stock_quantity || body.stock || 0,
        status: body.status || 'Published'
      }
    })
    res.status(201).json(product)
  }catch(err){
    console.error('product POST error:', err)
    res.status(500).json({ error:'Failed to create product' })
  }
})

// Admin: update product
router.put('/:id', requireAuth, requireAdmin, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Product update disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const id = req.params.id
    const body = req.body || {}
    const allowed = ['title_tamil','title_english','author','price','description','category','isbn_13','publisher','publication_year','page_count','cover_image_url','stock_quantity','status']
    const data = {}
    allowed.forEach(k=>{ if(body[k] !== undefined) data[k] = body[k] })
    const product = await prisma.product.update({ where: { product_id: id }, data })
    res.json(product)
  }catch(err){
    if(err.code === 'P2025') return res.status(404).json({ error:'Not found' })
    console.error('product PUT error:', err)
    res.status(500).json({ error:'Failed to update product' })
  }
})

// Admin: delete product
router.delete('/:id', requireAuth, requireAdmin, async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Product deletion disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const id = req.params.id
    const removed = await prisma.product.delete({ where: { product_id: id } })
    res.json({ success:true, removed })
  }catch(err){
    if(err.code === 'P2025') return res.status(404).json({ error:'Not found' })
    console.error('product DELETE error:', err)
    res.status(500).json({ error:'Failed to delete product' })
  }
})

module.exports = router
