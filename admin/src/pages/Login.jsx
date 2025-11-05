import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminLogin } from '../utils/auth'

export default function Login(){
  const [email, setEmail] = useState('admin@local')
  const [password, setPassword] = useState('admin')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  async function handle(){
    try{
      setLoading(true)
      await adminLogin({ email, password, remember })
      navigate('/')
    }catch(e){
      alert(e.message || 'Login failed')
    }finally{ setLoading(false) }
  }
  return (
    <div style={{maxWidth:420}} className="card">
  <h2>Admin Login</h2>
  <input placeholder="email" value={email} onChange={e=>setEmail(e.target.value)} />
  <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
  <label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
  <button className="button" onClick={handle} disabled={loading}>{loading? 'Signing in...' : 'Login'}</button>
    </div>
  )
}
