/**
 * DeleteProjectModal - Confirm project deletion
 */

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import type { ConversationProject } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface DeleteProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDelete: (deleteConversations: boolean) => Promise<void>;
    project: ConversationProject | null;
    isLoading?: boolean;
}

export function DeleteProjectModal({
    isOpen,
    onClose,
    onDelete,
    project,
    isLoading = false,
}: DeleteProjectModalProps) {
    const [deleteConversations, setDeleteConversations] = useState(false);

    const handleDelete = async () => {
        await onDelete(deleteConversations);
        setDeleteConversations(false);
        onClose();
    };

    const handleClose = () => {
        setDeleteConversations(false);
        onClose();
    };

    if (!isOpen || !project) return null;

    const hasConversations = project.conversation_count > 0;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AlertTriangle size={20} style={{ color: 'var(--error, #ef4444)' }} />
                        Delete Project
                    </h3>
                    <button className={styles.modalCloseBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>
                        Are you sure you want to delete <strong>{project.name}</strong>?
                    </p>
                    
                    {hasConversations && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: 12,
                            padding: 'var(--space-3)',
                            background: 'var(--bg-secondary)',
                            borderRadius: 'var(--radius-md)',
                            marginTop: 'var(--space-3)',
                        }}>
                            <input
                                type="checkbox"
                                id="delete-conversations"
                                checked={deleteConversations}
                                onChange={e => setDeleteConversations(e.target.checked)}
                                style={{ marginTop: 3 }}
                            />
                            <label 
                                htmlFor="delete-conversations" 
                                style={{ 
                                    fontSize: '0.875rem',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                }}
                            >
                                Also delete {project.conversation_count} conversation{project.conversation_count !== 1 ? 's' : ''} 
                                {' '}that exist <em>only</em> in this project
                                <span style={{ 
                                    display: 'block', 
                                    fontSize: '0.75rem', 
                                    color: 'var(--text-muted)',
                                    marginTop: 4,
                                }}>
                                    Conversations in other projects won't be affected
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                        onClick={handleClose}
                    >
                        Cancel
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnPrimary}`}
                        onClick={handleDelete}
                        disabled={isLoading}
                        style={{ 
                            background: 'var(--error, #ef4444)', 
                            borderColor: 'var(--error, #ef4444)' 
                        }}
                    >
                        {isLoading ? 'Deleting...' : 'Delete Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default DeleteProjectModal;
