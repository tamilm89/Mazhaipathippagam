const serverless = require('serverless-http')
const { createApp } = require('../app')

// Export a single Vercel Serverless Function that serves all /api/* routes
const app = createApp()

module.exports = serverless(app)
