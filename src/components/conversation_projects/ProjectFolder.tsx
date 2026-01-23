/**
 * ProjectFolder - Collapsible project folder in sidebar with drag-and-drop support
 */

import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, Lock, Globe, Trash2, Settings, UserPlus, Plus, LogOut, User } from 'lucide-react';
import type { ConversationProject } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface ProjectFolderProps {
    project: ConversationProject;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onInvite: () => void;
    onLeave: () => void;
    onAddConversation: () => void;
    children?: React.ReactNode;
    // Drag and drop
    onDrop?: (e: React.DragEvent, projectId: number) => void;
    draggedConversationId?: number | null;
}

export function ProjectFolder({
    project,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onInvite,
    onLeave,
    onAddConversation,
    children,
    onDrop,
    draggedConversationId,
}: ProjectFolderProps) {
    const [showActions, setShowActions] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const isShared = project.project_type !== 'private';
    const isLocked = project.project_type === 'shared_locked';
    const isOpen = project.project_type === 'shared_open';

    const handleHeaderClick = (e: React.MouseEvent) => {
        // Don't toggle if clicking on actions
        if ((e.target as HTMLElement).closest(`.${styles.projectActions}`)) {
            return;
        }
        onToggle();
    };

    // Drag and drop handlers
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
        onDrop?.(e, project.id);
    };

    return (
        <div className={styles.projectFolder}>
            <div
                className={`${styles.projectHeader} ${isExpanded ? styles.expanded : ''} ${isDragOver ? styles.dropTarget : ''}`}
                onClick={handleHeaderClick}
                onMouseEnter={() => setShowActions(true)}
                onMouseLeave={() => setShowActions(false)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {/* Expand icon */}
                <ChevronRight
                    size={14}
                    className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}
                />

                {/* Folder icon with color */}
                {isExpanded ? (
                    <FolderOpen
                        size={16}
                        className={styles.folderIcon}
                        style={project.color ? { color: project.color } : undefined}
                    />
                ) : (
                    <Folder
                        size={16}
                        className={styles.folderIcon}
                        style={project.color ? { color: project.color } : undefined}
                    />
                )}

                {/* Project info */}
                <div className={styles.projectInfo}>
                    <span className={styles.projectName}>{project.name}</span>
                    {isExpanded && project.description && (
                        <span className={styles.projectMeta}>{project.description}</span>
                    )}
                </div>

                {/* Project type indicator */}
                <div className={`${styles.shareIndicator} ${isLocked ? styles.locked : ''} ${isOpen ? styles.open : ''} ${!isShared ? styles.private : ''}`}>
                    {isLocked ? <User size={14} /> : isOpen ? <Globe size={14} /> : <Lock size={14} />}
                </div>

                {/* Conversation count */}
                <span className={styles.conversationCount}>
                    {project.conversation_count}
                </span>

                {/* Actions */}
                <div className={styles.projectActions} style={{ opacity: showActions ? 1 : 0 }}>
                    {/* Only show invite button for shared_locked (invite-only) projects */}
                    {project.is_owner && isLocked && (
                        <button
                            className={styles.projectActionBtn}
                            onClick={(e) => { e.stopPropagation(); onInvite(); }}
                            title="Invite member"
                        >
                            <UserPlus size={14} />
                        </button>
                    )}
                    {project.is_owner && (
                        <button
                            className={styles.projectActionBtn}
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            title="Edit project"
                        >
                            <Settings size={14} />
                        </button>
                    )}
                    {project.is_owner && (
                        <button
                            className={`${styles.projectActionBtn} ${styles.danger}`}
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            title="Delete project"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    {/* Leave button for non-owners of shared projects */}
                    {!project.is_owner && isShared && (
                        <button
                            className={`${styles.projectActionBtn} ${styles.danger}`}
                            onClick={(e) => { e.stopPropagation(); onLeave(); }}
                            title="Leave project"
                        >
                            <LogOut size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded content */}
            <div 
                className={`${styles.projectContent} ${isExpanded ? styles.expanded : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {children}
                
                {project.conversation_count === 0 && (
                    <div className={styles.emptyProject}>
                        {draggedConversationId ? 'Drop here to add' : 'Drag conversations here'}
                    </div>
                )}

                {/* Add conversation button */}
                {(project.is_owner || project.permissions?.canCreateConversations === 'anyone') && (
                    <button className={styles.addConversationBtn} onClick={onAddConversation}>
                        <Plus size={14} />
                        <span>New conversation</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default ProjectFolder;
