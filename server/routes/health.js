const express = require('express')
const router = express.Router()

// Simple health check endpoint - no database required
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tamil Book Shop API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  })
})

// System info endpoint
router.get('/health', (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: 'not_tested',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  }

  res.json(health)
})

module.exports = router