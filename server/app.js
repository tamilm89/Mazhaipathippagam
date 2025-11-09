const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const productsRouter = require('./routes/products')
const authRouter = require('./routes/auth')
const ordersRouter = require('./routes/orders')
const healthRouter = require('./routes/health')

function createApp(){
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())

  // Health checks (no database dependency)
  app.use('/api', healthRouter)

  app.use('/api/products', productsRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/orders', ordersRouter)

  return app
}

module.exports = { createApp }
