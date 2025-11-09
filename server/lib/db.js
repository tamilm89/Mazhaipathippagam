const { PrismaClient } = require('@prisma/client')

let prisma

// Optimized Prisma client for serverless with connection pooling
const createPrismaClient = () => {
    return new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
        log: process.env.NODE_ENV === 'development' ? ['error'] : [],
        __internal: {
            engine: {
                enableEngineDebugMode: false,
            },
        },
    })
}

// Singleton for serverless: reuse client across invocations
if (process.env.NODE_ENV === 'production') {
    prisma = createPrismaClient()
} else {
    if (!global.prisma) {
        global.prisma = createPrismaClient()
    }
    prisma = global.prisma
}

module.exports = prisma