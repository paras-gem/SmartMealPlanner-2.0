"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '@/components/DarkmodeToogle';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Header.css';

const Header = () => {
    const [user, setUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser || null);
        });
        return () => unsub();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        setUserMenuOpen(false);
        router.push('/');
    };

    const isActive = (path) => pathname === path ? 'active' : '';

    return (
        <header className="site-header glass-header">
            <Link href="/" className="logo-text" style={{ textDecoration: 'none' }}>
                SmartMeal
            </Link>

            <nav className="nav-links">
                <Link href="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                <Link href="/products" className={`nav-link ${isActive('/products')}`}>Recipes</Link>
                <Link href="/community" className={`nav-link ${isActive('/community')}`}>Community</Link>
                <Link href="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                {user && <Link href="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>}
            </nav>

            <div className="header-actions">
                <ThemeToggle />

                {user ? (
                    <div style={{ position: 'relative' }}>
                        <div
                            className="user-badge"
                            title={user.displayName || user.email}
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            style={{ cursor: 'pointer' }}
                        >
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                (user.displayName || user.email)?.[0]?.toUpperCase() || '👤'
                            )}
                        </div>

                        {userMenuOpen && (
                            <div className="lang-dropdown animate-fade-in" style={{ padding: '0', minWidth: '200px', right: '-10px' }}>
                                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{user.displayName || 'User'}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</span>
                                </div>
                                <Link href="/dashboard" className="lang-option" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>🏠 Dashboard</Link>
                                <Link href="/settings" className="lang-option" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>⚙️ Settings</Link>
                                <div
                                    className="lang-option"
                                    onClick={handleLogout}
                                    style={{ color: '#ef4444', borderTop: '1px solid var(--border)', cursor: 'pointer' }}
                                >
                                    🚪 Log Out
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <Link href="/login" className="login-btn" style={{ textDecoration: 'none' }}>Log In</Link>
                )}
            </div>
        </header>
    );
};

export default Header;