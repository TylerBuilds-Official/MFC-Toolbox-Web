/**
 * CommunityProjectsModal - Browse and join open (community) projects
 * 
 * Shows all shared_open projects:
 * - Projects user owns (shows "Owned")
 * - Projects user has joined (shows "Added")
 * - Projects available to join (shows "Add" button)
 */

import { useState, useEffect } from 'react';
import { X, Globe, Folder, Users, MessageSquare, Loader2, UserPlus, Check, Crown } from 'lucide-react';
import { useConversationProjectApi } from '../../store';
import type { CommunityProject } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface CommunityProjectsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectJoined?: (projectId: number) => void;
}

export function CommunityProjectsModal({
    isOpen,
    onClose,
    onProjectJoined,
}: CommunityProjectsModalProps) {
    const { fetchCommunityProjects, joinProject } = useConversationProjectApi();

    const [projects, setProjects] = useState<CommunityProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningId, setJoiningId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Load community projects when modal opens
    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchCommunityProjects();
            setProjects(data);
        } catch (err) {
            setError('Failed to load community projects');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async (project: CommunityProject) => {
        setJoiningId(project.id);
        setError(null);
        try {
            await joinProject(project.id);
            // Update status to 'member' after joining
            setProjects(prev => prev.map(p => 
                p.id === project.id 
                    ? { ...p, user_status: 'member' as const, member_count: p.member_count + 1 }
                    : p
            ));
            onProjectJoined?.(project.id);
        } catch (err) {
            setError(`Failed to join "${project.name}"`);
            console.error(err);
        } finally {
            setJoiningId(null);
        }
    };

    // Render the appropriate button based on user status
    const renderActionButton = (project: CommunityProject) => {
        const isJoining = joiningId === project.id;

        switch (project.user_status) {
            case 'owner':
                return (
                    <span className={`${styles.communityStatusBadge} ${styles.owned}`}>
                        <Crown size={12} />
                        <span>Owned</span>
                    </span>
                );
            case 'member':
                return (
                    <span className={`${styles.communityStatusBadge} ${styles.added}`}>
                        <Check size={12} />
                        <span>Added</span>
                    </span>
                );
            case 'available':
            default:
                return (
                    <button
                        className={styles.communityJoinBtn}
                        onClick={() => handleJoin(project)}
                        disabled={isJoining}
                    >
                        {isJoining ? (
                            <Loader2 size={14} className={styles.spinIcon} />
                        ) : (
                            <>
                                <UserPlus size={14} />
                                <span>Add</span>
                            </>
                        )}
                    </button>
                );
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div 
                className={styles.modal} 
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '560px' }}
            >
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={20} style={{ color: 'var(--accent-primary)' }} />
                        <h3>Community Projects</h3>
                    </div>
                    <button className={styles.modalCloseBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.membersLoading}>
                            <Loader2 size={20} className={styles.spinIcon} />
                            <span>Loading projects...</span>
                        </div>
                    ) : error ? (
                        <div className={styles.communityError}>
                            <span>{error}</span>
                            <button onClick={loadProjects}>Retry</button>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className={styles.communityEmpty}>
                            <Globe size={40} style={{ opacity: 0.3 }} />
                            <p>No open projects available</p>
                            <span>When someone creates an open project, it will appear here.</span>
                        </div>
                    ) : (
                        <div className={styles.communityList}>
                            {projects.map(project => (
                                <div key={project.id} className={styles.communityProject}>
                                    <div className={styles.communityProjectIcon}>
                                        <Folder 
                                            size={20} 
                                            style={project.color ? { color: project.color } : undefined}
                                        />
                                    </div>
                                    <div className={styles.communityProjectInfo}>
                                        <div className={styles.communityProjectName}>
                                            {project.name}
                                        </div>
                                        {project.description && (
                                            <div className={styles.communityProjectDescription}>
                                                {project.description}
                                            </div>
                                        )}
                                        <div className={styles.communityProjectMeta}>
                                            <span>by {project.owner_name}</span>
                                            <span className={styles.communityProjectStats}>
                                                <Users size={12} />
                                                {project.member_count}
                                            </span>
                                            <span className={styles.communityProjectStats}>
                                                <MessageSquare size={12} />
                                                {project.conversation_count}
                                            </span>
                                        </div>
                                    </div>
                                    {renderActionButton(project)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={styles.modalFooter}>
                    <button
                        className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CommunityProjectsModal;
