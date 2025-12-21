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
                    <div className="navbar-brand-icon">MF</div>
                    <div className="navbar-brand-text">
                        <span className="navbar-brand-title">MFC Toolbox</span>
                        <span className="navbar-brand-subtitle">Internal Tools</span>
                    </div>
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
                        to="/settings" 
                        end 
                        className={({ isActive }) => isActive ? "active" : undefined} 
                        onClick={closeMenu}
                    >
                        Settings
                    </NavLink>
                    <AuthButton className="nav-auth-btn" />
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
