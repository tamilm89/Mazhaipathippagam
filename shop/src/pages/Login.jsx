import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { login } from '../utils/auth'

export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/'

  async function handle(){
    setLoading(true)
    const res = await login({ email, password, remember })
    setLoading(false)
    if(res.success){
      navigate(redirectTo)
    } else alert(res.message)
  }

  return (
    <div style={{maxWidth:420}} className="card">
      <h2>Sign in</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <label><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me</label>
      <button className="button" onClick={handle} disabled={loading}>{loading? 'Please wait...' : 'Sign in'}</button>
      <div className="small" style={{marginTop:8}}>Don't have an account? <Link to="/register">Register</Link></div>
    </div>
  )
}
