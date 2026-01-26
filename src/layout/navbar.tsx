import React, { useState } from 'react';
import { NavLink, useLocation } from "react-router-dom";
import { AuthButton } from '../components/AuthButton';
import { useNavbarContext } from '../hooks';
import '../styles/navbar.css';

// Default page context configuration (fallback when pages don't set their own)
const DEFAULT_PAGE_CONTEXTS: Record<string, { label: string; description?: string }> = {
    '/': { label: 'Home', description: 'Dashboard' },
    '/chat': { label: 'Chat', description: 'Atlas Assistant' },
    '/data': { label: 'Data', description: 'Sessions & Analytics' },
    '/settings': { label: 'Settings', description: 'Preferences' },
    '/guide': { label: 'Guide', description: 'Documentation' },
};

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();
    const { pageLabel, pageDescription } = useNavbarContext();
    
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    // Get current page context - prefer dynamic context from pages, fallback to defaults
    const currentPath = location.pathname;
    const defaultContext = DEFAULT_PAGE_CONTEXTS[currentPath] || 
        // Check for partial matches (e.g., /guide/models matches /guide)
        Object.entries(DEFAULT_PAGE_CONTEXTS).find(([path]) => 
            path !== '/' && currentPath.startsWith(path)
        )?.[1];

    // Use dynamic context if set, otherwise use default
    const displayLabel = pageLabel || defaultContext?.label;
    const displayDescription = pageDescription !== null ? pageDescription : defaultContext?.description;

    return (
        <header className="navbar">
            <div className="container nav-inner">
                <div className="navbar-brand">
                    <NavLink to="/" className="navbar-brand-link" onClick={closeMenu}>
                        <div className="navbar-brand-icon">FC</div>
                        <div className="navbar-brand-text">
                            <span className="navbar-brand-title">FabCore AI</span>
                            {displayLabel ? (
                                <div className="navbar-brand-context">
                                    <span className="navbar-context-label">{displayLabel}</span>
                                    {displayDescription && (
                                        <>
                                            <span className="navbar-context-divider">·</span>
                                            <span className="navbar-context-description">{displayDescription}</span>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <span className="navbar-brand-subtitle">Internal Tools</span>
                            )}
                        </div>
                    </NavLink>
                </div>

                <button 
                    className="hamburger" 
                    aria-label="Toggle Menu" 
                    onClick={toggleMenu} 
                    aria-expanded={isMenuOpen}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                <nav 
                    className={`nav-menu ${isMenuOpen ? 'nav-open' : ''}`}
                    aria-label="Primary Navigation"
                >
                    <NavLink 
                        to="/" 
                        end 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Home
                    </NavLink>
                    <NavLink 
                        to="/chat" 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Chat
                    </NavLink>
                    <NavLink 
                        to="/data" 
                        end 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Data
                    </NavLink>
                    <NavLink 
                        to="/settings" 
                        end 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Settings
                    </NavLink>
                    <NavLink 
                        to="/guide" 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Guide
                    </NavLink>
                    <AuthButton className="nav-auth-btn" />
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
