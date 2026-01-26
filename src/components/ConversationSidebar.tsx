/**
 * ConversationSidebar - Enhanced with Projects support and drag-and-drop
 */

import { useState, useEffect, useCallback } from 'react';
import { Plus, MessageSquare, FolderPlus, Globe } from 'lucide-react';
import type { Conversation } from '../types/conversation';
import type { ConversationProject, ProjectConversation } from '../types';
import ConversationItem from './ConversationItem';
import LoadingDots from './LoadingDots';
import {
    ProjectFolder,
    ProjectModal,
    InviteBanner,
    InviteModal,
    DeleteProjectModal,
    LeaveProjectModal,
    CommunityProjectsModal,
    type ProjectFormData,
} from './conversation_projects';
import {
    useConversationProjectStore,
    useConversationProjectApi,
} from '../store';
import { useAuth } from '../auth';
import { useToast } from './Toast';
import '../styles/conversationSidebar.css';
import styles from '../styles/ConversationProjects.module.css';

interface ConversationSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    conversations: Conversation[];
    activeConversationId: number | null;
    onSelectConversation: (conversationId: number) => void;
    onNewConversation: (projectId?: number) => void;
    onDeleteConversation: (conversationId: number) => void;
    onRenameConversation: (conversationId: number, newTitle: string) => void;
    loading: boolean;
    openProjectModalOnMount?: boolean;
    onProjectModalOpened?: () => void;
}

const ConversationSidebar = ({
    isOpen,
    onClose,
    conversations,
    activeConversationId,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    loading,
    onRenameConversation,
    openProjectModalOnMount,
    onProjectModalOpened,
}: ConversationSidebarProps) => {
    const { showToast } = useToast();

    // Store state
    const ownedProjects = useConversationProjectStore((s) => s.ownedProjects);
    const sharedProjects = useConversationProjectStore((s) => s.sharedProjects);
    const invites = useConversationProjectStore((s) => s.invites);
    const expandedProjects = useConversationProjectStore((s) => s.expandedProjects);
    const toggleProjectExpanded = useConversationProjectStore((s) => s.toggleProjectExpanded);
    // const isProjectsLoading = useConversationProjectStore((s) => s.isLoading);

    // API
    const projectApi = useConversationProjectApi();

    // Modal state
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<ConversationProject | null>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteProject, setInviteProject] = useState<ConversationProject | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteProject, setDeleteProject] = useState<ConversationProject | null>(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [leaveProject, setLeaveProject] = useState<ConversationProject | null>(null);
    const [showCommunityModal, setShowCommunityModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Get current user for leave functionality
    const { user: currentUser } = useAuth();

    // Project conversations cache
    const [projectConversations, setProjectConversations] = useState<Record<number, ProjectConversation[]>>({});

    // Drag and drop state
    const [draggedConversationId, setDraggedConversationId] = useState<number | null>(null);

    // Load projects on mount
    useEffect(() => {
        if (isOpen) {
            projectApi.fetchProjects().catch(console.error);
            projectApi.fetchInvites().catch(console.error);
        }
    }, [isOpen]);

    // Handle auto-opening project modal when requested
    useEffect(() => {
        if (isOpen && openProjectModalOnMount && !showProjectModal) {
            setShowProjectModal(true);
            onProjectModalOpened?.();
        }
    }, [isOpen, openProjectModalOnMount]);

    // Load conversations when project is expanded
    const handleToggleProject = async (projectId: number) => {
        toggleProjectExpanded(projectId);
        
        // Load conversations if expanding and not cached
        if (!expandedProjects.has(projectId) && !projectConversations[projectId]) {
            try {
                const response = await projectApi.fetchProjectConversations(projectId);
                setProjectConversations((prev) => ({
                    ...prev,
                    [projectId]: response.conversations,
                }));
            } catch (error) {
                console.error('Failed to load project conversations:', error);
            }
        }
    };

    // Handlers
    const handleNewChat = () => {
        onNewConversation();
        onClose();
    };

    const handleSelectConversation = (conversationId: number) => {
        onSelectConversation(conversationId);
        onClose();
    };

    const handleCreateProject = () => {
        setEditingProject(null);
        setShowProjectModal(true);
    };

    const handleEditProject = (project: ConversationProject) => {
        setEditingProject(project);
        setShowProjectModal(true);
    };

    const handleSaveProject = async (data: ProjectFormData) => {
        setIsSaving(true);
        const isSharedType = data.project_type === 'shared_locked' || data.project_type === 'shared_open';
        try {
            if (editingProject) {
                await projectApi.updateProject(editingProject.id, {
                    name: data.name,
                    description: data.description || undefined,
                    color: data.color || undefined,
                    custom_instructions: data.custom_instructions || undefined,
                    project_type: data.project_type,
                    permissions: isSharedType ? data.permissions : undefined,
                });
                showToast('Project updated', 'success');
            } else {
                await projectApi.createProject({
                    name: data.name,
                    description: data.description || undefined,
                    color: data.color || undefined,
                    custom_instructions: data.custom_instructions || undefined,
                    project_type: data.project_type,
                    permissions: isSharedType ? data.permissions : undefined,
                });
                showToast('Project created', 'success');
            }
            setShowProjectModal(false);
            setEditingProject(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to save project', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteProject = (project: ConversationProject) => {
        setDeleteProject(project);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async (deleteConversations: boolean) => {
        if (!deleteProject) return;
        
        setIsSaving(true);
        try {
            await projectApi.deleteProject(deleteProject.id, deleteConversations);
            showToast('Project deleted', 'success');
            setShowDeleteModal(false);
            setDeleteProject(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete project', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInviteToProject = (project: ConversationProject) => {
        setInviteProject(project);
        setShowInviteModal(true);
    };

    const handleSendInvite = async (email: string) => {
        if (!inviteProject) return;
        
        setIsSaving(true);
        try {
            await projectApi.inviteToProject(inviteProject.id, email);
            showToast(`Invite sent to ${email}`, 'success');
            setShowInviteModal(false);
            setInviteProject(null);
        } catch (error) {
            throw error; // Let modal handle error display
        } finally {
            setIsSaving(false);
        }
    };

    const handleAcceptInvite = async (inviteId: number) => {
        try {
            await projectApi.acceptInvite(inviteId);
            showToast('Joined project!', 'success');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to accept invite', 'error');
        }
    };

    const handleDeclineInvite = async (inviteId: number) => {
        try {
            await projectApi.declineInvite(inviteId);
            showToast('Invite declined', 'info');
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to decline invite', 'error');
        }
    };

    const handleLeaveProject = (project: ConversationProject) => {
        setLeaveProject(project);
        setShowLeaveModal(true);
    };

    const handleConfirmLeave = async () => {
        if (!leaveProject || !currentUser) return;
        
        setIsSaving(true);
        try {
            await projectApi.leaveProject(leaveProject.id, currentUser.id);
            showToast('Left project', 'success');
            setShowLeaveModal(false);
            setLeaveProject(null);
            // Clear cached conversations for this project
            setProjectConversations((prev) => {
                const next = { ...prev };
                delete next[leaveProject.id];
                return next;
            });
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to leave project', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNewConversationInProject = (projectId: number) => {
        onNewConversation(projectId);
        onClose();
    };

    // =========================================================================
    // Drag and Drop Handlers
    // =========================================================================

    const handleDragStart = useCallback((e: React.DragEvent, conversationId: number) => {
        setDraggedConversationId(conversationId);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(conversationId));
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedConversationId(null);
    }, []);

    const handleDropOnProject = useCallback(async (e: React.DragEvent, projectId: number) => {
        e.preventDefault();
        const conversationId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!conversationId || isNaN(conversationId)) return;

        try {
            await projectApi.addConversationToProject(conversationId, projectId);
            
            // Update local cache - add to target project
            const conversation = conversations.find(c => c.id === conversationId);
            if (conversation) {
                const newProjectConvo: ProjectConversation = {
                    id: conversation.id,
                    user_id: conversation.user_id,
                    title: conversation.title,
                    summary: conversation.summary,
                    created_at: conversation.created_at,
                    updated_at: conversation.updated_at,
                    is_active: conversation.is_active,
                    last_message_preview: conversation.last_message_preview,
                    added_to_project_at: new Date().toISOString(),
                    project_ids: [projectId],
                };
                setProjectConversations((prev) => ({
                    ...prev,
                    [projectId]: [
                        ...(prev[projectId] || []),
                        newProjectConvo,
                    ],
                }));
            }
            
            // Find the project name for the toast
            const project = [...ownedProjects, ...sharedProjects].find(p => p.id === projectId);
            showToast(`Moved to ${project?.name || 'project'}`, 'success');
        } catch (error) {
            console.error('Failed to move conversation to project:', error);
            showToast('Failed to move conversation', 'error');
        }
        
        setDraggedConversationId(null);
    }, [conversations, ownedProjects, sharedProjects, projectApi, showToast]);

    const handleRemoveFromProject = useCallback(async (conversationId: number, projectId: number) => {
        try {
            await projectApi.removeConversationFromProject(conversationId, projectId);
            
            // Update local cache - remove from project
            setProjectConversations((prev) => ({
                ...prev,
                [projectId]: (prev[projectId] || []).filter(c => c.id !== conversationId),
            }));
            
            showToast('Removed from project', 'success');
        } catch (error) {
            console.error('Failed to remove conversation from project:', error);
            showToast('Failed to remove conversation', 'error');
        }
    }, [projectApi, showToast]);

    const handleDropOnUngrouped = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        const conversationId = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!conversationId || isNaN(conversationId)) return;

        // Find which project(s) this conversation is in and remove from all
        const projectsToRemoveFrom: number[] = [];
        Object.entries(projectConversations).forEach(([projectId, convos]) => {
            if (convos.some(c => c.id === conversationId)) {
                projectsToRemoveFrom.push(parseInt(projectId, 10));
            }
        });

        for (const projectId of projectsToRemoveFrom) {
            await handleRemoveFromProject(conversationId, projectId);
        }
        
        setDraggedConversationId(null);
    }, [projectConversations, handleRemoveFromProject]);

    // Check if conversation belongs to any project
    const conversationProjectMap = new Map<number, number[]>();
    Object.entries(projectConversations).forEach(([projectId, convos]) => {
        convos.forEach((c) => {
            const existing = conversationProjectMap.get(c.id) || [];
            conversationProjectMap.set(c.id, [...existing, parseInt(projectId)]);
        });
    });

    // Get ungrouped conversations (not in any project)
    const allProjectConvoIds = new Set(
        Object.values(projectConversations).flat().map((c) => c.id)
    );
    const ungroupedConversations = conversations.filter((c) => !allProjectConvoIds.has(c.id));

    return (
        <>
            <div
                className={`conversation-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`conversation-sidebar ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="conversation-sidebar-header">
                    <div className="conversation-sidebar-header-title">
                        <MessageSquare size={20} />
                        <h2>Conversations</h2>
                    </div>
                    <button
                        className="conversation-sidebar-close-btn"
                        onClick={onClose}
                        aria-label="Close sidebar"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Actions */}
                <div className="conversation-sidebar-actions">
                    <button className="new-conversation-btn" onClick={handleNewChat}>
                        <Plus size={18} />
                        New Conversation
                    </button>
                </div>

                <div className="conversation-sidebar-content">
                    {/* Pending Invites */}
                    {invites.length > 0 && (
                        <div>
                            {invites.map((invite) => (
                                <InviteBanner
                                    key={invite.id}
                                    invite={invite}
                                    onAccept={() => handleAcceptInvite(invite.id)}
                                    onDecline={() => handleDeclineInvite(invite.id)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Projects Section */}
                    {(ownedProjects.length > 0 || sharedProjects.length > 0) && (
                        <div className={styles.projectsSection}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>Projects</span>
                                <div className={styles.sectionActions}>
                                    <button
                                        className={styles.newProjectBtn}
                                        onClick={() => setShowCommunityModal(true)}
                                        title="Browse community projects"
                                    >
                                        <Globe size={16} />
                                    </button>
                                    <button
                                        className={styles.newProjectBtn}
                                        onClick={handleCreateProject}
                                        title="New project"
                                    >
                                        <FolderPlus size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Owned Projects */}
                            {ownedProjects.map((project) => (
                                <ProjectFolder
                                    key={project.id}
                                    project={project}
                                    isExpanded={expandedProjects.has(project.id)}
                                    onToggle={() => handleToggleProject(project.id)}
                                    onEdit={() => handleEditProject(project)}
                                    onDelete={() => handleDeleteProject(project)}
                                    onInvite={() => handleInviteToProject(project)}
                                    onLeave={() => handleLeaveProject(project)}
                                    onAddConversation={() => handleNewConversationInProject(project.id)}
                                    onDrop={handleDropOnProject}
                                    draggedConversationId={draggedConversationId}
                                >
                                    {projectConversations[project.id]?.map((convo) => (
                                        <div
                                            key={convo.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, convo.id)}
                                            onDragEnd={handleDragEnd}
                                            style={{ opacity: draggedConversationId === convo.id ? 0.5 : 1 }}
                                        >
                                            <ConversationItem
                                                conversation={{
                                                    id: convo.id,
                                                    user_id: convo.user_id,
                                                    title: convo.title,
                                                    summary: convo.summary,
                                                    created_at: convo.created_at,
                                                    updated_at: convo.updated_at,
                                                    is_active: convo.is_active,
                                                    last_message_preview: convo.last_message_preview,
                                                }}
                                                isActive={convo.id === activeConversationId}
                                                onSelect={() => handleSelectConversation(convo.id)}
                                                onDelete={() => onDeleteConversation(convo.id)}
                                                onRename={(newTitle) => onRenameConversation(convo.id, newTitle)}
                                            />
                                        </div>
                                    ))}
                                </ProjectFolder>
                            ))}

                            {/* Shared With Me Divider */}
                            {sharedProjects.length > 0 && (
                                <>
                                    <div className={styles.sharedDivider}>
                                        <span className={styles.sharedLabel}>Shared with me</span>
                                    </div>
                                    {sharedProjects.map((project) => (
                                        <ProjectFolder
                                            key={project.id}
                                            project={project}
                                            isExpanded={expandedProjects.has(project.id)}
                                            onToggle={() => handleToggleProject(project.id)}
                                            onEdit={() => handleEditProject(project)}
                                            onDelete={() => handleDeleteProject(project)}
                                            onInvite={() => handleInviteToProject(project)}
                                            onLeave={() => handleLeaveProject(project)}
                                            onAddConversation={() => handleNewConversationInProject(project.id)}
                                            onDrop={handleDropOnProject}
                                            draggedConversationId={draggedConversationId}
                                        >
                                            {projectConversations[project.id]?.map((convo) => (
                                                <div
                                                    key={convo.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, convo.id)}
                                                    onDragEnd={handleDragEnd}
                                                    style={{ opacity: draggedConversationId === convo.id ? 0.5 : 1 }}
                                                >
                                                    <ConversationItem
                                                        conversation={{
                                                            id: convo.id,
                                                            user_id: convo.user_id,
                                                            title: convo.title,
                                                            summary: convo.summary,
                                                            created_at: convo.created_at,
                                                            updated_at: convo.updated_at,
                                                            is_active: convo.is_active,
                                                            last_message_preview: convo.last_message_preview,
                                                        }}
                                                        isActive={convo.id === activeConversationId}
                                                        onSelect={() => handleSelectConversation(convo.id)}
                                                        onDelete={() => onDeleteConversation(convo.id)}
                                                        onRename={(newTitle) => onRenameConversation(convo.id, newTitle)}
                                                    />
                                                </div>
                                            ))}
                                        </ProjectFolder>
                                    ))}
                                </>
                            )}
                        </div>
                    )}

                    {/* Create First Project CTA (when no projects exist) */}
                    {ownedProjects.length === 0 && sharedProjects.length === 0 && !loading && (
                        <div className={styles.projectsSection}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionTitle}>Projects</span>
                                <div className={styles.sectionActions}>
                                    <button
                                        className={styles.newProjectBtn}
                                        onClick={() => setShowCommunityModal(true)}
                                        title="Browse community projects"
                                    >
                                        <Globe size={16} />
                                    </button>
                                    <button
                                        className={styles.newProjectBtn}
                                        onClick={handleCreateProject}
                                        title="New project"
                                    >
                                        <FolderPlus size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Ungrouped Conversations */}
                    {loading && (
                        <div className="conversation-sidebar-loading">
                            <LoadingDots variant="primary" message="Loading conversations..." size="small" />
                        </div>
                    )}

                    {!loading && conversations.length === 0 && ownedProjects.length === 0 && (
                        <div className="conversation-sidebar-empty">
                            <MessageSquare size={48} strokeWidth={1} />
                            <span>No conversations yet</span>
                            <p>Start a new conversation to get going!</p>
                        </div>
                    )}

                    {!loading && ungroupedConversations.length > 0 && (
                        <>
                            {(ownedProjects.length > 0 || sharedProjects.length > 0) && (
                                <div className={styles.ungroupedLabel}>Recent</div>
                            )}
                            <div 
                                className="conversations-list"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDropOnUngrouped}
                            >
                                {ungroupedConversations.map((conversation) => (
                                    <div
                                        key={conversation.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, conversation.id)}
                                        onDragEnd={handleDragEnd}
                                        style={{ opacity: draggedConversationId === conversation.id ? 0.5 : 1 }}
                                    >
                                        <ConversationItem
                                            conversation={conversation}
                                            isActive={conversation.id === activeConversationId}
                                            onSelect={() => handleSelectConversation(conversation.id)}
                                            onDelete={() => onDeleteConversation(conversation.id)}
                                            onRename={(newTitle) => onRenameConversation(conversation.id, newTitle)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </aside>

            {/* Modals */}
            <ProjectModal
                isOpen={showProjectModal}
                onClose={() => { setShowProjectModal(false); setEditingProject(null); }}
                onSave={handleSaveProject}
                project={editingProject}
                isLoading={isSaving}
            />

            <InviteModal
                isOpen={showInviteModal}
                onClose={() => { setShowInviteModal(false); setInviteProject(null); }}
                onInvite={handleSendInvite}
                project={inviteProject}
                isLoading={isSaving}
            />

            <DeleteProjectModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); setDeleteProject(null); }}
                onDelete={handleConfirmDelete}
                project={deleteProject}
                isLoading={isSaving}
            />

            <CommunityProjectsModal
                isOpen={showCommunityModal}
                onClose={() => setShowCommunityModal(false)}
                onProjectJoined={() => {
                    showToast('Joined project!', 'success');
                }}
            />

            <LeaveProjectModal
                isOpen={showLeaveModal}
                onClose={() => { setShowLeaveModal(false); setLeaveProject(null); }}
                onLeave={handleConfirmLeave}
                project={leaveProject}
                isLoading={isSaving}
            />
        </>
    );
};

export default ConversationSidebar;
