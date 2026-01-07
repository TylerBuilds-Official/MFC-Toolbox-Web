/**
 * DataSessionSidebar - Right-side panel showing user's data sessions organized by groups
 * Allows browsing, organizing, and selecting previous data explorations
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore, organizeSessionsByGroup } from '../../store/useDataStore';
import { useDataApi } from '../../store';
import type { DataSession } from '../../types';
import {type DataGroup } from '../../types';
import DataGroupFolder from './DataGroupFolder';
import DataGroupModal from './DataGroupModal';
import SessionContextMenu from './SessionContextMenu';
import DataSessionItem from './DataSessionItem';
import DataIcons from '../../assets/svg/data/dataIcons';
import LoadingDots from '../LoadingDots';
import { useConfirm } from '../ConfirmDialog';
import styles from '../../styles/data_page/DataSessionSidebar.module.css';
import groupStyles from '../../styles/data_page/DataGroups.module.css';

interface DataSessionSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DataSessionSidebar = ({ isOpen, onClose }: DataSessionSidebarProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeSessionId = searchParams.get('session');
    const { confirm } = useConfirm();
    
    const { sessions, groups, isLoading } = useDataStore();
    
    // Memoize the grouped/ungrouped organization to avoid recalculating on every render
    const { grouped, ungrouped } = useMemo(
        () => organizeSessionsByGroup(sessions),
        [sessions]
    );
    const { 
        fetchSessions, 
        fetchGroups, 
        deleteSession,
        createGroup,
        updateGroup,
        assignSessionToGroup,
        removeSessionFromGroup,
    } = useDataApi();

    // Modal state
    const [isGroupModalOpen, setGroupModalOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<DataGroup | null>(null);
    const [isModalLoading, setModalLoading] = useState(false);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        sessionId: number;
        groupId: number | null;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        sessionId: 0,
        groupId: null,
    });

    // Drag state
    const [draggedSessionId, setDraggedSessionId] = useState<number | null>(null);

    // Fetch sessions and groups when sidebar opens
    useEffect(() => {
        if (isOpen) {
            fetchSessions({ limit: 100 }).catch(console.error);
            fetchGroups().catch(console.error);
        }
    }, [isOpen, fetchSessions, fetchGroups]);

    const handleSelectSession = (sessionId: number) => {
        navigate(`/data?session=${sessionId}`);
        onClose();
    };

    const handleDeleteSession = async (sessionId: number) => {
        const confirmed = await confirm({
            title: 'Delete Session',
            message: 'Are you sure you want to delete this data session? This cannot be undone.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (confirmed) {
            try {
                await deleteSession(sessionId);
                if (activeSessionId === String(sessionId)) {
                    navigate('/data');
                }
            } catch (error) {
                console.error('Failed to delete session:', error);
            }
        }
    };

    const handleRefresh = () => {
        fetchSessions({ limit: 100 }).catch(console.error);
        fetchGroups().catch(console.error);
    };

    // Group Modal handlers
    const handleNewGroup = () => {
        setEditingGroup(null);
        setGroupModalOpen(true);
    };

    const handleEditGroup = (group: DataGroup) => {
        setEditingGroup(group);
        setGroupModalOpen(true);
    };

    const handleSaveGroup = async (data: { name: string; description: string; color: string }) => {
        setModalLoading(true);
        try {
            if (editingGroup) {
                await updateGroup(editingGroup.id, {
                    name: data.name,
                    description: data.description || '',  // Empty string clears
                    color: data.color || '',              // Empty string clears
                });
            } else {
                await createGroup({
                    name: data.name,
                    description: data.description || undefined,
                    color: data.color || undefined,
                });
            }
            setGroupModalOpen(false);
            setEditingGroup(null);
        } catch (error) {
            console.error('Failed to save group:', error);
        } finally {
            setModalLoading(false);
        }
    };

    // Context Menu handlers
    const handleContextMenu = useCallback((
        e: React.MouseEvent,
        session: DataSession
    ) => {
        e.preventDefault();
        setContextMenu({
            isOpen: true,
            position: { x: e.clientX, y: e.clientY },
            sessionId: session.id,
            groupId: session.session_group_id,
        });
    }, []);

    const handleCloseContextMenu = () => {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
    };

    const handleMoveToGroup = async (sessionId: number, groupId: number) => {
        try {
            await assignSessionToGroup(sessionId, groupId);
        } catch (error) {
            console.error('Failed to move session to group:', error);
        }
    };

    const handleRemoveFromGroup = async (sessionId: number) => {
        try {
            await removeSessionFromGroup(sessionId);
        } catch (error) {
            console.error('Failed to remove session from group:', error);
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, sessionId: number) => {
        setDraggedSessionId(sessionId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(sessionId));
    };

    const handleDragEnd = () => {
        setDraggedSessionId(null);
    };

    const handleDropOnGroup = async (e: React.DragEvent, groupId: number) => {
        e.preventDefault();
        const sessionId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (sessionId && !isNaN(sessionId)) {
            await handleMoveToGroup(sessionId, groupId);
        }
        setDraggedSessionId(null);
    };

    const handleDropOnUngrouped = async (e: React.DragEvent) => {
        e.preventDefault();
        const sessionId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (sessionId && !isNaN(sessionId)) {
            const session = sessions.find(s => s.id === sessionId);
            if (session?.session_group_id) {
                await handleRemoveFromGroup(sessionId);
            }
        }
        setDraggedSessionId(null);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <h2>Data Sessions</h2>
                    </div>
                    
                    <div className={styles.headerActions}>
                        {/* New Group Button */}
                        <button 
                            className={groupStyles.newGroupBtn}
                            onClick={handleNewGroup}
                            aria-label="New group"
                            title="New group"
                        >
                            <DataIcons.folderPlus width={18} height={18} />
                        </button>

                        <button 
                            className={styles.refreshBtn} 
                            onClick={handleRefresh}
                            aria-label="Refresh sessions"
                            title="Refresh"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6" />
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M3 22v-6h6" />
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                        </button>
                        
                        <button 
                            className={styles.closeBtn} 
                            onClick={onClose} 
                            aria-label="Close sidebar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Loading State */}
                    {isLoading && (
                        <div className={styles.loadingState}>
                            <LoadingDots variant="primary" message="Loading sessions..." size="small" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && sessions.length === 0 && groups.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>No sessions yet</span>
                            <p>Run a data tool to create your first session!</p>
                        </div>
                    )}

                    {/* Groups and Sessions */}
                    {!isLoading && (sessions.length > 0 || groups.length > 0) && (
                        <div className={styles.sessionsList}>
                            {/* Groups */}
                            {groups.map(group => (
                                <DataGroupFolder
                                    key={group.id}
                                    group={group}
                                    sessions={grouped[group.id] || []}
                                    activeSessionId={activeSessionId}
                                    onSelectSession={handleSelectSession}
                                    onDeleteSession={handleDeleteSession}
                                    onEditGroup={handleEditGroup}
                                    onContextMenu={handleContextMenu}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onDrop={handleDropOnGroup}
                                    draggedSessionId={draggedSessionId}
                                />
                            ))}

                            {/* Ungrouped Sessions */}
                            {ungrouped.length > 0 && (
                                <div
                                    className={styles.ungroupedSessions}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleDropOnUngrouped}
                                >
                                    {ungrouped.map(session => (
                                        <div
                                            key={session.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, session.id)}
                                            onDragEnd={handleDragEnd}
                                            onContextMenu={(e) => handleContextMenu(e, session)}
                                            style={{ opacity: draggedSessionId === session.id ? 0.5 : 1 }}
                                        >
                                            <DataSessionItem
                                                session={session}
                                                isActive={activeSessionId === String(session.id)}
                                                onSelect={() => handleSelectSession(session.id)}
                                                onDelete={() => handleDeleteSession(session.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            {/* Group Modal */}
            <DataGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => {
                    setGroupModalOpen(false);
                    setEditingGroup(null);
                }}
                onSave={handleSaveGroup}
                group={editingGroup}
                isLoading={isModalLoading}
            />

            {/* Context Menu */}
            <SessionContextMenu
                isOpen={contextMenu.isOpen}
                position={contextMenu.position}
                sessionId={contextMenu.sessionId}
                currentGroupId={contextMenu.groupId}
                groups={groups}
                onClose={handleCloseContextMenu}
                onMoveToGroup={handleMoveToGroup}
                onRemoveFromGroup={handleRemoveFromGroup}
                onDelete={handleDeleteSession}
            />
        </>
    );
};

export default DataSessionSidebar;
