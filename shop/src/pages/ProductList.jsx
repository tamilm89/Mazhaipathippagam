import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import axios from '../utils/auth'

const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:4000'

export default function ProductList(){
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [list, setList] = useState(null)
  const [error, setError] = useState(null)

  useEffect(()=>{
    let mounted = true
    async function fetch(){
      try{
        const res = await axios.get(`${API_BASE}/api/products`)
        let data = res.data || []
        if(slug) data = data.filter(b=> (b.category || []).includes(slug) )
        if(q) data = data.filter(b=> (b.title_english||b.title_tamil||'').toLowerCase().includes(q.toLowerCase()))
        if(mounted) setList(data)
      }catch(err){
        try{ const mod = await import('../data/books'); if(mounted) setList(mod.books || []) }catch(e){ if(mounted) setError('Failed to load products') }
      }
    }
    fetch()
    return ()=>{ mounted = false }
  }, [slug, q])

  if(error) return <div>{error}</div>
  if(list===null) return <div>Loading...</div>

  return (
    <div>
      <h2>{slug ? slug : 'All Books'}</h2>
      <div className="grid">
        {list.map(b=> (
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
    </div>
  )
}
