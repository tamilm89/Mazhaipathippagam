import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCart, getCartSubtotal, saveCart } from '../utils/cart'
import { getUser, login, register, requireLogin } from '../utils/auth'
import axios from '../utils/auth'

export default function Checkout(){
  const navigate = useNavigate()
  const cart = getCart()
  const subtotal = getCartSubtotal()
  const [shipping, setShipping] = useState({ name:'', address:'', city:'', state:'', postal:'', phone:'' })
  const [shippingLocked, setShippingLocked] = useState(false)
  const [payment, setPayment] = useState('card')
  const [card, setCard] = useState({number:'', name:'', exp:'', cvv:''})
  const [authState, setAuthState] = useState({ email:'', password:'', passwordConfirm:'', agree:false })
  const [authMode, setAuthMode] = useState('login') // or 'register'
  const [shippingValid, setShippingValid] = useState(false)
  const [paymentValid, setPaymentValid] = useState(false)
  const [cardErrors, setCardErrors] = useState([])

  if(cart.length===0) return <div>Your cart is empty</div>

  useEffect(()=>{
    // validate shipping fields
    const ok = validateShipping(shipping)
    setShippingValid(ok)
  }, [shipping])

  useEffect(()=>{
    // validate payment selection
    setPaymentValid(validatePaymentSelection())
  }, [payment, card, authState])

  async function handlePlaceOrder(){
    // final checks before placing order
    if(!shippingLocked) return alert('Please complete shipping details')
    if(!paymentValid) return alert('Please enter valid payment details')
    if(!requireLogin()){
      alert('Please log in or register before placing the order')
      return
    }
    const user = getUser()
    const orderPayload = {
      userId: user.id,
      cart_id: 'cart_'+Date.now(),
      items: cart,
      shipping,
      paymentMethod: payment,
      card: payment==='card' ? card : undefined,
      upi: payment==='upi' ? { vpa: card.number } : undefined,
      subtotal,
      total: subtotal + 50 + Math.round(subtotal*0.05)
    }
    try{
      const res = await axios.post('http://localhost:4000/api/orders', orderPayload)
      const order = res.data.order
      // clear cart
      saveCart([])
      navigate(`/order-success/${order.id}`)
    }catch(err){
      const msg = err?.response?.data?.error || err.message || 'Order placement failed'
      alert(msg)
    }
  }

  function handleLogin(){
    const res = login({ email: authState.email, password: authState.password })
    if(res.success){
      alert('Logged in')
    } else alert(res.message)
  }

  function handleRegister(){
    const res = register({ email: authState.email, password: authState.password, passwordConfirm: authState.passwordConfirm, agree: authState.agree })
    if(res.success){
      alert('Registered and logged in')
    } else alert(res.message)
  }

  // -- Validation helpers --
  function validateShipping(s){
    if(!s.name || !s.address || !s.city || !s.state || !s.postal || !s.phone) return false
    const phoneOK = /^\d{10}$/.test(s.phone)
    const pinOK = /^\d{6}$/.test(s.postal)
    return phoneOK && pinOK
  }

  function luhnCheck(num){
    const s = (num+'').replace(/\D/g,'')
    let sum = 0; let shouldDouble = false
    for(let i = s.length-1; i>=0; i--){
      let d = parseInt(s.charAt(i),10)
      if(shouldDouble){ d = d*2; if(d>9) d -=9 }
      sum += d
      shouldDouble = !shouldDouble
    }
    return sum % 10 === 0
  }

  function validateExpiry(exp){
    // accept MM/YY or MM/YYYY
    if(!exp) return false
    const parts = exp.split('/').map(p=>p.trim())
    if(parts.length!==2) return false
    let mm = Number(parts[0]); let yy = Number(parts[1])
    if(mm<1 || mm>12) return false
    if(parts[1].length===2) yy += 2000
    const expiry = new Date(yy, mm-1, 1)
    // set to last day of month
    const last = new Date(expiry.getFullYear(), expiry.getMonth()+1, 0)
    return last >= new Date()
  }

  function validateCVV(cvv){ return /^\d{3,4}$/.test(cvv) }

  function validateUPIVPA(vpa){ return /^[a-zA-Z0-9._\-]{2,}@[a-zA-Z]{2,}$/.test(vpa) }

  function validatePaymentSelection(){
    if(payment==='card'){
      const errs = []
      const number = (card.number||'').replace(/\s+/g,'')
      if(!/^[0-9]{13,19}$/.test(number) || !luhnCheck(number)) errs.push('Invalid card number')
      if(!validateExpiry(card.exp)) errs.push('Invalid expiry')
      if(!validateCVV(card.cvv)) errs.push('Invalid CVV')
      setCardErrors(errs)
      return errs.length===0
    }
    if(payment==='upi'){
      // use authState.password field temporarily for VPA input? Better add a small local state
      // For simplicity, expect user to enter VPA into card.number field when UPI selected
      return validateUPIVPA(card.number)
    }
    if(payment==='cod') return true
    return false
  }

  return (
    <div>
      <h2>Checkout</h2>

      <section className="card">
        <h3>1. Shipping Details {shippingLocked ? ' ✅' : ''}</h3>
        <div style={{display:'grid', gap:8}}>
          <input placeholder="Full name" value={shipping.name} onChange={e=>setShipping({...shipping, name:e.target.value})} />
          <input placeholder="Address Line 1" value={shipping.address} onChange={e=>setShipping({...shipping, address:e.target.value})} />
          <input placeholder="City" value={shipping.city} onChange={e=>setShipping({...shipping, city:e.target.value})} />
          <input placeholder="State / Province" value={shipping.state} onChange={e=>setShipping({...shipping, state:e.target.value})} />
          <input placeholder="Postal / PIN Code" value={shipping.postal} onChange={e=>setShipping({...shipping, postal:e.target.value})} />
          <input placeholder="Phone Number" value={shipping.phone} onChange={e=>setShipping({...shipping, phone:e.target.value})} />
          {!shippingLocked ? (
            <button className="button" disabled={!shippingValid} onClick={()=>{ if(!shippingValid) return; setShippingLocked(true)}}>Continue</button>
          ) : (
            <button onClick={()=>setShippingLocked(false)}>Edit</button>
          )}
          {!shippingValid && <div className="small">Phone must be 10 digits. PIN must be 6 digits.</div>}
        </div>
      </section>

      <section className="card" style={{marginTop:12}}>
        <h3>2. Payment</h3>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <label><input type="radio" name="pay" checked={payment==='card'} onChange={()=>setPayment('card')} /> Credit/Debit Card</label>
          <label><input type="radio" name="pay" checked={payment==='upi'} onChange={()=>setPayment('upi')} /> UPI</label>
          <label><input type="radio" name="pay" checked={payment==='cod'} onChange={()=>setPayment('cod')} /> Cash on Delivery</label>
        </div>
        {payment==='card' && (
          <div style={{display:'grid', gap:8}}>
            <input placeholder="Card number (no spaces)" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} />
            <input placeholder="Name on card" value={card.name} onChange={e=>setCard({...card, name:e.target.value})} />
            <input placeholder="MM/YY or MM/YYYY" value={card.exp} onChange={e=>setCard({...card, exp:e.target.value})} />
            <input placeholder="CVV" value={card.cvv} onChange={e=>setCard({...card, cvv:e.target.value})} />
            {cardErrors.length>0 && <div className="small" style={{color:'red'}}>{cardErrors.join('; ')}</div>}
          </div>
        )}
        {payment==='upi' && (
          <div style={{display:'grid', gap:8}}>
            <input placeholder="Enter VPA (example: name@bank)" value={card.number} onChange={e=>setCard({...card, number:e.target.value})} />
            {!validateUPIVPA(card.number) && <div className="small">Enter a valid VPA (e.g., user@bank)</div>}
          </div>
        )}
      </section>

      <section className="card" style={{marginTop:12}}>
        <h3>3. Login / Register</h3>
        {!requireLogin() ? (
          <div>
            <p>Guest checkout is not permitted. Please log in or register.</p>
            <div style={{display:'flex', gap:12}}>
              <button className="button" onClick={()=>setAuthMode('login')} disabled={authMode==='login'}>Login</button>
              <button className="button" onClick={()=>setAuthMode('register')} disabled={authMode==='register'}>Register</button>
            </div>
            {authMode==='login' ? (
              <div style={{display:'grid', gap:8, marginTop:8}}>
                <input placeholder="Email" value={authState.email} onChange={e=>setAuthState({...authState, email:e.target.value})} />
                <input placeholder="Password" type="password" value={authState.password} onChange={e=>setAuthState({...authState, password:e.target.value})} />
                <button className="button" onClick={handleLogin}>Log in</button>
              </div>
            ) : (
              <div style={{display:'grid', gap:8, marginTop:8}}>
                <input placeholder="Email" value={authState.email} onChange={e=>setAuthState({...authState, email:e.target.value})} />
                <input placeholder="Password" type="password" value={authState.password} onChange={e=>setAuthState({...authState, password:e.target.value})} />
                <input placeholder="Confirm password" type="password" value={authState.passwordConfirm} onChange={e=>setAuthState({...authState, passwordConfirm:e.target.value})} />
                <label><input type="checkbox" checked={authState.agree} onChange={e=>setAuthState({...authState, agree:e.target.checked})} /> I agree to Terms & Conditions</label>
                <button className="button" onClick={handleRegister}>Register</button>
              </div>
            )}
          </div>
        ) : (
          <div>Logged in as {getUser().email}</div>
        )}
      </section>

      <section className="card" style={{marginTop:12}}>
        <h3>4. Review & Place Order</h3>
        <div>Items: {cart.length}</div>
        <div>Subtotal: ₹{subtotal}</div>
        <div>Total: ₹{subtotal + 50 + Math.round(subtotal*0.05)}</div>
        <button className="button" onClick={handlePlaceOrder}>Place Order</button>
      </section>
    </div>
  )
}
