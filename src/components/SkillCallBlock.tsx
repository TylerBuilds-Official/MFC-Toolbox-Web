import React, { memo } from 'react';
import '../styles/skillCallBlock.css';

interface SkillCallBlockProps {
    name: string;
    isComplete?: boolean;
}

/**
 * SkillCallBlock - Non-expandable indicator for skill reads
 * 
 * Displays a simplified, non-interactive block when Atlas reads a skill file.
 * Used when chat_render_hint === 'skill_read'
 */
const SkillCallBlock: React.FC<SkillCallBlockProps> = ({ name, isComplete = false }) => {
    // Extract skill name from tool name or params
    // e.g., "get_report_skill" -> "Report"
    const formatSkillName = (toolName: string): string => {
        // Remove common prefixes/suffixes
        let skillName = toolName
            .replace(/^get_/, '')
            .replace(/_skill$/, '')
            .replace(/_/g, ' ');
        
        // Title case
        return skillName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const skillDisplayName = formatSkillName(name);

    return (
        <div className={`skill-call-block ${isComplete ? 'complete' : 'running'}`}>
            <span className="skill-call-icon">
                {!isComplete ? (
                    <svg className="skill-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                            <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                )}
            </span>
            <span className="skill-call-text">
                {!isComplete ? 'Atlas is reading' : 'Atlas read'}
                <span className="skill-call-name">{skillDisplayName}</span>
                skill
            </span>
        </div>
    );
};

export default memo(SkillCallBlock);
