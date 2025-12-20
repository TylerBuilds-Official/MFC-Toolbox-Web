import React from 'react';

type toolExpandProps = {
    activeToolId: string | null,
    tool: { id: string }
};

const ToolExpandIcon: React.FC<toolExpandProps> = ({ activeToolId, tool }) => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5c545a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                transform: activeToolId === tool.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease'
            }}
        >
            <polyline points="6 9 12 15 18 9" />
        </svg>
    );
};

export default ToolExpandIcon;
