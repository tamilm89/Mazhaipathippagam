import React, { useEffect, useState } from 'react'
import { getUser } from '../utils/auth'
import axios from '../utils/auth'
import { Link } from 'react-router-dom'

export default function OrderHistory(){
  const user = getUser()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(()=>{
    if(!user) return
    let mounted = true
    async function fetch(){
      try{
        const res = await axios.get(`http://localhost:4000/api/orders?userId=${user.id}`)
        if(mounted) setOrders(res.data)
      }catch(err){
        if(mounted) setError(err?.response?.data?.error || err.message)
      }
    }
    fetch()
    return ()=>{ mounted = false }
  }, [user])

  if(!user) return <div>Please log in to view orders.</div>
  if(error) return <div>{error}</div>
  if(orders===null) return <div>Loading...</div>

  return (
    <div>
      <h2>Your Orders</h2>
      {orders.length===0 ? <div>No orders yet.</div> : (
        <table style={{width:'100%'}}>
          <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map(o=> (
              <tr key={o.id}>
                <td><Link to={`/order-success/${o.id}`}>{o.id}</Link></td>
                <td>{new Date(o.date).toLocaleString()}</td>
                <td>₹{o.total}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
