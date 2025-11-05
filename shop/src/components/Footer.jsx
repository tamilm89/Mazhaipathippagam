import React from 'react'

export default function Footer(){
  return (
    <footer style={{marginTop:24, paddingTop:18, borderTop:'1px solid #eee'}}>
      <div className="small">About Us | Contact | Privacy Policy</div>
      <div className="small">© {new Date().getFullYear()} Mazhipathippagam</div>
    </footer>
  )
}
