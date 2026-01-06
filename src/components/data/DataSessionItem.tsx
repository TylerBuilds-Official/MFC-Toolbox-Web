/**
 * DataSessionItem - Individual session in the sessions sidebar
 * Displays tool name, status, parameters preview, and timestamp
 * Shows detailed tooltip on hover
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { DataSession } from '../../types/data';
import { useConfirm } from '../ConfirmDialog';
import DataSessionTooltip from './DataSessionTooltip';
import styles from '../../styles/data_page/DataSessionSidebar.module.css';

interface DataSessionItemProps {
    session: DataSession;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

// Tool emoji mapping
const TOOL_ICONS: Record<string, string> = {
    'shop_hours_by_date_range':    '🕐',
    'shop_hours_summary':          '📊',
    'production_status':           '🏭',
    'job_summary':                 '📋',
    'employee_hours':              '👷',
    'default':                     '🔧',
};

// Status config
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    'pending': { label: 'Pending', className: styles.statusPending },
    'running': { label: 'Running', className: styles.statusRunning },
    'success': { label: 'Success', className: styles.statusSuccess },
    'error':   { label: 'Error',   className: styles.statusError },
};

const DataSessionItem = ({ session, isActive, onSelect, onDelete }: DataSessionItemProps) => {
    const { confirm } = useConfirm();
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const itemRef = useRef<HTMLDivElement>(null);
    
    // Update tooltip position when showing
    useEffect(() => {
        if (showTooltip && itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect();
            setTooltipPosition({
                top: rect.top + rect.height / 2,
                left: rect.left - 16, // 16px gap from the item
            });
        }
    }, [showTooltip]);
    
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1)  return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7)  return `${diffDays}d ago`;

        return date.toLocaleDateString();
    };

    const getToolDisplayName = (toolName: string): string => {
        // Convert snake_case to Title Case
        return toolName
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // const getParamsPreview = (): string => {
    //     if (!session.tool_params || Object.keys(session.tool_params).length === 0) {
    //         return 'No parameters';
    //     }
    //
    //     // Show first 1-2 key params
    //     const entries = Object.entries(session.tool_params);
    //     const preview = entries
    //         .slice(0, 2)
    //         .map(([key, value]) => {
    //             const displayValue = typeof value === 'string'
    //                 ? value
    //                 : JSON.stringify(value);
    //             return `${key}: ${displayValue}`;
    //         })
    //         .join(', ');
    //
    //     return entries.length > 2 ? `${preview}, ...` : preview;
    // };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        const confirmed = await confirm({
            title: 'Delete Session',
            message: 'Are you sure you want to delete this data session? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            onDelete();
        }
    };

    const icon = TOOL_ICONS[session.tool_name] || TOOL_ICONS['default'];
    const status = STATUS_CONFIG[session.status] || STATUS_CONFIG['pending'];
    
    // Use title if available, otherwise format tool name
    const displayTitle = session.title || getToolDisplayName(session.tool_name);

    return (
        <div
            ref={itemRef}
            className={`${styles.sessionItem} ${isActive ? styles.active : ''}`}
            onClick={onSelect}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div className={styles.sessionIcon}>{icon}</div>
            
            <div className={styles.sessionInfo}>
                <div className={styles.sessionHeader}>
                    <span className={styles.sessionTitle}>
                        {displayTitle}
                    </span>
                    <span className={`${styles.statusBadge} ${status.className}`}>
                        {status.label}
                    </span>
                </div>
                
                {/*<span className={styles.sessionParams}>*/}
                {/*    {getParamsPreview()}*/}
                {/*</span>*/}
                
                <span className={styles.sessionDate}>
                    {formatDate(session.created_at)}
                </span>
            </div>

            <button
                className={styles.deleteBtn}
                onClick={handleDeleteClick}
                aria-label="Delete session"
                title="Delete session"
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
            </button>

            {/* Hover Tooltip - rendered via portal to escape overflow clipping */}
            {showTooltip && createPortal(
                <DataSessionTooltip 
                    session={session} 
                    position={tooltipPosition}
                />,
                document.body
            )}
        </div>
    );
};

export default DataSessionItem;
