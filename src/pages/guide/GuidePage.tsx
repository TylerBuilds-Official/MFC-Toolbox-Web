import { useState, useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { GuideSidebar, GuideNav, guideNavItems } from '../../components/guide';
import '../../styles/guide.css';

interface GuidePageProps {
    children: ReactNode;
}

const GuidePage = ({ children }: GuidePageProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Check for mobile on mount and resize
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            // Auto-close sidebar on mobile by default
            if (mobile) {
                setSidebarOpen(false);
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar on navigation (mobile only)
    useEffect(() => {
        if (isMobile) {
            setSidebarOpen(false);
        }
    }, [location.pathname, isMobile]);

    // Find current page index for prev/next navigation
    const currentIndex = guideNavItems.findIndex(
        item => item.end 
            ? location.pathname === item.path 
            : location.pathname.startsWith(item.path) && item.path !== '/guide'
    );

    // Handle the /guide exact match case
    const actualIndex = location.pathname === '/guide' 
        ? 0 
        : currentIndex === -1 
            ? guideNavItems.findIndex(item => location.pathname === item.path)
            : currentIndex;

    const prevItem = actualIndex > 0 
        ? { path: guideNavItems[actualIndex - 1].path, title: guideNavItems[actualIndex - 1].title }
        : null;

    const nextItem = actualIndex < guideNavItems.length - 1 && actualIndex !== -1
        ? { path: guideNavItems[actualIndex + 1].path, title: guideNavItems[actualIndex + 1].title }
        : null;

    const handleToggle = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleBackdropClick = () => {
        setSidebarOpen(false);
    };

    return (
        <div className="guide-layout">
            {/* Backdrop for mobile */}
            <div 
                className={`guide-sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
                onClick={handleBackdropClick}
            />

            <GuideSidebar 
                isOpen={sidebarOpen}
                isMobile={isMobile}
                onToggle={handleToggle}
            />
            
            <main className="guide-content">
                <div className="guide-content-inner">
                    {children}
                    <GuideNav prev={prevItem} next={nextItem} />
                </div>
            </main>
        </div>
    );
};

export default GuidePage;
