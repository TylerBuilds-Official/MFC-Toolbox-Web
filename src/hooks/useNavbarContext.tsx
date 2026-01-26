import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface NavbarContextType {
    pageLabel: string | null;
    pageDescription: string | null;
    setPageContext: (label: string | null, description?: string | null) => void;
    clearPageContext: () => void;
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined);

export const NavbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [pageLabel, setPageLabel] = useState<string | null>(null);
    const [pageDescription, setPageDescription] = useState<string | null>(null);

    const setPageContext = useCallback((label: string | null, description?: string | null) => {
        setPageLabel(label);
        setPageDescription(description ?? null);
    }, []);

    const clearPageContext = useCallback(() => {
        setPageLabel(null);
        setPageDescription(null);
    }, []);

    return (
        <NavbarContext.Provider value={{ pageLabel, pageDescription, setPageContext, clearPageContext }}>
            {children}
        </NavbarContext.Provider>
    );
};

export const useNavbarContext = (): NavbarContextType => {
    const context = useContext(NavbarContext);
    if (!context) {
        throw new Error('useNavbarContext must be used within a NavbarProvider');
    }
    return context;
};

// Hook for pages to easily set their context on mount/update
export const usePageContext = (label: string, description?: string) => {
    const { setPageContext, clearPageContext } = useNavbarContext();

    React.useEffect(() => {
        setPageContext(label, description);
        return () => clearPageContext();
    }, [label, description, setPageContext, clearPageContext]);
};
