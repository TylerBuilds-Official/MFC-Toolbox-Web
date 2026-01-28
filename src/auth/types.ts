export interface User {
    id: number;
    email: string;
    display_name: string;
    role: "pending" | "user" | "manager" | "admin";
    specialty_roles?: string[];
    is_active: boolean;
}

export interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    isPendingActivation: boolean;
    login: () => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
}
