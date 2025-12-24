import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import '../styles/confirmDialog.css';

// ============================================
// Types
// ============================================

type ConfirmVariant = 'default' | 'warning' | 'danger';

interface ConfirmOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmVariant;
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
    resolve: ((value: boolean) => void) | null;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions | string) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function useConfirm(): ConfirmContextType {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}

// Icons
const WarningIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);


const DangerIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);


const InfoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
);


const variantIcons: Record<ConfirmVariant, React.ReactNode> = {
    default: <InfoIcon />,
    warning: <WarningIcon />,
    danger: <DangerIcon />,
};


interface ConfirmDialogProps {
    state: ConfirmState;
    onConfirm: () => void;
    onCancel: () => void;
}


const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onConfirm, onCancel }) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmButtonRef = useRef<HTMLButtonElement>(null);
    const [isExiting, setIsExiting] = useState(false);

    const variant = state.variant || 'default';
    const title = state.title || 'Confirm';
    const confirmText = state.confirmText || 'Confirm';
    const cancelText = state.cancelText || 'Cancel';


    // Focus management
    useEffect(() => {
        if (state.isOpen && confirmButtonRef.current) {
            confirmButtonRef.current.focus();
        }
    }, [state.isOpen]);


    // Keyboard handling
    useEffect(() => {
        if (!state.isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleCancel();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [state.isOpen]);


    // Lock body scroll when open
    useEffect(() => {
        if (state.isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [state.isOpen]);


    const handleConfirm = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            onConfirm();
        }, 150);
    };


    const handleCancel = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsExiting(false);
            onCancel();
        }, 150);
    };


    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };


    if (!state.isOpen && !isExiting) return null;


    return (
        <div
            className={`confirm-backdrop ${isExiting ? 'confirm-backdrop-exit' : ''}`}
            onClick={handleBackdropClick}
        >
            <div
                ref={dialogRef}
                className={`confirm-dialog confirm-${variant} ${isExiting ? 'confirm-dialog-exit' : ''}`}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby="confirm-message"
            >
                <div className={`confirm-icon confirm-icon-${variant}`}>
                    {variantIcons[variant]}
                </div>

                <div className="confirm-content">
                    <h3 id="confirm-title" className="confirm-title">{title}</h3>
                    <p id="confirm-message" className="confirm-message">{state.message}</p>
                </div>

                <div className="confirm-actions">
                    <button
                        className="confirm-btn confirm-btn-cancel"
                        onClick={handleCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        ref={confirmButtonRef}
                        className={`confirm-btn confirm-btn-confirm confirm-btn-${variant}`}
                        onClick={handleConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface ConfirmProviderProps {
    children: React.ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
    const [state, setState] = useState<ConfirmState>({
        isOpen: false,
        message: '',
        resolve: null,
    });

    const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
        return new Promise((resolve) => {
            const opts = typeof options === 'string' ? { message: options } : options;
            setState({
                isOpen: true,
                ...opts,
                resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.resolve?.(true);
        setState(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [state.resolve]);

    const handleCancel = useCallback(() => {
        state.resolve?.(false);
        setState(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [state.resolve]);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <ConfirmDialog
                state={state}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
        </ConfirmContext.Provider>
    );
};

export default ConfirmProvider;
