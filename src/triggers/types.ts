// Trigger Types

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export type UserRole = 'pending' | 'user' | 'admin';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastOptions {
    duration?: number;
    action?: ToastAction;
}

export interface TriggerParameter {
    name: string;
    description?: string;
    required?: boolean;
    type?: 'string' | 'number';
}


export interface TriggerContext {
    message: string;
    args: string[];
    params?: Record<string, string>;
    conversationId: number | null;
    showToast: (message: string, variant?: ToastVariant, options?: ToastOptions | number) => void;
    clearMessages: () => void;
    getAllTriggers: () => Trigger[];
}


export interface TriggerResult {
    handled: boolean;
    preventDefault?: boolean;
    response?: string;
    simulateFailure?: boolean;
}


export interface Trigger {
    command: string;
    description: string;
    devOnly?: boolean;
    requiredRole?: UserRole;
    parameters?: TriggerParameter[];
    execute: (ctx: TriggerContext) => Promise<TriggerResult> | TriggerResult;
}
