import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
    type ReactNode,
} from 'react';
import { useApi } from '../auth/useApi';

// ============================================
// Types
// ============================================

type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => Promise<void>;
    toggleTheme: () => Promise<void>;
    isLoading: boolean;
}

interface ThemeProviderProps {
    children: ReactNode;
    /** Initial theme from user settings (fetched after auth) */
    initialTheme?: Theme;
}

// ============================================
// Constants
// ============================================

const THEME_STORAGE_KEY = 'fabcore-theme';
const DEFAULT_THEME: Theme = 'dark';

// ============================================
// Context
// ============================================

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ============================================
// Helper Functions
// ============================================

/** Get theme from localStorage */
function getStoredTheme(): Theme | null {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'light') {
            return stored;
        }
    } catch (e) {
        console.warn('[Theme] Failed to read from localStorage:', e);
    }
    return null;
}

/** Save theme to localStorage */
function storeTheme(theme: Theme): void {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
        console.warn('[Theme] Failed to write to localStorage:', e);
    }
}

/** Apply theme to document */
function applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Also update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0d12' : '#ffffff');
    }
}

// ============================================
// Provider Component
// ============================================

export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
    const api = useApi();
    
    // Initialize theme: localStorage > initialTheme (from settings) > default
    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = getStoredTheme();
        if (stored) return stored;
        if (initialTheme) return initialTheme;
        return DEFAULT_THEME;
    });
    
    const [isLoading, setIsLoading] = useState(false);

    // Apply theme to DOM whenever it changes
    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    // Sync with initialTheme when it becomes available (after settings load)
    useEffect(() => {
        if (initialTheme && !getStoredTheme()) {
            // Only sync if user hasn't explicitly set a preference locally
            setThemeState(initialTheme);
        }
    }, [initialTheme]);

    // Set theme and sync to backend
    const setTheme = useCallback(async (newTheme: Theme) => {
        // Optimistically update UI
        setThemeState(newTheme);
        storeTheme(newTheme);
        
        // Sync to backend
        setIsLoading(true);
        try {
            await api.post('/settings', { dark_mode: newTheme === 'dark' });
        } catch (error) {
            console.error('[Theme] Failed to sync theme to backend:', error);
            // Don't revert - local state is still valid
        } finally {
            setIsLoading(false);
        }
    }, [api]);

    // Toggle between themes
    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        await setTheme(newTheme);
    }, [theme, setTheme]);

    const value = useMemo<ThemeContextType>(() => ({
        theme,
        setTheme,
        toggleTheme,
        isLoading,
    }), [theme, setTheme, toggleTheme, isLoading]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

// ============================================
// Hook
// ============================================

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// ============================================
// Utility: Initialize theme before React hydrates
// (prevents flash of wrong theme)
// ============================================

export function initializeTheme(): void {
    const stored = getStoredTheme();
    const theme = stored || DEFAULT_THEME;
    applyTheme(theme);
}
