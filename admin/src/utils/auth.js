import axios from 'axios'

const ADMIN_USER_KEY = 'mp_admin_user_v1'
const API_BASE = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE
  ? import.meta.env.VITE_API_BASE
  : 'http://localhost:4000'

export function getAdminUser(){
  try{ return JSON.parse(localStorage.getItem(ADMIN_USER_KEY)) || JSON.parse(sessionStorage.getItem(ADMIN_USER_KEY)) }catch(e){ return null }
}

export function saveAdminUser(u, remember=true){
  const raw = JSON.stringify(u)
  if(remember) localStorage.setItem(ADMIN_USER_KEY, raw)
  else sessionStorage.setItem(ADMIN_USER_KEY, raw)
}

export function adminLogout(){ localStorage.removeItem(ADMIN_USER_KEY); sessionStorage.removeItem(ADMIN_USER_KEY) }

export function requireAdmin(){ return !!getAdminUser() }

export async function adminLogin({ email, password, remember=true }){
  const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password })
  const { user, token } = res.data
  if(user.role !== 'admin') throw new Error('Not an admin account')
  saveAdminUser({ ...user, token }, remember)
  return user
}

export const api = axios.create({ baseURL: API_BASE })
api.interceptors.request.use(cfg => {
  const u = getAdminUser()
  if(u?.token){ cfg.headers = cfg.headers || {}; cfg.headers.Authorization = `Bearer ${u.token}` }
  return cfg
})
