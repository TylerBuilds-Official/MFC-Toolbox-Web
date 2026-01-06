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
    DataGroup,
    DataToolsResponse,
    DataSessionsResponse,
    DataSessionResponse,
    ExecuteSessionResponse,
    SessionGroupResponse,
    DataGroupsResponse,
    CreateDataSessionRequest,
    UpdateDataSessionRequest,
    CreateDataGroupRequest,
    UpdateDataGroupRequest,
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
    const removeSessionFromStore = useDataStore((state) => state.removeSession);
    const setActiveResult = useDataStore((state) => state.setActiveResult);
    const setGroups = useDataStore((state) => state.setGroups);
    const addGroupToStore = useDataStore((state) => state.addGroup);
    const updateGroupInStore = useDataStore((state) => state.updateGroup);
    const removeGroupFromStore = useDataStore((state) => state.removeGroup);

    // ============================================
    // Tools
    // ============================================

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

    // ============================================
    // Sessions
    // ============================================

    /**
     * Fetch user's data sessions
     */
    const fetchSessions = useCallback(async (params?: {
        limit?: number;
        offset?: number;
        tool_name?: string;
        status?: string;
        group_id?: number;
        ungrouped?: boolean;
    }): Promise<DataSession[]> => {
        setLoading(true);
        setError(null);

        try {
            const queryParams = new URLSearchParams();
            if (params?.limit) queryParams.set('limit', params.limit.toString());
            if (params?.offset) queryParams.set('offset', params.offset.toString());
            if (params?.tool_name) queryParams.set('tool_name', params.tool_name);
            if (params?.status) queryParams.set('status', params.status);
            if (params?.group_id) queryParams.set('group_id', params.group_id.toString());
            if (params?.ungrouped) queryParams.set('ungrouped', 'true');

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

    /**
     * Soft delete a session
     */
    const deleteSession = useCallback(async (sessionId: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/data/sessions/${sessionId}`);
            removeSessionFromStore(sessionId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete session';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, removeSessionFromStore]);

    // ============================================
    // Groups
    // ============================================

    /**
     * Fetch user's data groups
     */
    const fetchGroups = useCallback(async (): Promise<DataGroup[]> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get<DataGroupsResponse>('/data/groups');
            setGroups(response.groups);
            return response.groups;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to fetch groups';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, setGroups]);

    /**
     * Create a new group
     */
    const createGroup = useCallback(async (
        request: CreateDataGroupRequest
    ): Promise<DataGroup> => {
        setLoading(true);
        setError(null);

        try {
            const group = await api.post<DataGroup>('/data/groups', request);
            addGroupToStore(group);
            return group;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to create group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, addGroupToStore]);

    /**
     * Update a group
     */
    const updateGroup = useCallback(async (
        groupId: number,
        updates: UpdateDataGroupRequest
    ): Promise<DataGroup> => {
        setLoading(true);
        setError(null);

        try {
            const group = await api.patch<DataGroup>(`/data/groups/${groupId}`, updates);
            updateGroupInStore(group);
            return group;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to update group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateGroupInStore]);

    /**
     * Delete a group
     */
    const deleteGroup = useCallback(async (groupId: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/data/groups/${groupId}`);
            removeGroupFromStore(groupId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, removeGroupFromStore]);

    /**
     * Assign a session to a group
     */
    const assignSessionToGroup = useCallback(async (
        sessionId: number,
        groupId: number
    ): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.post(`/data/sessions/${sessionId}/group`, { group_id: groupId });
            // Update session in store with new group
            const sessions = useDataStore.getState().sessions;
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                updateSessionInStore({ ...session, session_group_id: groupId });
            }
            // Update group session counts
            await fetchGroups();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to assign session to group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateSessionInStore, fetchGroups]);

    /**
     * Remove a session from its group
     */
    const removeSessionFromGroup = useCallback(async (sessionId: number): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            await api.delete(`/data/sessions/${sessionId}/group`);
            // Update session in store with no group
            const sessions = useDataStore.getState().sessions;
            const session = sessions.find(s => s.id === sessionId);
            if (session) {
                updateSessionInStore({ ...session, session_group_id: null });
            }
            // Update group session counts
            await fetchGroups();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove session from group';
            setError(message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [api, setLoading, setError, updateSessionInStore, fetchGroups]);

    return useMemo(() => ({
        // Tools
        fetchTools,
        // Sessions
        fetchSessions,
        fetchSession,
        createSession,
        executeSession,
        fetchResults,
        updateSession,
        fetchSessionGroup,
        createAndExecute,
        deleteSession,
        // Groups
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        assignSessionToGroup,
        removeSessionFromGroup,
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
        deleteSession,
        fetchGroups,
        createGroup,
        updateGroup,
        deleteGroup,
        assignSessionToGroup,
        removeSessionFromGroup,
    ]);
}
