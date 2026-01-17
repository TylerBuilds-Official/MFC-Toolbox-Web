import React from 'react';
import '../styles/checkbox.css';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    label?: string;
    size?: 'small' | 'medium';
}

const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    disabled = false,
    label,
    size = 'medium',
}) => {
    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            if (!disabled) {
                onChange(!checked);
            }
        }
    };

    return (
        <div
            className={`checkbox-wrapper ${disabled ? 'checkbox-disabled' : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="checkbox"
            aria-checked={checked}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
        >
            <div className={`checkbox-box checkbox-${size} ${checked ? 'checkbox-checked' : ''}`}>
                {checked && (
                    <svg
                        className="checkbox-icon"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M3.5 8.5L6.5 11.5L12.5 4.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                )}
            </div>
            {label && <span className="checkbox-label">{label}</span>}
        </div>
    );
};

export default Checkbox;
