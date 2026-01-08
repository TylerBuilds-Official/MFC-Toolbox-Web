/**
 * Memory types for user memory management.
 */

export type MemoryType = 'fact' | 'preference' | 'project' | 'skill' | 'context';

export interface Memory {
    id: number;
    user_id: number;
    memory_type: MemoryType;
    content: string;
    source_conversation_id: number | null;
    source_message_id: number | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    last_referenced_at: string | null;
    reference_count: number;
    expires_at: string | null;
    is_stale: boolean;
    is_expired: boolean;
}

export interface MemoriesResponse {
    memories: Memory[];
    count: number;
}

export interface StaleMemoriesResponse {
    memories: Memory[];
    count: number;
    stale_threshold_days: number;
}

export interface CreateMemoryRequest {
    content: string;
    memory_type: MemoryType;
}

export interface UpdateMemoryRequest {
    content?: string;
    memory_type?: MemoryType;
}

export const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
    fact: 'Fact',
    preference: 'Preference',
    project: 'Project',
    skill: 'Skill',
    context: 'Context',
};
