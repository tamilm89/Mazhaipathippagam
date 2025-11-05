import React from 'react'
import { orders } from '../data/mockOrders'

export default function Dashboard(){
  const totalSales = orders.reduce((s,o)=>s+o.total,0)
  const newOrders = orders.length
  const lowStockAlerts = 3 // placeholder
  return (
    <div>
      <h2>Dashboard</h2>
      <div style={{display:'flex', gap:12}}>
        <div className="card">Total Sales: ₹{totalSales}</div>
        <div className="card">New Orders: {newOrders}</div>
        <div className="card">Low Stock Alerts: {lowStockAlerts}</div>
      </div>
    </div>
  )
}
