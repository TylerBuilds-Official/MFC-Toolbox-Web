import React from 'react';
import '../styles/loadingDots.css';

interface LoadingDotsProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    variant?: 'primary' | 'secondary' | 'minimal';
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 'medium', message = 'Loading...', variant = 'primary' }) => {
    return (
        <div className={`loading-dots ${size} ${variant}`}>
            <span className='loading-dot'></span>
            <span className='loading-dot'></span>
            <span className='loading-dot'></span>
            {message && <p className='loading-message'>{message}</p>}
        </div>
    );
};

export default LoadingDots;