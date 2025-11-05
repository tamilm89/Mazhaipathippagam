const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'

function requireAuth(req,res,next){
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ')? auth.slice(7) : null
  if(!token) return res.status(401).json({ error:'Missing token' })
  try{
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload // { sub, email, role }
    return next()
  }catch(e){
    return res.status(401).json({ error:'Invalid token' })
  }
}

function requireAdmin(req,res,next){
  if(!req.user) return res.status(401).json({ error:'Unauthorized' })
  if(req.user.role !== 'admin') return res.status(403).json({ error:'Forbidden' })
  return next()
}

module.exports = { requireAuth, requireAdmin }
