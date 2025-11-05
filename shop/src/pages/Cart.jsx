import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCart, updateQty, removeFromCart, getCartSubtotal } from '../utils/cart'

export default function Cart(){
  const navigate = useNavigate()
  const cart = getCart()
  const subtotal = getCartSubtotal()
  return (
    <div>
      <h2>Your Cart</h2>
      {cart.length===0 ? (
        <div>
          <p>Your cart is empty.</p>
          <Link to="/">Continue shopping</Link>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:16}}>
          <div>
            {cart.map(item=> (
              <div key={item.id} style={{display:'flex', gap:12, marginBottom:12, alignItems:'center', borderBottom:'1px solid #eee', paddingBottom:12}}>
                <img src={item.cover} alt={item.title} style={{width:80}} />
                <div>
                  <div>{item.title}</div>
                  <div className="small">{item.author}</div>
                  <div style={{marginTop:8}}>
                    <input type="number" min={1} max={item.stock} value={item.qty} onChange={e=>updateQty(item.id, Number(e.target.value))} />
                    <button className="small" onClick={()=>removeFromCart(item.id)}>Remove</button>
                  </div>
                </div>
                <div style={{marginLeft:'auto'}}>₹{item.price * item.qty}</div>
              </div>
            ))}
          </div>

          <aside className="card">
            <h3>Summary</h3>
            <div>Subtotal: ₹{subtotal}</div>
            <div>Shipping: ₹50</div>
            <div>Taxes: ₹{Math.round(subtotal*0.05)}</div>
            <div style={{fontWeight:700, marginTop:8}}>Total: ₹{subtotal + 50 + Math.round(subtotal*0.05)}</div>
            <button className="button" onClick={()=>navigate('/checkout')}>Proceed to Checkout</button>
          </aside>
        </div>
      )}
    </div>
  )
}
