/**
 * ProjectMembersSection - Shows members and invites for a project
 * 
 * For owners: Shows members + pending/declined invites with remove actions
 * For members: Shows just the member list (owner/member roles only)
 */

import { useState, useEffect } from 'react';
import { User, X, Loader2 } from 'lucide-react';
import { useConversationProjectApi } from '../../store';
import type { ProjectMember, ProjectInviteOwnerView } from '../../types';
import styles from '../../styles/ConversationProjects.module.css';

interface ProjectMembersSectionProps {
    projectId: number;
    isOwner: boolean;
    onMemberRemoved?: () => void;
}

// Combined type for display
type MemberOrInvite = 
    | { type: 'member'; data: ProjectMember }
    | { type: 'invite'; data: ProjectInviteOwnerView };

export function ProjectMembersSection({
    projectId,
    isOwner,
    onMemberRemoved,
}: ProjectMembersSectionProps) {
    const {
        fetchProjectMembers,
        fetchProjectInvites,
        removeMember,
        cancelProjectInvite,
    } = useConversationProjectApi();

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [invites, setInvites] = useState<ProjectInviteOwnerView[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    // Load members and invites
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const membersData = await fetchProjectMembers(projectId);
                setMembers(membersData);

                // Only fetch invites if owner
                if (isOwner) {
                    const invitesData = await fetchProjectInvites(projectId);
                    setInvites(invitesData);
                }
            } catch (error) {
                console.error('Failed to load members:', error);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [projectId, isOwner, fetchProjectMembers, fetchProjectInvites]);

    // Handle removing a member
    const handleRemoveMember = async (member: ProjectMember) => {
        if (member.role === 'owner') return; // Can't remove owner
        
        setRemovingId(member.user_id);
        try {
            await removeMember(projectId, member.user_id);
            setMembers(prev => prev.filter(m => m.user_id !== member.user_id));
            onMemberRemoved?.();
        } catch (error) {
            console.error('Failed to remove member:', error);
        } finally {
            setRemovingId(null);
        }
    };

    // Handle canceling an invite
    const handleCancelInvite = async (invite: ProjectInviteOwnerView) => {
        if (invite.status !== 'pending') return; // Can only cancel pending
        
        setRemovingId(invite.id);
        try {
            await cancelProjectInvite(projectId, invite.id);
            setInvites(prev => prev.filter(i => i.id !== invite.id));
        } catch (error) {
            console.error('Failed to cancel invite:', error);
        } finally {
            setRemovingId(null);
        }
    };

    // Combine members and invites for display (owner view)
    const getDisplayList = (): MemberOrInvite[] => {
        const list: MemberOrInvite[] = [];
        
        // Add members first
        members.forEach(member => {
            list.push({ type: 'member', data: member });
        });
        
        // Add invites (only for owner)
        if (isOwner) {
            invites.forEach(invite => {
                list.push({ type: 'invite', data: invite });
            });
        }
        
        return list;
    };

    // Get initials from name or email
    const getInitials = (name: string | undefined, email: string): string => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1 
                ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
                : name.substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    // Get status label and class
    const getStatusInfo = (item: MemberOrInvite): { label: string; className: string } => {
        if (item.type === 'member') {
            return {
                label: item.data.role === 'owner' ? 'Owner' : 'Member',
                className: item.data.role,
            };
        } else {
            const statusMap: Record<string, string> = {
                pending: 'Invited',
                declined: 'Declined',
                expired: 'Expired',
            };
            return {
                label: statusMap[item.data.status] || item.data.status,
                className: item.data.status === 'pending' ? 'invited' : item.data.status,
            };
        }
    };

    // Check if item can be removed
    const canRemove = (item: MemberOrInvite): boolean => {
        if (!isOwner) return false;
        
        if (item.type === 'member') {
            return item.data.role !== 'owner';
        } else {
            return item.data.status === 'pending';
        }
    };

    if (loading) {
        return (
            <div className={styles.formGroup}>
                <label>Members</label>
                <div className={styles.membersLoading}>
                    <Loader2 size={16} className={styles.spinIcon} />
                    <span>Loading members...</span>
                </div>
            </div>
        );
    }

    const displayList = getDisplayList();

    if (displayList.length === 0) {
        return (
            <div className={styles.formGroup}>
                <label>Members</label>
                <div className={styles.membersEmpty}>
                    No members yet
                </div>
            </div>
        );
    }

    return (
        <div className={styles.formGroup}>
            <label>Members</label>
            <div className={styles.membersList}>
                {displayList.map((item) => {
                    const id = item.type === 'member' ? `m-${item.data.user_id}` : `i-${item.data.id}`;
                    const name = item.type === 'member' ? item.data.display_name : undefined;
                    const email = item.type === 'member' ? item.data.email : item.data.email;
                    const statusInfo = getStatusInfo(item);
                    const isRemoving = item.type === 'member' 
                        ? removingId === item.data.user_id 
                        : removingId === item.data.id;
                    
                    return (
                        <div key={id} className={styles.memberRow}>
                            <div className={styles.memberAvatar}>
                                <User size={14} />
                            </div>
                            <div className={styles.memberInfo}>
                                {name ? (
                                    <>
                                        <div className={styles.memberName}>{name}</div>
                                        <div className={styles.memberEmail}>{email}</div>
                                    </>
                                ) : (
                                    <div className={styles.memberName}>{email}</div>
                                )}
                            </div>
                            <span className={`${styles.memberStatus} ${styles[statusInfo.className]}`}>
                                {statusInfo.label}
                            </span>
                            {canRemove(item) && (
                                <button
                                    className={styles.memberRemoveBtn}
                                    onClick={() => {
                                        if (item.type === 'member') {
                                            handleRemoveMember(item.data);
                                        } else {
                                            handleCancelInvite(item.data);
                                        }
                                    }}
                                    disabled={isRemoving}
                                    title={item.type === 'member' ? 'Remove member' : 'Cancel invite'}
                                >
                                    {isRemoving ? (
                                        <Loader2 size={14} className={styles.spinIcon} />
                                    ) : (
                                        <X size={14} />
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ProjectMembersSection;
