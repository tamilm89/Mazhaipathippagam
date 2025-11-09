const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const productsRouter = require('./routes/products')
const authRouter = require('./routes/auth-fallback') // Use database-free auth
const healthRouter = require('./routes/health')

function createApp(){
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())

  // Health checks (no database dependency)
  app.use('/api', healthRouter)

  // Use database-free routes for now
  app.use('/api/products', productsRouter)
  app.use('/api/auth', authRouter)

  // Simple orders endpoint (no database)
  app.get('/api/orders', (req, res) => {
    res.json({
      orders: [],
      message: 'Orders endpoint working (no database)',
      timestamp: new Date().toISOString()
    })
  })

  return app
}

module.exports = { createApp }
