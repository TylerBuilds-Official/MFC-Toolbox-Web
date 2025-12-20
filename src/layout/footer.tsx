import React from 'react';
import '../styles/footer.css';

const Footer: React.FC = () => {
    const year = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="container footer-inner">
                <div className="footer-brand">
                    <div className="footer-brand-icon">MF</div>
                    <span>Metals Fabrication Co.</span>
                </div>
                <p className="footer-copy">&copy; {year} All rights reserved</p>
            </div>
        </footer>
    );
};

export default Footer;
