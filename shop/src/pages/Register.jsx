import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { register } from '../utils/auth'

export default function Register(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handle(){
    setLoading(true)
    const res = await register({ email, password, passwordConfirm, agree })
    setLoading(false)
    if(res.success){
      navigate('/')
    } else alert(res.message)
  }

  return (
    <div style={{maxWidth:420}} className="card">
      <h2>Create account</h2>
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <input placeholder="Confirm password" type="password" value={passwordConfirm} onChange={e=>setPasswordConfirm(e.target.value)} />
      <label><input type="checkbox" checked={agree} onChange={e=>setAgree(e.target.checked)} /> I agree to Terms & Conditions</label>
      <button className="button" onClick={handle} disabled={loading || !agree}>{loading? 'Please wait...' : 'Register'}</button>
    </div>
  )
}
