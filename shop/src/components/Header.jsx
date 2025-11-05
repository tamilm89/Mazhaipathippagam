import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCartCount } from '../utils/cart'
import { getUser, logout } from '../utils/auth'

export default function Header(){
  const navigate = useNavigate()
  const count = getCartCount()
  const user = getUser()
  const [open, setOpen] = React.useState(false)
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase()
  return (
    <header className="header">
      <div className="logo"><Link to="/">Mazhipathippagam</Link></div>
      <nav className="nav" style={{position:'relative'}}>
        <Link to="/">Home</Link>
        <Link to="/category/Fiction">Fiction</Link>
        <Link to="/category/Poetry">Poetry</Link>
        <Link to="/category/Self-Help">Self-Help</Link>
        <button className="button" onClick={()=>navigate('/cart')}>Cart ({count})</button>
        {user ? (
          <div style={{marginLeft:8, position:'relative'}}>
            <button onClick={()=>setOpen(o=>!o)} style={{display:'flex', alignItems:'center', gap:8, background:'transparent', border:'none', cursor:'pointer'}}>
              <div style={{width:28, height:28, borderRadius:'50%', background:'#0b73ff', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center'}}>{initial}</div>
              <span className="small">{user.name || user.email}</span>
            </button>
            {open && (
              <div className="card" style={{position:'absolute', right:0, top:36, minWidth:160, zIndex:10}}>
                <div><Link to="/orders" onClick={()=>setOpen(false)}>My Orders</Link></div>
                <div style={{marginTop:8}}><button className="button" onClick={()=>{ logout(); setOpen(false); navigate('/') }}>Logout</button></div>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link to="/login" style={{marginLeft:8}}>Login</Link>
          </>
        )}
      </nav>
    </header>
  )
}
