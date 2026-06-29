"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Using a standard relative path or absolute alias depending on where your file is located
import './Header.css'; 

const Header = ({ user, actionButton, onLogoutClick }) => {
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);
    
    // Dynamically captures the current active path to compute active styles
    const pathname = usePathname();

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setIsInstallable(false);
        });
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Install prompt outcome: ${outcome}`);
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    // Helper to dynamically match current active state
    const isActive = (path) => pathname === path ? 'active' : '';

    return (
        <header className="site-header glass-header">
            <Link href="/" className="logo-text" style={{ textDecoration: 'none' }}>
                SmartMeal
            </Link>

            <nav className="nav-links">
                <Link href="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                <Link href="/products" className={`nav-link ${isActive('/products')}`}>Products</Link>
                <Link href="/community" className={`nav-link ${isActive('/community')}`}>Community</Link>
                <Link href="/contact" className={`nav-link ${isActive('/contact')}`}>Contact</Link>
                <Link href="/about" className={`nav-link ${isActive('/about')}`}>About</Link>
                <Link href="/family" className={`nav-link ${isActive('/family')}`}>Family Sync</Link>
                <Link href="/subscription" className={`nav-link premium-link ${isActive('/subscription')}`}>💎 Premium</Link>
            </nav>

            <div className="header-actions">
                {isInstallable && (
                    <button
                        className="nav-link install-btn"
                        onClick={handleInstallClick}
                        style={{ background: 'var(--primary-color, #6dba5f)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        📱 Install
                    </button>
                )}

                {user && (
                    <Link href="/settings" className={`nav-link settings-link ${isActive('/settings')}`} title="Settings" style={{ textDecoration: 'none' }}>
                        ⚙️
                    </Link>
                )}

                {user ? (
                    <div style={{ position: 'relative' }}>
                        <div className="user-badge" title={user.name} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                            {user.photoURL ? (
                                <img src={user.photoURL} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                user.name ? user.name[0].toUpperCase() : '👤'
                            )}
                        </div>
                        {userMenuOpen && (
                            <div className="lang-dropdown animate-fade-in" style={{ padding: '0', minWidth: '180px', right: '-10px' }}>
                                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>{user.name || "User"}</strong>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.subscriptionLevel || 'Basic'} Plan</span>
                                </div>
                                <Link href="/dashboard" className="lang-option" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>🏠 Dashboard</Link>
                                <Link href="/family" className="lang-option" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>👨‍👩‍👧 Family Sync</Link>
                                <Link href="/settings" className="lang-option" onClick={() => setUserMenuOpen(false)} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>⚙️ Settings</Link>
                                <div className="lang-option" onClick={() => { setUserMenuOpen(false); if(onLogoutClick) onLogoutClick(); }} style={{ color: '#ef4444', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                                    🚪 Logout
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    actionButton || <Link href="/login" className="login-btn" style={{ textDecoration: 'none' }}>Log In</Link>
                )}
            </div>
        </header>
    );
};

export default Header;