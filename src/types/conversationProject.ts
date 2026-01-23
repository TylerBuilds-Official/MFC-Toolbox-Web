/**
 * Conversation Project Types
 * For organizing conversations into project folders with sharing capabilities
 */

export type ProjectType = 'private' | 'shared_locked' | 'shared_open';
export type PermissionLevel = 'owner_only' | 'anyone';

export interface ProjectPermissions {
    canChat: PermissionLevel;
    canCreateConversations: PermissionLevel;
    canEditInstructions: PermissionLevel;
    canInviteMembers: PermissionLevel;
    canRemoveConversations: PermissionLevel;
}

export const DEFAULT_PERMISSIONS: ProjectPermissions = {
    canChat: 'anyone',
    canCreateConversations: 'anyone',
    canEditInstructions: 'owner_only',
    canInviteMembers: 'owner_only',
    canRemoveConversations: 'anyone',
};

export interface ConversationProject {
    id: number;
    owner_id: number;
    name: string;
    description: string | null;
    color: string | null;
    custom_instructions: string | null;
    project_type: ProjectType;
    permissions: ProjectPermissions | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    conversation_count: number;
    member_count: number;
    is_owner: boolean;
    user_role: 'owner' | 'member' | null;
}

export interface ProjectMember {
    id: number;
    user_id: number;
    display_name: string;
    email: string;
    role: 'owner' | 'member';
    joined_at: string;
}

export interface ProjectInvite {
    id: number;
    project_id: number;
    project_name: string;
    project_description: string | null;
    project_color: string | null;
    project_type: ProjectType;
    invited_by_name: string;
    invited_by_email: string;
    created_at: string;
    expires_at: string;
}

// Invite as seen by project owner (includes status)
export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface ProjectInviteOwnerView {
    id: number;
    email: string;
    status: InviteStatus;
    invited_by_name: string;
    created_at: string;
    expires_at: string;
    responded_at: string | null;
}

// Minimal project info for badges/tags
export interface ProjectSummary {
    id: number;
    name: string;
    color: string | null;
    project_type: ProjectType;
}

// API Response types
export interface ProjectsResponse {
    projects: ConversationProject[];
    owned: ConversationProject[];
    shared: ConversationProject[];
    count: number;
}

export interface ProjectConversationsResponse {
    conversations: ProjectConversation[];
    count: number;
}

export interface ProjectConversation {
    id: number;
    user_id: number;
    title: string;
    summary: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    last_message_preview: string | null;
    added_to_project_at: string;
    project_ids: number[];
}

export interface ProjectMembersResponse {
    members: ProjectMember[];
    count: number;
}

export interface ProjectInvitesResponse {
    invites: ProjectInvite[];
    count: number;
}

// Owner's view of invites for their project
export interface ProjectInvitesOwnerResponse {
    invites: ProjectInviteOwnerView[];
    count: number;
}

export interface ConversationProjectsResponse {
    projects: ProjectSummary[];
    count: number;
}

// Create/Update request types
export interface CreateProjectRequest {
    name: string;
    description?: string;
    color?: string;
    custom_instructions?: string;
    project_type?: ProjectType;
    permissions?: ProjectPermissions;
}

export interface UpdateProjectRequest {
    name?: string;
    description?: string;
    color?: string;
    custom_instructions?: string;
    project_type?: ProjectType;
    permissions?: ProjectPermissions;
}

export interface InviteRequest {
    email: string;
    expires_in_days?: number;
}

export interface AddConversationRequest {
    project_id: number;
}

// Community project (for discovery/browse)
export type CommunityProjectStatus = 'owner' | 'member' | 'available';

export interface CommunityProject {
    id: number;
    name: string;
    description: string | null;
    color: string | null;
    owner_name: string;
    owner_email: string;
    member_count: number;
    conversation_count: number;
    created_at: string;
    user_status: CommunityProjectStatus;
}

export interface CommunityProjectsResponse {
    projects: CommunityProject[];
    count: number;
}
