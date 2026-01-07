/**
 * Data Visualization Types
 * Matches backend DataSession, DataResult, DataGroup, and related models
 */

export interface VisualizationConfig {
    chart_type: 'bar' | 'line' | 'pie' | 'table' | 'card';
    x_axis?: string;
    y_axis?: string;
    options?: Record<string, unknown>;
}

export interface DataGroup {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    color: string | null;
    created_at: string;
    updated_at: string;
    session_count: number;
}



export interface DataSession {
    id: number;
    user_id: number;
    message_id: number | null;
    session_group_id: number | null;
    parent_session_id: number | null;
    tool_name: string;
    tool_params: Record<string, unknown> | null;
    visualization_config: VisualizationConfig | null;
    status: 'pending' | 'running' | 'success' | 'error';
    error_message: string | null;
    created_at: string;
    updated_at: string;
    title: string | null;
    summary: string | null;
    // Result preview metadata
    has_results?: boolean;
    row_count?: number | null;
    columns?: string[] | null;
}

export interface DataResult {
    id: number;
    session_id: number;
    columns: string[];
    rows: unknown[][];
    row_count: number;
    created_at: string;
}

export interface DataToolParameter {
    name: string;
    type: string;
    required: boolean;
    description: string;
}

export interface ChartConfig {
    x_axis: string;
    series_by: string;
    y_axis: string;
    x_axis_label?: string;
    y_axis_label?: string;
}

export interface DataTool {
    name: string;
    description: string;
    display_category: string;
    parameters: DataToolParameter[];
    default_chart_type?: string;
    chart_config?: ChartConfig;
}

// API Response types
export interface DataToolsResponse {
    tools: DataTool[];
}

export interface DataSessionsResponse {
    sessions: DataSession[];
    count: number;
}

export interface DataSessionResponse extends DataSession {
    has_results: boolean;
}

export interface ExecuteSessionResponse {
    session: DataSession;
    success: boolean;
    result?: DataResult;
}

export interface SessionGroupResponse {
    group_id: number;
    sessions: DataSession[];
    count: number;
}

// Create/Update request types
export interface CreateDataSessionRequest {
    tool_name: string;
    tool_params?: Record<string, unknown>;
    message_id?: number;
    parent_session_id?: number;
    visualization_config?: VisualizationConfig;
}

export interface UpdateDataSessionRequest {
    visualization_config?: VisualizationConfig;
    status?: string;
}

// Group API types
export interface DataGroupsResponse {
    groups: DataGroup[];
    count: number;
}

export interface CreateDataGroupRequest {
    name: string;
    description?: string;
    color?: string;
}

export interface UpdateDataGroupRequest {
    name?: string;
    description?: string;  // Empty string clears
    color?: string;        // Empty string clears
}

export interface AssignSessionToGroupRequest {
    group_id: number;
}
