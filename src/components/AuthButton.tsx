import { useAuth } from "../auth";

interface AuthButtonProps {
    className?: string;
}

export function AuthButton({ className }: AuthButtonProps) {
    const { isAuthenticated, isLoading, user, login, logout } = useAuth();

    if (isLoading) {
        return (
            <button className={className} disabled>
                Loading...
            </button>
        );
    }

    if (isAuthenticated && user) {
        return (
            <div className="auth-user-info">
                <span className="user-name">{user.display_name}</span>
                <span className="user-role">({user.role})</span>
                <button className={className} onClick={logout}>
                    Sign Out
                </button>
            </div>
        );
    }

    return (
        <button className={className} onClick={login}>
            Sign In
        </button>
    );
}
