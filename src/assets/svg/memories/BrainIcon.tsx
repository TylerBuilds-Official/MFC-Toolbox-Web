import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

const BrainIcon: React.FC<IconProps> = ({ size = 16, className }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Brain outline - side profile with lobes */}
        <path d="M20 10c0-2-.8-3.5-2-4.5C17 4.5 15.5 4 14 4c-1 0-2 .2-3 .6C10 4.2 9 4 8 4 6 4 4.5 5 3.5 6.5 2.5 8 2 9.5 2 11c0 1.5.5 3 1.5 4 .5.5 1 1 1.5 1.3 0 1.2.5 2.2 1.5 3 1 .7 2 1.2 3.5 1.2 1 0 2-.2 3-.7 1 .5 2 .7 3 .7 2 0 3.5-1 4.5-2.5.8-1.2 1-2.5 1-4 0-1-.2-2-.5-3z" />
        {/* Sulci (brain folds) */}
        <path d="M7 9c1.5 0 2.5 1 4 1s2.5-1 4-1" />
        <path d="M8 13c1 0 2 .5 3 .5s2-.5 3-.5" />
        {/* Cerebellum hint */}
        <path d="M17 15c.5.5 1 1.5 1 2.5" />
    </svg>
);

export default BrainIcon;
