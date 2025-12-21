import { useMemo } from "react";
import { useApi } from "../auth/useApi";
import { createAuthenticatedApi } from "../services/api";

export function useAuthenticatedApi() {
    const { getAccessToken } = useApi();
    
    const api = useMemo(
        () => createAuthenticatedApi(getAccessToken),
        [getAccessToken]
    );
    
    return api;
}
