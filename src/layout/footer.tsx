import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import '../styles/footer.css';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <div className="footer-brand-icon">FC</div>
                    <span>Metals Fabrication Co.</span>
                </div>
                <Link to="/guide" className="footer-guide-link">
                    <BookOpen size={14} />
                    Guide
                </Link>
                <p className="footer-copy">&copy; {year} All rights reserved</p>
            </div>
        </footer>
    );
};

export default Footer;
