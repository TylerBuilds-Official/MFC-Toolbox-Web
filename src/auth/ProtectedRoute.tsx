import type {ReactNode} from "react";
import { useAuth } from "./AuthContext";
import LoadingSpinner from "../components/loading.tsx";

interface ProtectedRouteProps {
    children: ReactNode;
    requiredRole?: "user" | "admin";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
    const { isAuthenticated, isLoading, user, isPendingActivation, login, error } = useAuth();

    if (isLoading) {
        return <LoadingSpinner size="large" message="Authenticating..." variant="primary"/>;
    }

    if (!isAuthenticated) {
        return (
            <div className="auth-required">
                <h2>Authentication Required</h2>
                <p>Please sign in to access this page.</p>
                {error && <p className="auth-error">{error}</p>}
                <button onClick={login}>Sign In</button>
            </div>
        );
    }

    if (isPendingActivation) {
        return (
            <div className="auth-pending">
                <h2>Account Pending Activation</h2>
                <p>Account pending activation. Contact an administrator.</p>
            </div>
        );
    }

    if (requiredRole === "admin" && user?.role !== "admin") {
        return (
            <div className="auth-forbidden">
                <h2>Access Denied</h2>
                <p>You don't have permission to access this page. Admin access required.</p>
            </div>
        );
    }

    if (requiredRole === "user" && user?.role === "pending") {
        return (
            <div className="auth-forbidden">
                <h2>Access Denied</h2>
                <p>Your account is pending approval. Please wait for an administrator to activate your account.</p>
            </div>
        );
    }

    return <>{children}</>;
}
