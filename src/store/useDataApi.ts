/**
 * Data API Hook
 * Wraps useApi for data visualization endpoints
 */

import { useCallback, useMemo } from 'react';
import { useApi } from '../auth';
import { useDataStore } from '../store/useDataStore';
import type {
    DataSession,
    DataResult,
    DataTool,
    DataToolsResponse,
    DataSessionsResponse,
    DataSessionResponse,
    ExecuteSessionResponse,
    SessionGroupResponse,
    CreateDataSessionRequest,
    UpdateDataSessionRequest,
} from '../types/data';

export function useDataApi() {
    const api = useApi();
    
    // Extract only the setter functions we need - these are stable references in Zustand
    const setLoading = useDataStore((state) => state.setLoading);
    const setExecuting = useDataStore((state) => state.setExecuting);
    const setError = useDataStore((state) => state.setError);
    const setTools = useDataStore((state) => state.setTools);
    const setSessions = useDataStore((state) => state.setSessions);
    const addSession = useDataStore((state) => state.addSession);
    const setActiveSession = useDataStore((state) => state.setActiveSession);
    const updateSessionInStore = useDataStore((state) => state.updateSession);
    const setActiveResult = useDataStore((state) => state.setActiveResult);

    /**
     * Fetch available data tools
     */
    const fetchTools = useCallback(async (): Promise<DataTool[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<DataToolsResponse>('/data/tools');
            setTools(response.tools);
            return response.tools;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch tools';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setTools]);

    /**
     * Fetch user's data sessions
     */
    const fetchSessions = useCallback(async (params?: {
        limit?: number;
        offset?: number;
        tool_name?: string;
        status?: string;
    }): Promise<DataSession[]> => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.set('limit', params.limit.toString());
            if (params?.offset) queryParams.set('offset', params.offset.toString());
            if (params?.tool_name) queryParams.set('tool_name', params.tool_name);
            if (params?.status) queryParams.set('status', params.status);

            const query = queryParams.toString();
            const endpoint = `/data/sessions${query ? `?${query}` : ''}`;

            const response = await api.get<DataSessionsResponse>(endpoint);
            setSessions(response.sessions);
            return response.sessions;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch sessions';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setSessions]);

    /**
     * Fetch a single session by ID
     */
    const fetchSession = useCallback(async (sessionId: number): Promise<DataSession> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<DataSessionResponse>(`/data/sessions/${sessionId}`);
            setActiveSession(response);
            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch session';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setActiveSession]);

    /**
     * Create a new data session (pending state)
     */
    const createSession = useCallback(async (
        request: CreateDataSessionRequest
    ): Promise<DataSession> => {
        setLoading(true);
        setError(null);

        try {
            const session = await api.post<DataSession>('/data/sessions', request);
            addSession(session);
            setActiveSession(session);
            return session;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create session';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, addSession, setActiveSession]);

    /**
     * Execute a session (run the tool)
     */
    const executeSession = useCallback(async (sessionId: number): Promise<ExecuteSessionResponse> => {
        setExecuting(true);
        setError(null);

        try {
            const response = await api.post<ExecuteSessionResponse>(
                `/data/sessions/${sessionId}/execute`
            );

            updateSessionInStore(response.session);

            if (response.result) {
                setActiveResult(response.result);
            }

            return response;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to execute session';
            setError(message);
            throw error;
        } finally {
            setExecuting(false);
        }
    }, [api, setExecuting, setError, updateSessionInStore, setActiveResult]);

    /**
     * Fetch results for a session
     */
    const fetchResults = useCallback(async (sessionId: number): Promise<DataResult> => {
        setLoading(true);
        setError(null);

        try {
            const result = await api.get<DataResult>(`/data/sessions/${sessionId}/results`);
            setActiveResult(result);
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch results';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setActiveResult]);

    /**
     * Update session visualization config
     */
    const updateSession = useCallback(async (
        sessionId: number,
        updates: UpdateDataSessionRequest
    ): Promise<DataSession> => {
        setLoading(true);
        setError(null);

        try {
            const session = await api.patch<DataSession>(
                `/data/sessions/${sessionId}`,
                updates
            );
            updateSessionInStore(session);
            return session;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update session';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateSessionInStore]);

    /**
     * Fetch session lineage (all versions)
     */
    const fetchSessionGroup = useCallback(async (groupId: number): Promise<DataSession[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<SessionGroupResponse>(
                `/data/sessions/groups/${groupId}`
            );
            return response.sessions;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch session group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError]);

    /**
     * Create and execute in one flow
     */
    const createAndExecute = useCallback(async (
        request: CreateDataSessionRequest
    ): Promise<{ session: DataSession; result: DataResult | null }> => {
        const session = await createSession(request);
        const response = await executeSession(session.id);
        return {
            session: response.session,
            result: response.result || null,
        };
    }, [createSession, executeSession]);

    return useMemo(() => ({
        fetchTools,
        fetchSessions,
        fetchSession,
        createSession,
        executeSession,
        fetchResults,
        updateSession,
        fetchSessionGroup,
        createAndExecute,
    }), [
        fetchTools,
        fetchSessions,
        fetchSession,
        createSession,
        executeSession,
        fetchResults,
        updateSession,
        fetchSessionGroup,
        createAndExecute,
    ]);
}
