"use client";

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  
  return (
    <header className="bookclub-header">
      <Link href="/" className="logo">Book Club</Link>
      {user && (
        <nav className="bookclub-nav">
          <Link href="/add-book">Add Book</Link>
          <Link href="/write">Write</Link>
          <button 
            onClick={logout} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              fontFamily: 'inherit', 
              fontSize: 'inherit', 
              textTransform: 'inherit', 
              letterSpacing: 'inherit',
              cursor: 'pointer' 
            }}>
            Sign Out
          </button>
        </nav>
      )}
    </header>
  );
}
