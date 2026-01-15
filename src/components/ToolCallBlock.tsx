import React, { useState, memo } from 'react';
import '../styles/toolCallBlock.css';

interface ToolCallBlockProps {
    name: string;
    params?: Record<string, unknown>;
    result?: string;
    isComplete?: boolean;
}

const ToolCallBlock: React.FC<ToolCallBlockProps> = ({ name, params, isComplete = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const hasParams = params && Object.keys(params).length > 0;

    // Format params as readable key: value lines
    const formatParams = (params: Record<string, unknown>): string => {
        return Object.entries(params)
            .map(([key, value]) => {
                const strValue = typeof value === 'string' 
                    ? value 
                    : JSON.stringify(value, null, 2);
                return `${key}: ${strValue}`;
            })
            .join('\n');
    };

    return (
        <div className={`tool-call-block ${isExpanded ? 'expanded' : 'collapsed'} ${isComplete ? 'complete' : 'running'}`}>
            <button 
                className="tool-call-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="tool-call-icon">
                    {!isComplete ? (
                        <svg className="tool-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                                <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                            </circle>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    )}
                </span>
                <span className="tool-call-label">
                    {!isComplete ? 'Calling:' : 'Called:'}
                </span>
                <span className="tool-call-name">{name}</span>
                {hasParams && (
                    <span className={`tool-call-chevron ${isExpanded ? 'expanded' : ''}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </span>
                )}
            </button>
            
            {isExpanded && hasParams && (
                <div className="tool-call-content">
                    <pre>{formatParams(params)}</pre>
                </div>
            )}
        </div>
    );
};

export default memo(ToolCallBlock);
