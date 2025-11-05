const sgMail = require('@sendgrid/mail')
let twilio

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM = process.env.TWILIO_FROM // e.g. +12025550123 or Messaging Service SID (MG...)
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM // e.g. whatsapp:+14155238886
const DEFAULT_COUNTRY_CODE = process.env.DEFAULT_COUNTRY_CODE || '' // e.g. +91

if(SENDGRID_API_KEY){
  sgMail.setApiKey(SENDGRID_API_KEY)
}

function toE164(phone){
  if(!phone) return null
  const p = (''+phone).trim()
  if(p.startsWith('+')) return p
  const digits = p.replace(/\D/g,'')
  if(digits.length >= 10 && DEFAULT_COUNTRY_CODE){
    return DEFAULT_COUNTRY_CODE + digits
  }
  return null
}

async function sendEmail({ to, subject, text, html }){
  if(!SENDGRID_API_KEY || !EMAIL_FROM){
    console.info('sendEmail skipped: missing SENDGRID_API_KEY/EMAIL_FROM')
    return
  }
  const msg = { to, from: EMAIL_FROM, subject, text: text || (html? html.replace(/<[^>]+>/g,'') : ''), html }
  await sgMail.send(msg)
}

async function ensureTwilio(){
  if(!twilio){
    if(!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN){
      console.info('Twilio disabled: missing TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN')
      return null
    }
    // lazy import to avoid requiring when not installed in some envs
    // eslint-disable-next-line global-require
    twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  }
  return twilio
}

async function sendSMS({ to, body }){
  const client = await ensureTwilio()
  if(!client || !TWILIO_FROM){
    console.info('sendSMS skipped: Twilio not configured or TWILIO_FROM missing')
    return
  }
  const dest = toE164(to)
  if(!dest){
    console.info('sendSMS skipped: invalid phone for E.164; set DEFAULT_COUNTRY_CODE')
    return
  }
  await client.messages.create({ to: dest, from: TWILIO_FROM, body })
}

async function sendWhatsApp({ to, body }){
  const client = await ensureTwilio()
  if(!client || !TWILIO_WHATSAPP_FROM){
    console.info('sendWhatsApp skipped: Twilio WhatsApp not configured')
    return
  }
  const dest = toE164(to)
  if(!dest){
    console.info('sendWhatsApp skipped: invalid phone for E.164; set DEFAULT_COUNTRY_CODE')
    return
  }
  await client.messages.create({
    to: `whatsapp:${dest.replace(/^\+/, '+')}`,
    from: TWILIO_WHATSAPP_FROM.startsWith('whatsapp:') ? TWILIO_WHATSAPP_FROM : `whatsapp:${TWILIO_WHATSAPP_FROM}`,
    body
  })
}

function money(n){
  const val = Number(n || 0)
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR' }).format(val)
}

function buildOrderCreatedMessage(order){
  const subject = `Order ${order.id} confirmed`
  const lines = [
    `Thank you! Your order ${order.id} is confirmed.`,
    `Total: ${money(order.total)} | Payment: ${order.paymentMethod}`,
    `Status: ${order.status}`
  ]
  return { subject, text: lines.join('\n') }
}

function buildOrderUpdatedMessage(before, after){
  const changes = []
  if(before.status !== after.status){
    changes.push(`Status updated: ${before.status || 'N/A'} → ${after.status}`)
  }
  if(before.tracking !== after.tracking && after.tracking){
    changes.push(`Tracking ID: ${after.tracking}`)
  }
  const subject = `Order ${after.id} update`
  const text = changes.length ? changes.join('\n') : 'Your order has been updated.'
  return { subject, text }
}

async function notifyOrderCreated(order, recipient){
  const { email, phone } = recipient || {}
  const { subject, text } = buildOrderCreatedMessage(order)
  const tasks = []
  if(email) tasks.push(sendEmail({ to: email, subject, text }))
  if(phone) tasks.push(sendSMS({ to: phone, body: text }))
  // Optional: also WhatsApp if configured
  if(phone) tasks.push(sendWhatsApp({ to: phone, body: text }))
  await Promise.allSettled(tasks)
}

async function notifyOrderUpdated(before, after, recipient){
  const { email, phone } = recipient || {}
  const { subject, text } = buildOrderUpdatedMessage(before, after)
  const tasks = []
  if(email) tasks.push(sendEmail({ to: email, subject, text }))
  if(phone) tasks.push(sendSMS({ to: phone, body: text }))
  if(phone) tasks.push(sendWhatsApp({ to: phone, body: text }))
  await Promise.allSettled(tasks)
}

module.exports = {
  sendEmail,
  sendSMS,
  sendWhatsApp,
  notifyOrderCreated,
  notifyOrderUpdated
}
