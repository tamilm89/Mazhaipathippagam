import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from '../utils/auth'

export default function OrderSuccess(){
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function fetchOrder(){
      try{
        const res = await axios.get(`http://localhost:4000/api/orders/${orderId}`)
        if(mounted) setOrder(res.data)
      }catch(err){
        if(mounted) setError(err?.response?.data?.error || err.message)
      }
    }
    fetchOrder()
    return ()=>{ mounted = false }
  }, [orderId])

  if(error) return <div>{error}</div>
  if(!order) return <div>Loading...</div>

  return (
    <div>
      <h2>Thank you for your order!</h2>
      <div>Order ID: {order.id}</div>
      <div>Total: ₹{order.total}</div>
      <h3>Items</h3>
      <ul>
        {order.items.map(i=> <li key={i.product_id || i.id}>{i.title || i.title_english || i.product_id} x {i.qty}</li>)}
      </ul>
      <Link to="/">Continue Shopping</Link>
    </div>
  )
}
