/**
 * DataGroupFolder - Collapsible folder component for organizing data sessions
 * Displays group name, session count, and contains child sessions when expanded
 */

import { useState } from 'react';
import { type DataGroup } from '../../types';
import { type DataSession } from '../../types';
import { useDataStore } from '../../store';
import { useDataApi } from '../../store';
import { useConfirm } from '../ConfirmDialog';
import DataIcons from '../../assets/svg/data/dataIcons';
import DataSessionItem from './DataSessionItem';
import styles from '../../styles/data_page/DataGroups.module.css';

interface DataGroupFolderProps {
    group: DataGroup;
    sessions: DataSession[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: number) => void;
    onDeleteSession: (sessionId: number) => void;
    onEditGroup: (group: DataGroup) => void;
    onContextMenu?: (e: React.MouseEvent, session: DataSession) => void;
    onDragStart?: (e: React.DragEvent, sessionId: number) => void;
    onDragEnd?: () => void;
    onDragOver?: (e: React.DragEvent, groupId: number) => void;
    onDrop?: (e: React.DragEvent, groupId: number) => void;
    draggedSessionId?: number | null;
}

const DataGroupFolder = ({
    group,
    sessions,
    activeSessionId,
    onSelectSession,
    onDeleteSession,
    onEditGroup,
    onContextMenu,
    onDragStart,
    onDragEnd,
    onDrop,
    draggedSessionId,
}: DataGroupFolderProps) => {
    const { confirm } = useConfirm();
    const { deleteGroup } = useDataApi();
    const expanded = useDataStore((state) => state.expandedGroups.has(group.id));
    const toggleGroupExpanded = useDataStore((state) => state.toggleGroupExpanded);
    
    const [isDragOver, setIsDragOver] = useState(false);

    const handleToggle = () => {
        toggleGroupExpanded(group.id);
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditGroup(group);
    };

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        const confirmed = await confirm({
            title: 'Delete Group',
            message: `Are you sure you want to delete "${group.name}"? Sessions in this group will be moved to ungrouped, not deleted.`,
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await deleteGroup(group.id);
            } catch (error) {
                console.error('Failed to delete group:', error);
            }
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop?.(e, group.id);
    };

    // Dynamic folder icon color
    const folderStyle = group.color ? { color: group.color } : undefined;

    return (
        <div className={styles.groupFolder}>
            {/* Group Header */}
            <div
                className={`${styles.groupHeader} ${expanded ? styles.expanded : ''} ${isDragOver ? styles.dropTarget : ''}`}
                onClick={handleToggle}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Expand/Collapse Chevron */}
                <DataIcons.chevronRight 
                    className={`${styles.expandIcon} ${expanded ? styles.expanded : ''}`}
                />

                {/* Folder Icon */}
                {expanded ? (
                    <DataIcons.folderOpen className={styles.folderIcon} style={folderStyle} />
                ) : (
                    <DataIcons.folderClosed className={styles.folderIcon} style={folderStyle} />
                )}

                {/* Group Info */}
                <div className={styles.groupInfo}>
                    <span className={styles.groupName}>{group.name}</span>
                    {group.description && (
                        <span className={styles.groupMeta}>{group.description}</span>
                    )}
                </div>

                {/* Session Count */}
                <span className={styles.sessionCount}>
                    {sessions.length}
                </span>

                {/* Actions */}
                <div className={styles.groupActions}>
                    <button
                        className={styles.groupActionBtn}
                        onClick={handleEditClick}
                        title="Edit group"
                    >
                        <DataIcons.folderEdit width={14} height={14} />
                    </button>
                    <button
                        className={`${styles.groupActionBtn} ${styles.danger}`}
                        onClick={handleDeleteClick}
                        title="Delete group"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded Content */}
            <div className={`${styles.groupContent} ${expanded ? styles.expanded : ''}`}>
                {sessions.length === 0 ? (
                    <div className={styles.emptyGroup}>
                        Drag sessions here to organize them
                    </div>
                ) : (
                    sessions.map(session => (
                        <div
                            key={session.id}
                            draggable
                            onDragStart={(e) => onDragStart?.(e, session.id)}
                            onDragEnd={onDragEnd}
                            onContextMenu={(e) => onContextMenu?.(e, session)}
                            style={{ opacity: draggedSessionId === session.id ? 0.5 : 1 }}
                        >
                            <DataSessionItem
                                session={session}
                                isActive={activeSessionId === String(session.id)}
                                onSelect={() => onSelectSession(session.id)}
                                onDelete={() => onDeleteSession(session.id)}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DataGroupFolder;
