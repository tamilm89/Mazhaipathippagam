const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../lib/db')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me'
const USE_DB = !!process.env.DATABASE_URL

// seed an admin user if not present (only when DATABASE_URL is set)
async function ensureAdmin(){
  if(!USE_DB) return
  try{
    const admin = await prisma.user.findUnique({ where: { email: 'admin@local' } })
    if(!admin){
      await prisma.user.create({
        data: {
          email: 'admin@local',
          role: 'admin',
          passwordHash: bcrypt.hashSync('admin', 10)
        }
      })
    }
  }catch(e){
    console.warn('ensureAdmin skipped:', e.message)
  }
}
ensureAdmin()

function signToken(user){
  return jwt.sign({ sub: user.id, email: user.email, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' })
}

router.post('/register', async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Registration disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const { email, password } = req.body
    if(!email || !password) return res.status(400).json({ error:'Email and password required' })
    const existing = await prisma.user.findUnique({ where: { email } })
    if(existing) return res.status(400).json({ error:'User exists' })
    const user = await prisma.user.create({
      data: { email, role:'user', passwordHash: bcrypt.hashSync(password, 10) }
    })
    const token = signToken(user)
    res.json({ user: { id:user.id, email:user.email, role:user.role }, token })
  }catch(err){
    console.error('register error:', err)
    res.status(500).json({ error:'Registration failed' })
  }
})

router.post('/login', async (req,res)=>{
  if(!USE_DB){
    return res.status(503).json({ error:'Login disabled. Set DATABASE_URL to enable database.' })
  }
  try{
    const { email, password } = req.body
    if(!email || !password) return res.status(400).json({ error:'Email and password required' })
    const user = await prisma.user.findUnique({ where: { email } })
    if(!user) return res.status(401).json({ error:'Invalid credentials' })
    const ok = bcrypt.compareSync(password, user.passwordHash)
    if(!ok) return res.status(401).json({ error:'Invalid credentials' })
    const token = signToken(user)
    res.json({ user: { id:user.id, email:user.email, role:user.role || 'user' }, token })
  }catch(err){
    console.error('login error:', err)
    res.status(500).json({ error:'Login failed' })
  }
})

module.exports = router
