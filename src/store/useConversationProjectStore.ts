/**
 * Conversation Projects Store
 * Zustand store for managing conversation projects, invites, and UI state
 */

import { create } from 'zustand';
import type { 
    ConversationProject, 
    ProjectInvite,
    ProjectConversation,
} from '../types';

interface ConversationProjectState {
    // Data
    projects: ConversationProject[];
    ownedProjects: ConversationProject[];
    sharedProjects: ConversationProject[];
    invites: ProjectInvite[];
    activeProjectConversations: ProjectConversation[];
    
    // UI State
    isLoading: boolean;
    error: string | null;
    expandedProjects: Set<number>;  // Track which project folders are expanded
    activeProjectId: number | null; // Currently viewing project context
}

interface ConversationProjectActions {
    // Projects
    setProjects: (projects: ConversationProject[], owned: ConversationProject[], shared: ConversationProject[]) => void;
    addProject: (project: ConversationProject) => void;
    updateProject: (project: ConversationProject) => void;
    removeProject: (projectId: number) => void;
    
    // Project conversations
    setActiveProjectConversations: (conversations: ProjectConversation[]) => void;
    setActiveProjectId: (projectId: number | null) => void;
    
    // Invites
    setInvites: (invites: ProjectInvite[]) => void;
    removeInvite: (inviteId: number) => void;
    
    // UI State
    toggleProjectExpanded: (projectId: number) => void;
    setProjectExpanded: (projectId: number, expanded: boolean) => void;
    
    // Loading/Error
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    
    // Reset
    reset: () => void;
}

const initialState: ConversationProjectState = {
    projects: [],
    ownedProjects: [],
    sharedProjects: [],
    invites: [],
    activeProjectConversations: [],
    isLoading: false,
    error: null,
    expandedProjects: new Set(),
    activeProjectId: null,
};

export const useConversationProjectStore = create<ConversationProjectState & ConversationProjectActions>((set) => ({
    ...initialState,
    
    // Projects
    setProjects: (projects, owned, shared) => set({ 
        projects, 
        ownedProjects: owned, 
        sharedProjects: shared 
    }),
    
    addProject: (project) => set((state) => {
        const isOwned = project.is_owner;
        return {
            projects: [project, ...state.projects],
            ownedProjects: isOwned ? [project, ...state.ownedProjects] : state.ownedProjects,
            sharedProjects: isOwned ? state.sharedProjects : [project, ...state.sharedProjects],
        };
    }),
    
    updateProject: (project) => set((state) => ({
        projects: state.projects.map((p) => p.id === project.id ? project : p),
        ownedProjects: state.ownedProjects.map((p) => p.id === project.id ? project : p),
        sharedProjects: state.sharedProjects.map((p) => p.id === project.id ? project : p),
    })),
    
    removeProject: (projectId) => set((state) => {
        const newExpanded = new Set(state.expandedProjects);
        newExpanded.delete(projectId);
        return {
            projects: state.projects.filter((p) => p.id !== projectId),
            ownedProjects: state.ownedProjects.filter((p) => p.id !== projectId),
            sharedProjects: state.sharedProjects.filter((p) => p.id !== projectId),
            expandedProjects: newExpanded,
            activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
        };
    }),
    
    // Project conversations
    setActiveProjectConversations: (conversations) => set({ activeProjectConversations: conversations }),
    setActiveProjectId: (projectId) => set({ activeProjectId: projectId }),
    
    // Invites
    setInvites: (invites) => set({ invites }),
    removeInvite: (inviteId) => set((state) => ({
        invites: state.invites.filter((i) => i.id !== inviteId),
    })),
    
    // UI State
    toggleProjectExpanded: (projectId) => set((state) => {
        const newExpanded = new Set(state.expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        return { expandedProjects: newExpanded };
    }),
    
    setProjectExpanded: (projectId, expanded) => set((state) => {
        const newExpanded = new Set(state.expandedProjects);
        if (expanded) {
            newExpanded.add(projectId);
        } else {
            newExpanded.delete(projectId);
        }
        return { expandedProjects: newExpanded };
    }),
    
    // Loading/Error
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    
    // Reset
    reset: () => set(initialState),
}));

// Selector hooks for common patterns
export const useOwnedProjects = () => useConversationProjectStore((state) => state.ownedProjects);
export const useSharedProjects = () => useConversationProjectStore((state) => state.sharedProjects);
export const useProjectInvites = () => useConversationProjectStore((state) => state.invites);
export const useActiveProjectId = () => useConversationProjectStore((state) => state.activeProjectId);
