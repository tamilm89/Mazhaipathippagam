import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { requireLogin } from '../utils/auth'

export default function RequireAuth({ children }){
  const location = useLocation()
  if(!requireLogin()){
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}
