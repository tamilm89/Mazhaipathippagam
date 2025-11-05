#!/usr/bin/env node
/**
 * Migration script: Import existing JSON data into Postgres
 * Usage: node scripts/migrate-json-to-db.js
 * Requires: DATABASE_URL env var set
 */

const fs = require('fs')
const path = require('path')
const prisma = require('../lib/db')

async function main(){
  if(!process.env.DATABASE_URL){
    console.error('ERROR: DATABASE_URL not set. Export it first.')
    process.exit(1)
  }

  console.log('Starting JSON → Postgres migration...\n')

  // 1. Import users
  const usersFile = path.join(__dirname, '..', 'data', 'users.json')
  if(fs.existsSync(usersFile)){
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'))
    console.log(`Importing ${users.length} users...`)
    for(const u of users){
      await prisma.user.upsert({
        where: { id: u.id },
        update: {},
        create: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          role: u.role || 'user'
        }
      })
    }
    console.log('✓ Users imported\n')
  } else {
    console.log('⚠ users.json not found, skipping\n')
  }

  // 2. Import products
  const productsFile = path.join(__dirname, '..', 'data', 'products.json')
  if(fs.existsSync(productsFile)){
    const products = JSON.parse(fs.readFileSync(productsFile, 'utf8'))
    console.log(`Importing ${products.length} products...`)
    for(const p of products){
      await prisma.product.upsert({
        where: { product_id: p.product_id },
        update: {},
        create: {
          product_id: p.product_id,
          title_tamil: p.title_tamil || '',
          title_english: p.title_english || '',
          author: p.author || '',
          price: Number(p.price) || 0,
          description: p.description || '',
          category: Array.isArray(p.category) ? p.category : [],
          isbn_13: p.isbn_13 || '',
          publisher: p.publisher || '',
          publication_year: p.publication_year || new Date().getFullYear(),
          page_count: p.page_count || 0,
          cover_image_url: p.cover_image_url || '',
          stock_quantity: p.stock_quantity || p.stock || 0,
          status: p.status || 'Published'
        }
      })
    }
    console.log('✓ Products imported\n')
  } else {
    console.log('⚠ products.json not found, skipping\n')
  }

  // 3. Import orders (with items)
  const ordersFile = path.join(__dirname, '..', 'data', 'orders.json')
  if(fs.existsSync(ordersFile)){
    const orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'))
    console.log(`Importing ${orders.length} orders...`)
    for(const o of orders){
      // check if order exists
      const existing = await prisma.order.findUnique({ where: { id: o.id } })
      if(existing){
        console.log(`  Skip existing order ${o.id}`)
        continue
      }
      // create order with items
      const items = o.items || []
      await prisma.order.create({
        data: {
          id: o.id,
          userId: o.userId,
          cart_id: o.cart_id,
          shipping: o.shipping,
          paymentMethod: o.paymentMethod,
          subtotal: o.subtotal || 0,
          total: o.total || 0,
          status: o.status || 'Processing',
          tracking: o.tracking,
          date: o.date ? new Date(o.date) : new Date(),
          items: {
            create: items.map(item => ({
              productId: item.product_id || item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      })
    }
    console.log('✓ Orders imported\n')
  } else {
    console.log('⚠ orders.json not found, skipping\n')
  }

  console.log('Migration complete!')
}

main()
  .catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
