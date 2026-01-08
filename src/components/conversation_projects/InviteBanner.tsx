/**
 * InviteBanner - Shows pending project invites
 */

import { Mail, Check, X } from 'lucide-react';
import type { ProjectInvite } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface InviteBannerProps {
    invite: ProjectInvite;
    onAccept: () => void;
    onDecline: () => void;
    isLoading?: boolean;
}

export function InviteBanner({
    invite,
    onAccept,
    onDecline,
    isLoading = false,
}: InviteBannerProps) {
    return (
        <div className={styles.inviteBanner}>
            <Mail size={20} className={styles.inviteIcon} />
            
            <div className={styles.inviteInfo}>
                <div className={styles.inviteTitle}>
                    You've been invited to a project
                </div>
                <div className={styles.inviteProject}>
                    <strong>{invite.project_name}</strong>
                    {' · '}
                    from {invite.invited_by_name}
                </div>
            </div>

            <div className={styles.inviteActions}>
                <button
                    className={`${styles.inviteBtn} ${styles.inviteBtnAccept}`}
                    onClick={onAccept}
                    disabled={isLoading}
                    title="Accept invite"
                >
                    <Check size={14} />
                </button>
                <button
                    className={`${styles.inviteBtn} ${styles.inviteBtnDecline}`}
                    onClick={onDecline}
                    disabled={isLoading}
                    title="Decline invite"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default InviteBanner;
