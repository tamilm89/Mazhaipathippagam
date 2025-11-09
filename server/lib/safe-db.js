// Database operations with timeout for serverless
const prisma = require('./db')

// Timeout wrapper for database operations
const withTimeout = (operation, timeoutMs = 8000) => {
    return Promise.race([
        operation,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database operation timeout')), timeoutMs)
        )
    ])
}

// Safe database operations for serverless
const safeDbOperation = async (operation) => {
    try {
        return await withTimeout(operation, 8000) // 8 second timeout
    } catch (error) {
        console.error('Database operation failed:', error.message)
        
        // If it's a timeout or connection error, return mock data
        if (error.message.includes('timeout') || error.message.includes('connect')) {
            console.warn('Falling back to mock data due to database issues')
            return null // Signal to use fallback
        }
        throw error
    }
}

module.exports = { safeDbOperation, withTimeout, prisma }