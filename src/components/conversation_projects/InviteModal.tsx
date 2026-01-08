/**
 * InviteModal - Invite users to a project
 */

import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import type { ConversationProject } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface InviteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string) => Promise<void>;
    project: ConversationProject | null;
    isLoading?: boolean;
}

export function InviteModal({
    isOpen,
    onClose,
    onInvite,
    project,
    isLoading = false,
}: InviteModalProps) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');
        
        // Basic email validation
        if (!email.trim()) {
            setError('Please enter an email address');
            return;
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            await onInvite(email.trim());
            setEmail('');
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send invite');
        }
    };

    const handleClose = () => {
        setEmail('');
        setError('');
        onClose();
    };

    if (!isOpen || !project) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <h3>Invite to {project.name}</h3>
                    <button className={styles.modalCloseBtn} onClick={handleClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => { setEmail(e.target.value); setError(''); }}
                            placeholder="colleague@company.com"
                            autoFocus
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                        {error && (
                            <span className={styles.formHint} style={{ color: 'var(--error, #ef4444)' }}>
                                {error}
                            </span>
                        )}
                        <span className={styles.formHint}>
                            The user will receive an invite and must accept to join the project.
                        </span>
                    </div>
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
                        onClick={handleSubmit}
                        disabled={!email.trim() || isLoading}
                    >
                        <UserPlus size={16} style={{ marginRight: 6 }} />
                        {isLoading ? 'Sending...' : 'Send Invite'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default InviteModal;
