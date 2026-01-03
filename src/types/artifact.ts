/**
 * Artifact Types
 * Matches backend ChatArtifact models
 */

export type ArtifactType = 'data' | 'word' | 'excel' | 'pdf' | 'image';
export type ArtifactStatus = 'ready' | 'pending' | 'error' | 'opened';
export type ChartType = 'bar' | 'line' | 'pie' | 'table' | 'card' | 'area' | 'scatter';

export interface ArtifactGenerationParams {
    toolName: string;
    toolParams: Record<string, unknown>;
    chartType?: ChartType;
    xAxis?: string;
    yAxis?: string;
    groupBy?: string;
    seriesHints?: string[];
    jobNumber?: string;
}

export interface ArtifactGenerationResults {
    rowCount: number;
    columnCount: number;
    columns?: string[];
    error?: string;
}

export interface Artifact {
    id: string;  // UUID
    user_id: number;
    conversation_id: number;
    message_id: number | null;
    artifact_type: ArtifactType;
    title: string;
    generation_params: ArtifactGenerationParams | null;
    generation_results: ArtifactGenerationResults | null;
    status: ArtifactStatus;
    error_message: string | null;
    created_at: string;
    updated_at: string;
    accessed_at: string | null;
    access_count: number;
    metadata: Record<string, unknown> | null;
}

// Parsed from message content: <artifact id="..." type="..." title="..." />
export interface EmbeddedArtifact {
    id: string;
    type: ArtifactType;
    title: string;
}

// API Response types
export interface ArtifactResponse extends Artifact {}

export interface ArtifactsListResponse {
    artifacts: Artifact[];
    count: number;
}

export interface ConversationArtifactsResponse {
    conversation_id: number;
    artifacts: Artifact[];
    count: number;
}

export interface OpenArtifactResponse {
    session_id: number;
    is_new: boolean;
}
