/**
 * Admin API Service
 * 
 * Provides typed methods for all admin endpoints.
 * All methods require admin role - the backend enforces this.
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

// Dashboard Stats
export interface DashboardStats {
    users: {
        total: number;
        by_role: {
            admin: number;
            manager: number;
            user: number;
            pending: number;
        };
        active_today: number;
        active_this_week: number;
    };
    conversations: {
        total: number;
        active: number;
        this_week: number;
    };
    messages: {
        total: number;
        this_week: number;
    };
    memories: {
        total: number;
        by_type: {
            fact: number;
            preference: number;
            project: number;
            skill: number;
            context: number;
        };
    };
    data_sessions: {
        total: number;
        by_status: {
            success: number;
            error: number;
            pending: number;
            running: number;
        };
    };
    generated_at: string;
}

// Users
export interface AdminUser {
    id: number;
    email: string;
    display_name: string;
    role: 'pending' | 'user' | 'manager' | 'admin';
    specialty_roles: string[];
    created_at: string;
    last_login_at: string | null;
}

export interface AdminUsersResponse {
    users: AdminUser[];
}

export interface UserSpecialty {
    specialty: string;
    granted_at: string;
    granted_by: number | null;
}

export interface UserSpecialtiesResponse {
    user_id: number;
    user_name: string;
    specialties: UserSpecialty[];
    count: number;
}

export interface SpecialtiesListResponse {
    specialties: string[];
    count: number;
}

export interface UsersBySpecialtyResponse {
    specialty: string;
    users: Array<{
        id: number;
        email: string;
        display_name: string;
        role: string;
    }>;
    count: number;
}

// User Activity
export interface UserActivity {
    user_id: number;
    email: string;
    display_name: string;
    role: string;
    created_at: string;
    last_login_at: string | null;
    conversation_count: number;
    message_count: number;
    memory_count: number;
    data_session_count: number;
    last_conversation_at: string | null;
    recent_conversations: Array<{
        id: number;
        title: string;
        updated_at: string;
        message_count: number;
    }>;
}

// Conversations
export interface AdminConversation {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    title: string;
    summary: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    message_count: number;
}

export interface AdminConversationsResponse {
    conversations: AdminConversation[];
    total: number;
    limit: number;
    offset: number;
}

// Memories
export interface AdminMemory {
    id: number;
    user_id: number;
    user_name: string;
    user_email: string;
    content: string;
    memory_type: 'fact' | 'preference' | 'project' | 'skill' | 'context';
    reference_count: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    last_referenced_at: string | null;
}

export interface AdminMemoriesResponse {
    memories: AdminMemory[];
    total: number;
    limit: number;
    offset: number;
}

// Tool Stats
export interface ToolStat {
    name: string;
    total_executions: number;
    success_count: number;
    error_count: number;
    pending_count: number;
    running_count: number;
    success_rate: number;
    last_used: string | null;
    unique_users: number;
}

export interface DailyTrend {
    date: string;
    executions: number;
}

export interface ToolStatsResponse {
    tools: ToolStat[];
    tool_count: number;
    daily_trend: DailyTrend[];
    generated_at: string;
}

// Audit Log
export interface AuditEvent {
    id: number;
    action: string;
    actor_id: number;
    actor_name: string;
    target_type: string | null;
    target_id: number | null;
    target_name: string | null;
    details: Record<string, unknown>;
    timestamp: string;
}

export interface AuditLogResponse {
    events: AuditEvent[];
    total: number;
    limit: number;
    offset: number;
}

export interface AuditActionsResponse {
    action_types: string[];
    count: number;
}

// Health
export interface HealthStatus {
    status: 'healthy' | 'degraded';
    version: string;
    uptime_seconds: number;
    checks: {
        database: {
            connected: boolean;
            latency_ms?: number;
            error?: string;
        };
        agents: {
            connected_count: number;
            agents: Array<{
                username: string;
                hostname: string;
                connected_at?: string;
            }>;
            error?: string;
        };
    };
    generated_at: string;
}

// API interface type (matches useApi return)
interface ApiClient {
    get: <T>(endpoint: string, options?: RequestInit) => Promise<T>;
    post: <T>(endpoint: string, body?: unknown) => Promise<T>;
    delete: <T>(endpoint: string) => Promise<T>;
}

// ============================================
// ADMIN API SERVICE
// ============================================

/**
 * Creates an admin API service bound to the provided API client.
 * Usage: const adminApi = createAdminApi(api) where api is from useApi()
 */
export function createAdminApi(api: ApiClient) {
    return {
        // ==========================================
        // Dashboard Stats (P0)
        // ==========================================

        /**
         * Get comprehensive dashboard statistics
         */
        getStats: (): Promise<DashboardStats> => {
            return api.get<DashboardStats>('/admin/stats');
        },

        // ==========================================
        // User Management
        // ==========================================

        /**
         * List all users with their roles and specialties
         */
        getUsers: (): Promise<AdminUsersResponse> => {
            return api.get<AdminUsersResponse>('/admin/users');
        },

        /**
         * Get detailed activity for a specific user
         */
        getUserActivity: (userId: number): Promise<UserActivity> => {
            return api.get<UserActivity>(`/admin/users/${userId}/activity`);
        },

        /**
         * Set a user's base role
         */
        setUserRole: (userId: number, role: string): Promise<{ status: string; user_id: number; role: string }> => {
            return api.post(`/admin/users/${userId}/role?role=${encodeURIComponent(role)}`);
        },

        /**
         * Get all specialties for a user
         */
        getUserSpecialties: (userId: number): Promise<UserSpecialtiesResponse> => {
            return api.get<UserSpecialtiesResponse>(`/admin/users/${userId}/specialties`);
        },

        /**
         * Grant a specialty to a user
         */
        grantSpecialty: (userId: number, specialty: string): Promise<{ status: string; user_id: number; specialty: string; granted_by: number }> => {
            return api.post(`/admin/users/${userId}/specialties?specialty=${encodeURIComponent(specialty)}`);
        },

        /**
         * Revoke a specialty from a user
         */
        revokeSpecialty: (userId: number, specialty: string): Promise<{ status: string; user_id: number; specialty: string }> => {
            return api.delete(`/admin/users/${userId}/specialties/${encodeURIComponent(specialty)}`);
        },

        /**
         * List all valid specialties
         */
        getValidSpecialties: (): Promise<SpecialtiesListResponse> => {
            return api.get<SpecialtiesListResponse>('/admin/specialties');
        },

        /**
         * Get all users with a specific specialty
         */
        getUsersBySpecialty: (specialty: string): Promise<UsersBySpecialtyResponse> => {
            return api.get<UsersBySpecialtyResponse>(`/admin/specialties/${encodeURIComponent(specialty)}/users`);
        },

        // ==========================================
        // Cross-User Queries (P1)
        // ==========================================

        /**
         * List conversations across all users
         */
        getConversations: (params?: {
            limit?: number;
            offset?: number;
            user_id?: number;
            include_inactive?: boolean;
        }): Promise<AdminConversationsResponse> => {
            const searchParams = new URLSearchParams();
            if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
            if (params?.offset !== undefined) searchParams.set('offset', params.offset.toString());
            if (params?.user_id !== undefined) searchParams.set('user_id', params.user_id.toString());
            if (params?.include_inactive !== undefined) searchParams.set('include_inactive', params.include_inactive.toString());
            
            const query = searchParams.toString();
            return api.get<AdminConversationsResponse>(`/admin/conversations${query ? `?${query}` : ''}`);
        },

        /**
         * List memories across all users
         */
        getMemories: (params?: {
            limit?: number;
            offset?: number;
            user_id?: number;
            memory_type?: 'fact' | 'preference' | 'project' | 'skill' | 'context';
            include_inactive?: boolean;
        }): Promise<AdminMemoriesResponse> => {
            const searchParams = new URLSearchParams();
            if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
            if (params?.offset !== undefined) searchParams.set('offset', params.offset.toString());
            if (params?.user_id !== undefined) searchParams.set('user_id', params.user_id.toString());
            if (params?.memory_type !== undefined) searchParams.set('memory_type', params.memory_type);
            if (params?.include_inactive !== undefined) searchParams.set('include_inactive', params.include_inactive.toString());
            
            const query = searchParams.toString();
            return api.get<AdminMemoriesResponse>(`/admin/memories${query ? `?${query}` : ''}`);
        },

        // ==========================================
        // Tool Stats (P2)
        // ==========================================

        /**
         * Get tool usage statistics
         */
        getToolStats: (): Promise<ToolStatsResponse> => {
            return api.get<ToolStatsResponse>('/admin/tools/stats');
        },

        // ==========================================
        // Audit Log (P2)
        // ==========================================

        /**
         * Get audit log entries
         */
        getAuditLog: (params?: {
            limit?: number;
            offset?: number;
            action_type?: string;
            actor_id?: number;
            target_type?: string;
        }): Promise<AuditLogResponse> => {
            const searchParams = new URLSearchParams();
            if (params?.limit !== undefined) searchParams.set('limit', params.limit.toString());
            if (params?.offset !== undefined) searchParams.set('offset', params.offset.toString());
            if (params?.action_type !== undefined) searchParams.set('action_type', params.action_type);
            if (params?.actor_id !== undefined) searchParams.set('actor_id', params.actor_id.toString());
            if (params?.target_type !== undefined) searchParams.set('target_type', params.target_type);
            
            const query = searchParams.toString();
            return api.get<AuditLogResponse>(`/admin/audit${query ? `?${query}` : ''}`);
        },

        /**
         * Get list of all logged action types
         */
        getAuditActionTypes: (): Promise<AuditActionsResponse> => {
            return api.get<AuditActionsResponse>('/admin/audit/actions');
        },

        // ==========================================
        // Health Check (P3)
        // ==========================================

        /**
         * Get extended health status
         */
        getHealthStatus: (): Promise<HealthStatus> => {
            return api.get<HealthStatus>('/admin/health');
        },
    };
}

// Type for the returned admin API
export type AdminApi = ReturnType<typeof createAdminApi>;
