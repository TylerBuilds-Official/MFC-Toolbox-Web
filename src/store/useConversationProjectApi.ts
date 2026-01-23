/**
 * Conversation Project API Hook
 * Wraps useApi for conversation project endpoints
 */

import { useCallback, useMemo } from 'react';
import { useApi } from '../auth';
import { useConversationProjectStore } from './useConversationProjectStore';
import type {
    ConversationProject,
    ProjectInvite,
    ProjectInviteOwnerView,
    ProjectMember,
    ProjectSummary,
    CommunityProject,
    ProjectsResponse,
    ProjectConversationsResponse,
    ProjectMembersResponse,
    ProjectInvitesResponse,
    ProjectInvitesOwnerResponse,
    ConversationProjectsResponse,
    CommunityProjectsResponse,
    CreateProjectRequest,
    UpdateProjectRequest,
    InviteRequest,
    AddConversationRequest,
} from '../types';


export function useConversationProjectApi() {
    const api = useApi();
    
    // Store actions
    const setLoading = useConversationProjectStore((state) => state.setLoading);
    const setError = useConversationProjectStore((state) => state.setError);
    const setProjects = useConversationProjectStore((state) => state.setProjects);
    const addProjectToStore = useConversationProjectStore((state) => state.addProject);
    const updateProjectInStore = useConversationProjectStore((state) => state.updateProject);
    const removeProjectFromStore = useConversationProjectStore((state) => state.removeProject);
    const setActiveProjectConversations = useConversationProjectStore((state) => state.setActiveProjectConversations);
    const setInvites = useConversationProjectStore((state) => state.setInvites);
    const removeInviteFromStore = useConversationProjectStore((state) => state.removeInvite);

    // ============================================
    // Projects CRUD
    // ============================================

    /**
     * Fetch all projects for current user (owned + shared)
     */
    const fetchProjects = useCallback(async (): Promise<ConversationProject[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<ProjectsResponse>('/conversations/projects');
            setProjects(response.projects, response.owned, response.shared);
            return response.projects;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch projects';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setProjects]);

    /**
     * Fetch a single project by ID
     */
    const fetchProject = useCallback(async (projectId: number): Promise<ConversationProject> => {
        setLoading(true);
        setError(null);

        try {
            const project = await api.get<ConversationProject>(`/conversations/projects/${projectId}`);
            updateProjectInStore(project);
            return project;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateProjectInStore]);

    /**
     * Create a new project
     */
    const createProject = useCallback(async (request: CreateProjectRequest): Promise<ConversationProject> => {
        setLoading(true);
        setError(null);

        try {
            const project = await api.post<ConversationProject>('/conversations/projects', request);
            addProjectToStore(project);
            return project;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, addProjectToStore]);

    /**
     * Update a project
     */
    const updateProject = useCallback(async (
        projectId: number,
        updates: UpdateProjectRequest
    ): Promise<ConversationProject> => {
        setLoading(true);
        setError(null);

        try {
            const project = await api.patch<ConversationProject>(
                `/conversations/projects/${projectId}`,
                updates
            );
            updateProjectInStore(project);
            return project;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateProjectInStore]);

    /**
     * Delete a project
     */
    const deleteProject = useCallback(async (
        projectId: number,
        deleteConversations: boolean = false
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            // Use fetchWithAuth directly for DELETE with body
            await api.fetchWithAuth(`/conversations/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ delete_conversations: deleteConversations }),
            });
            removeProjectFromStore(projectId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, removeProjectFromStore]);

    // ============================================
    // Conversation <-> Project Membership
    // ============================================

    /**
     * Get conversations in a project
     */
    const fetchProjectConversations = useCallback(async (projectId: number): Promise<ProjectConversationsResponse> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<ProjectConversationsResponse>(
                `/conversations/projects/${projectId}/conversations`
            );
            setActiveProjectConversations(response.conversations);
            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch project conversations';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setActiveProjectConversations]);

    /**
     * Add a conversation to a project
     */
    const addConversationToProject = useCallback(async (
        conversationId: number,
        projectId: number
    ): Promise<{ success: boolean; message: string }> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.post<{ success: boolean; message: string }>(
                `/conversations/${conversationId}/projects`,
                { project_id: projectId } as AddConversationRequest
            );
            // Refresh project to update conversation count
            await fetchProject(projectId);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to add conversation to project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, fetchProject]);

    /**
     * Remove a conversation from a project
     */
    const removeConversationFromProject = useCallback(async (
        conversationId: number,
        projectId: number
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/conversations/${conversationId}/projects/${projectId}`);
            // Refresh project to update conversation count
            await fetchProject(projectId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove conversation from project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, fetchProject]);

    /**
     * Get which projects a conversation belongs to
     */
    const getConversationProjects = useCallback(async (
        conversationId: number
    ): Promise<ProjectSummary[]> => {
        try {
            const response = await api.get<ConversationProjectsResponse>(
                `/conversations/${conversationId}/projects`
            );
            return response.projects;
        } catch (error) {
            console.error('Failed to fetch conversation projects:', error);
            return [];
        }
    }, [api]);

    // ============================================
    // Invites
    // ============================================

    /**
     * Fetch pending invites for current user
     */
    const fetchInvites = useCallback(async (): Promise<ProjectInvite[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<ProjectInvitesResponse>('/conversations/projects/invites');
            setInvites(response.invites);
            return response.invites;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch invites';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setInvites]);

    /**
     * Invite a user to a project
     */
    const inviteToProject = useCallback(async (
        projectId: number,
        email: string,
        expiresInDays: number = 7
    ): Promise<{ invite_id: number; message: string }> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.post<{ invite_id: number; message: string }>(
                `/conversations/projects/${projectId}/invite`,
                { email, expires_in_days: expiresInDays } as InviteRequest
            );
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send invite';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError]);

    /**
     * Accept an invite
     */
    const acceptInvite = useCallback(async (
        inviteId: number
    ): Promise<{ project_id: number; message: string }> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.post<{ project_id: number; message: string }>(
                `/conversations/projects/invites/${inviteId}/accept`
            );
            removeInviteFromStore(inviteId);
            // Refresh projects to include the new one
            await fetchProjects();
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to accept invite';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, removeInviteFromStore, fetchProjects]);

    /**
     * Decline an invite
     */
    const declineInvite = useCallback(async (inviteId: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.post(`/conversations/projects/invites/${inviteId}/decline`);
            removeInviteFromStore(inviteId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to decline invite';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, removeInviteFromStore]);

    /**
     * Fetch invites for a project (owner view)
     * Returns pending, declined, and expired invites
     */
    const fetchProjectInvites = useCallback(async (
        projectId: number
    ): Promise<ProjectInviteOwnerView[]> => {
        try {
            const response = await api.get<ProjectInvitesOwnerResponse>(
                `/conversations/projects/${projectId}/invites`
            );
            return response.invites;
        } catch (error) {
            console.error('Failed to fetch project invites:', error);
            return [];
        }
    }, [api]);

    /**
     * Cancel a pending invite (owner only)
     */
    const cancelProjectInvite = useCallback(async (
        projectId: number,
        inviteId: number
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/conversations/projects/${projectId}/invites/${inviteId}`);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to cancel invite';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError]);

    // ============================================
    // Members
    // ============================================

    /**
     * Get project members
     */
    const fetchProjectMembers = useCallback(async (projectId: number): Promise<ProjectMember[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<ProjectMembersResponse>(
                `/conversations/projects/${projectId}/members`
            );
            return response.members;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch members';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError]);

    /**
     * Remove a member from a project
     */
    const removeMember = useCallback(async (
        projectId: number,
        memberUserId: number
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/conversations/projects/${projectId}/members/${memberUserId}`);
            // Refresh project to update member count
            await fetchProject(projectId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove member';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, fetchProject]);

    /**
     * Leave a project (remove self)
     */
    const leaveProject = useCallback(async (projectId: number, userId: number): Promise<void> => {
        await removeMember(projectId, userId);
        removeProjectFromStore(projectId);
    }, [removeMember, removeProjectFromStore]);

    // ============================================
    // Community (Open Projects)
    // ============================================

    /**
     * Fetch all shared_open projects user hasn't joined yet
     */
    const fetchCommunityProjects = useCallback(async (): Promise<CommunityProject[]> => {
        try {
            const response = await api.get<CommunityProjectsResponse>(
                '/conversations/projects/community'
            );
            return response.projects;
        } catch (error) {
            console.error('Failed to fetch community projects:', error);
            return [];
        }
    }, [api]);

    /**
     * Join a shared_open project (no invite required)
     */
    const joinProject = useCallback(async (
        projectId: number
    ): Promise<{ success: boolean; message: string }> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.post<{ success: boolean; message: string }>(
                `/conversations/projects/${projectId}/join`
            );
            // Refresh projects to include the new one
            await fetchProjects();
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to join project';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, fetchProjects]);

    return useMemo(() => ({
        // Projects CRUD
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        // Conversation membership
        fetchProjectConversations,
        addConversationToProject,
        removeConversationFromProject,
        getConversationProjects,
        // Invites
        fetchInvites,
        inviteToProject,
        acceptInvite,
        declineInvite,
        fetchProjectInvites,
        cancelProjectInvite,
        // Members
        fetchProjectMembers,
        removeMember,
        leaveProject,
        // Community
        fetchCommunityProjects,
        joinProject,
    }), [
        fetchProjects,
        fetchProject,
        createProject,
        updateProject,
        deleteProject,
        fetchProjectConversations,
        addConversationToProject,
        removeConversationFromProject,
        getConversationProjects,
        fetchInvites,
        inviteToProject,
        acceptInvite,
        declineInvite,
        fetchProjectInvites,
        cancelProjectInvite,
        fetchProjectMembers,
        removeMember,
        leaveProject,
        fetchCommunityProjects,
        joinProject,
    ]);
}
