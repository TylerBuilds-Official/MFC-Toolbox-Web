import React from 'react';
import '../styles/loadingSpinner.css';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    variant?: 'primary' | 'secondary' | 'minimal';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'medium',
    message,
    variant = 'primary'
}) => {
    return (
        <div className={`loading-container loading-${variant}`}>
            <div className={`loading-spinner loading-spinner-${size}`}>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                {/* TODO: Replace with loading icon or better logo - PLACEHOLDER*/}
                <div className="spinner-logo">⚙️</div>
            </div>
            {message && <p className="loading-message">{message}</p>}
        </div>
    );
};

export default LoadingSpinner;