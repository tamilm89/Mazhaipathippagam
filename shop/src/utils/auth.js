import axios from 'axios'

const USER_KEY = 'mp_user_v1'
// Vite exposes env variables via import.meta.env. Use VITE_API_BASE for customization.
const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:4000'

export function getUser(){
  try{
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  }catch(e){ return null }
}

export function saveUser(u, remember = true){
  const raw = JSON.stringify(u)
  if(remember) localStorage.setItem(USER_KEY, raw)
  else sessionStorage.setItem(USER_KEY, raw)
}

export async function login({email, password, remember = true}){
  if(!email || !password) return { success:false, message:'Email and password required' }
  try{
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password })
    const { user, token } = res.data
    saveUser({ ...user, token }, remember)
    return { success:true, user }
  }catch(err){
    const msg = err?.response?.data?.error || err.message || 'Login failed'
    return { success:false, message: msg }
  }
}

export async function register({email, password, passwordConfirm, agree, remember = true}){
  if(!email || !password) return { success:false, message:'Email and password required' }
  if(password !== passwordConfirm) return { success:false, message:'Passwords do not match' }
  if(!agree) return { success:false, message:'You must agree to terms' }
  try{
    const res = await axios.post(`${API_BASE}/api/auth/register`, { email, password })
    const { user, token } = res.data
    saveUser({ ...user, token }, remember)
    return { success:true, user }
  }catch(err){
    const msg = err?.response?.data?.error || err.message || 'Registration failed'
    return { success:false, message: msg }
  }
}

export function logout(){ localStorage.removeItem(USER_KEY); sessionStorage.removeItem(USER_KEY) }

export function requireLogin(){ return !!getUser() }

// attach Authorization header if token present
axios.interceptors.request.use(cfg => {
  try{
    const u = getUser()
    if(u?.token){ cfg.headers = cfg.headers || {}; cfg.headers.Authorization = `Bearer ${u.token}` }
  }catch(e){}
  return cfg
})

export default axios
