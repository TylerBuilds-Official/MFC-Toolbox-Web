/**
 * LeaveProjectModal - Confirmation modal for leaving a shared project
 */

import { X, LogOut } from 'lucide-react';
import type { ConversationProject } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface LeaveProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLeave: () => Promise<void>;
    project: ConversationProject | null;
    isLoading?: boolean;
}

export function LeaveProjectModal({
    isOpen,
    onClose,
    onLeave,
    project,
    isLoading = false,
}: LeaveProjectModalProps) {
    if (!isOpen || !project) return null;

    const handleLeave = async () => {
        await onLeave();
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={styles.modal} 
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '400px' }}
            >
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3>Leave Project</h3>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <div className={styles.deleteWarning}>
                        <LogOut size={24} />
                        <p>
                            Are you sure you want to leave <strong>{project.name}</strong>?
                        </p>
                        <span className={styles.deleteHint}>
                            You'll lose access to this project and its conversations. 
                            You can rejoin later if it's an open project, or request a new invite.
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnDanger}`}
                        onClick={handleLeave}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Leaving...' : 'Leave Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LeaveProjectModal;
