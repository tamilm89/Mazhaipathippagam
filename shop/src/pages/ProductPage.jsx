import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from '../utils/auth'
import { addToCart } from '../utils/cart'

export default function ProductPage(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [qty, setQty] = useState(1)
  const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
    ? import.meta.env.VITE_API_BASE
    : 'http://localhost:4000'

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await axios.get(`${API_BASE}/api/products/${id}`)
        if(mounted) setBook(res.data)
      }catch(err){
        // fallback to local mock
        try{
          const mod = await import('../data/books')
          const found = (mod.books || []).find(b=> b.product_id===id || b.id===id)
          if(mounted) setBook(found)
        }catch(e){
          if(mounted) setError('Product not found')
        }
      }finally{ if(mounted) setLoading(false) }
    }
    fetch()
    return ()=>{ mounted = false }
  }, [id])

  if(loading) return <div>Loading...</div>
  if(error || !book) return <div>Product not found</div>

  return (
    <div style={{display:'flex', gap:18}}>
      <img src={book.cover_image_url || book.cover} alt={book.title_english || book.title_tamil} style={{width:260}} />
      <div>
        <h2>{book.title_tamil}</h2>
        {book.title_english && <div style={{fontStyle:'italic'}}>{book.title_english}</div>}
        <div className="small">{book.author} — {book.publisher}</div>
        <p style={{marginTop:12}}>{book.description}</p>
        <div style={{marginTop:12}}><strong>₹{book.price}</strong></div>
        <div className="small">ISBN: {book.isbn_13}</div>
        <div className="small">Stock: {book.stock_quantity}</div>
        <div className="small">Pages: {book.page_count} • Year: {book.publication_year}</div>

        <div style={{marginTop:12, display:'flex', gap:8, alignItems:'center'}}>
          <input type="number" min={1} max={book.stock_quantity||99} value={qty} onChange={e=>setQty(Number(e.target.value))} />
          <button className="button" onClick={()=>{ addToCart(book, qty); navigate('/cart') }}>Add to Cart</button>
          <button className="button" onClick={()=>{ addToCart(book, qty); navigate('/checkout') }}>Buy Now</button>
        </div>
      </div>
    </div>
  )
}
