import React, { useEffect, useState } from 'react'
import { api } from '../utils/auth'

export default function Orders(){
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    let alive = true
    ;(async()=>{
      try{
        const res = await api.get('/api/orders')
        if(alive) setOrders(res.data)
      }catch(e){
        alert(e?.response?.data?.error || e.message || 'Failed to load orders')
      }finally{ if(alive) setLoading(false) }
    })()
    return ()=>{ alive = false }
  },[])

  function updateStatus(id, status){
    setOrders(prev => prev.map(o=> o.id===id? {...o, status}: o))
    api.put(`/api/orders/${id}`, { status }).catch(()=>{})
  }
  function updateTracking(id, tracking){
    setOrders(prev => prev.map(o=> o.id===id? {...o, tracking}: o))
    api.put(`/api/orders/${id}`, { tracking }).catch(()=>{})
  }

  return (
    <div>
      <h2>Orders</h2>
      {loading? <div>Loading…</div> : null}
      <table className="table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Tracking</th><th>Action</th></tr></thead>
        <tbody>
          {orders.map(o=> (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.userId}</td>
              <td>{new Date(o.date).toLocaleString()}</td>
              <td>₹{o.total || 0}</td>
              <td>
                <select value={o.status} onChange={e=>updateStatus(o.id, e.target.value)}>
                  <option>Processing</option>
                  <option>Shipped</option>
                  <option>Delivered</option>
                </select>
              </td>
              <td><input value={o.tracking||''} onChange={e=>updateTracking(o.id, e.target.value)} /></td>
              <td><button className="button">View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
