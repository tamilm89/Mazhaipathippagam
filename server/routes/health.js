const express = require('express')
const router = express.Router()

// Simple health check endpoint - no database required
router.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Tamil Book Shop API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Health check with database status
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'unknown',
    environment: process.env.NODE_ENV || 'development'
  }

  try {
    const { safeDbOperation, prisma } = require('../lib/safe-db')
    
    // Quick database test with timeout
    const dbTest = await safeDbOperation(
      prisma.$queryRaw`SELECT 1 as test`
    )
    
    health.database = dbTest ? 'connected' : 'fallback'
    
  } catch (error) {
    health.database = 'error'
    health.error = error.message
  }

  res.json(health)
})

module.exports = router