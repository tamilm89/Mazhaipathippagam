const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const productsRouter = require('./routes/products')
const authRouter = require('./routes/auth')
const ordersRouter = require('./routes/orders')

function createApp(){
  const app = express()
  app.use(cors())
  app.use(bodyParser.json())

  app.use('/api/products', productsRouter)
  app.use('/api/auth', authRouter)
  app.use('/api/orders', ordersRouter)

  // health check
  app.get('/api/health', (req,res)=> res.json({ ok:true, ts: Date.now() }))

  return app
}

module.exports = { createApp }
