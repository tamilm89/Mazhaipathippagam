import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import { requireAdmin, adminLogout, getAdminUser } from './utils/auth'

function AdminGuard({ children }){
  if(!requireAdmin()) return <Navigate to="/login" replace />
  return children
}

export default function App(){
  return (
    <div>
      <header className="header">
        <div style={{fontWeight:700}}>Mazhipathippagam — Admin</div>
        <nav>
          <Link to="/">Dashboard</Link> | <Link to="/orders">Orders</Link> | <Link to="/products">Products</Link>
          {getAdminUser() && (
            <>
              {' '}| <button className="button" onClick={()=>{ adminLogout(); window.location.href='/login' }}>Logout</button>
            </>
          )}
        </nav>
      </header>

      <main style={{marginTop:18}}>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/" element={<AdminGuard><Dashboard/></AdminGuard>} />
          <Route path="/orders" element={<AdminGuard><Orders/></AdminGuard>} />
          <Route path="/products" element={<AdminGuard><Products/></AdminGuard>} />
        </Routes>
      </main>
    </div>
  )
}
