import React, { useState } from 'react';
import '../styles/thinkingBlock.css';

interface ThinkingBlockProps {
    content: string;
    isStreaming?: boolean;
}

const ThinkingBlock: React.FC<ThinkingBlockProps> = ({ content, isStreaming = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);  // Collapsed by default

    if (!content && !isStreaming) return null;

    return (
        <div className={`thinking-block ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <button 
                className="thinking-header"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span className="thinking-icon">
                    {isStreaming ? (
                        <svg className="thinking-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                                <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                            </circle>
                        </svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 16v-4"/>
                            <path d="M12 8h.01"/>
                        </svg>
                    )}
                </span>
                <span className="thinking-label">
                    {isStreaming ? 'Thinking...' : 'Thought process'}
                </span>
                <span className={`thinking-chevron ${isExpanded ? 'expanded' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </span>
            </button>
            
            {isExpanded && (
                <div className="thinking-content">
                    <pre>{content || (isStreaming ? '...' : '')}</pre>
                </div>
            )}
        </div>
    );
};

export default ThinkingBlock;
