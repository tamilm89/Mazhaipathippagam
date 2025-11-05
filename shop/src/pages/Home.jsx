import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from '../utils/auth'

const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:4000'

export default function Home(){
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await axios.get(`${API_BASE}/api/products`)
        if(mounted) setProducts(res.data)
      }catch(err){
        // fallback: try importing local mock
        try{
          const mod = await import('../data/books')
          if(mounted) setProducts(mod.books || [])
        }catch(e){
          if(mounted) setError('Failed to load products')
        }
      }finally{ if(mounted) setLoading(false) }
    }
    fetch()
    return ()=>{ mounted = false }
  }, [])

  const newArrivals = products.slice(0,10)
  const bestSellers = products.slice(0,8)
  const categories = [...new Set(products.flatMap(b=> b.category || []))]

  if(loading) return <div>Loading...</div>
  if(error) return <div>{error}</div>

  return (
    <div>
      <section style={{display:'flex', gap:16, alignItems:'center', marginBottom:18}}>
        <div style={{flex:1}}>
          <h1>New Release: {newArrivals[0]?.title_english || newArrivals[0]?.title_tamil}</h1>
          <p className="small">Limited time offer — free shipping above ₹1000</p>
          <Link to="/category/Fiction" className="button">Shop Now</Link>
        </div>
        {newArrivals[0] && <img src={newArrivals[0].cover_image_url || newArrivals[0].cover} alt="hero" style={{width:180, borderRadius:6}} />}
      </section>

      <section>
        <h2>New Arrivals</h2>
        <div className="grid">
          {newArrivals.map(b=> (
            <div className="card" key={b.product_id || b.id}>
              <img src={b.cover_image_url || b.cover} alt="cover" style={{width:'100%'}} />
              <h3>{b.title_tamil || b.title_english}</h3>
              <div className="small">{b.author}</div>
              <div style={{marginTop:8}}>
                <Link to={`/product/${b.product_id || b.id}`} className="button">View</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:18}}>
        <h2>Best Sellers</h2>
        <div className="grid">
          {bestSellers.map(b=> (
            <div className="card" key={b.product_id || b.id}>
              <img src={b.cover_image_url || b.cover} alt="cover" style={{width:'100%'}} />
              <h3>{b.title_tamil || b.title_english}</h3>
              <div className="small">{b.author}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:18}}>
        <h2>Categories</h2>
        <div style={{display:'flex', gap:12}}>
          {categories.map(cat=> (
            <Link key={cat} to={`/category/${cat}`} className="card" style={{minWidth:150}}>{cat}</Link>
          ))}
        </div>
      </section>
    </div>
  )
}
