import React, { useEffect, useState } from 'react'
import { api } from '../utils/auth'

export default function Products(){
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title_english:'', author:'', price:0, stock_quantity:0, title_tamil:'' })

  useEffect(()=>{
    let alive = true
    ;(async()=>{
      try{
        const res = await api.get('/api/products')
        if(alive) setProducts(res.data)
      }catch(e){
        alert(e?.response?.data?.error || e.message || 'Failed to load products')
      }
    })()
    return ()=>{ alive=false }
  },[])

  function addProduct(){
    api.post('/api/products', form).then(res=>{
      setProducts(prev=> [res.data, ...prev])
      setShowForm(false)
      setForm({ title_english:'', author:'', price:0, stock_quantity:0, title_tamil:'' })
    }).catch(e=> alert(e?.response?.data?.error || e.message || 'Create failed'))
  }

  function remove(product_id){
    api.delete(`/api/products/${product_id}`).then(()=>{
      setProducts(prev=> prev.filter(p=>p.product_id!==product_id))
    }).catch(e=> alert(e?.response?.data?.error || e.message || 'Delete failed'))
  }

  return (
    <div>
      <h2>Products</h2>
      <div style={{marginBottom:12}}><button className="button" onClick={()=>setShowForm(s=>!s)}>Add New</button></div>
      {showForm && (
        <div className="card">
          <input placeholder="Title (English)" value={form.title_english} onChange={e=>setForm({...form, title_english:e.target.value})} />
          <input placeholder="Title (Tamil)" value={form.title_tamil} onChange={e=>setForm({...form, title_tamil:e.target.value})} />
          <input placeholder="Author" value={form.author} onChange={e=>setForm({...form,author:e.target.value})} />
          <input placeholder="Price" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})} />
          <input placeholder="Stock" value={form.stock_quantity} onChange={e=>setForm({...form,stock_quantity:Number(e.target.value)})} />
          <button className="button" onClick={addProduct}>Create</button>
        </div>
      )}

      <table className="table">
        <thead><tr><th>ID</th><th>Title</th><th>Author</th><th>Price</th><th>Stock</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {products.map(p=> (
            <tr key={p.product_id}>
              <td>{p.product_id}</td>
              <td>{p.title_english || p.title_tamil}</td>
              <td>{p.author}</td>
              <td>₹{p.price}</td>
              <td>{p.stock_quantity}</td>
              <td>{p.status}</td>
              <td><button className="button" onClick={()=>remove(p.product_id)}>Delete</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
