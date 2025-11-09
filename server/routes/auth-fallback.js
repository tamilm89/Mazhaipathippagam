const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'tamil_book_shop_super_secret_jwt_key_2025'

// Hardcoded users for testing (no database dependency)
const USERS = [
  {
    id: 'admin_1',
    email: 'admin@local',
    role: 'admin',
    passwordHash: bcrypt.hashSync('password', 10) // password: 'password'
  },
  {
    id: 'customer_1', 
    email: 'customer@test.com',
    role: 'customer',
    passwordHash: bcrypt.hashSync('password', 10) // password: 'password'
  }
]

// Login route - no database dependency
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    console.log(`Login attempt for: ${email}`)
    
    // Find user in hardcoded array
    const user = USERS.find(u => u.email === email)
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash)
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    console.log(`Login successful for: ${email} (${user.role})`)

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      token
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Register route - no database dependency
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Check if user already exists
    const existingUser = USERS.find(u => u.email === email)
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // For demo, just return success without actually registering
    res.json({
      success: true,
      message: 'Registration successful (demo mode)',
      user: {
        email,
        role: 'customer'
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Test credentials endpoint
router.get('/test-credentials', (req, res) => {
  res.json({
    message: 'Test credentials for the Tamil Book Shop API',
    credentials: [
      {
        email: 'admin@local',
        password: 'password',
        role: 'admin'
      },
      {
        email: 'customer@test.com', 
        password: 'password',
        role: 'customer'
      }
    ]
  })
})

module.exports = router