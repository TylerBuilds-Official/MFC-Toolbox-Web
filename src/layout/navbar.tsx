import React, { useState } from 'react';
import { NavLink } from "react-router-dom";
import { AuthButton } from '../components/AuthButton';
import '../styles/navbar.css';

const Navbar: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <header className="navbar">
            <div className="container nav-inner">
                <div className="navbar-brand">
                    <NavLink to="/" className="navbar-brand-link" onClick={closeMenu}>
                        <div className="navbar-brand-icon">FC</div>
                        <div className="navbar-brand-text">
                            <span className="navbar-brand-title">FabCore AI</span>
                            <span className="navbar-brand-subtitle">Internal Tools</span>
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
