import { NavLink } from 'react-router-dom';
import { 
    BookOpen, 
    Cpu, 
    MessageSquare, 
    Wrench, 
    MessagesSquare,
    FolderKanban,
    BarChart3,
    Brain,
    PanelLeftClose,
    Menu
} from 'lucide-react';

interface GuideSidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    onToggle: () => void;
}

const navItems = [
    { path: '/guide', title: 'Welcome', icon: BookOpen, end: true },
    { path: '/guide/models', title: 'Models & Providers', icon: Cpu },
    { path: '/guide/chat', title: 'Using the Chat', icon: MessageSquare },
    { path: '/guide/toolbox', title: 'The Toolbox', icon: Wrench },
    { path: '/guide/conversations', title: 'Conversations', icon: MessagesSquare },
    { path: '/guide/projects', title: 'Projects', icon: FolderKanban },
    { path: '/guide/data', title: 'Data Page', icon: BarChart3 },
    { path: '/guide/memories', title: 'Memories', icon: Brain },
];

const GuideSidebar = ({ isOpen, onToggle }: GuideSidebarProps) => {
    return (
        <>
            {/* Expand button - always visible when sidebar is closed */}
            {!isOpen && (
                <button 
                    className="guide-sidebar-expand"
                    onClick={onToggle}
                    aria-label="Open guide navigation"
                >
                    <Menu size={20} />
                </button>
            )}

            {/* Sidebar */}
            <aside className={`guide-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="guide-sidebar-header">
                    <div className="guide-sidebar-title">
                        <BookOpen size={20} />
                        Guide
                    </div>
                    <button 
                        className="guide-sidebar-toggle"
                        onClick={onToggle}
                        aria-label="Close guide navigation"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </div>

                <nav className="guide-sidebar-nav">
                    {navItems.map(({ path, title, icon: Icon, end }) => (
                        <NavLink
                            key={path}
                            to={path}
                            end={end}
                            className={({ isActive }) => 
                                `guide-sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            <Icon size={18} />
                            {title}
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};

// Export nav items for use in GuideNav
export const guideNavItems = navItems;

export default GuideSidebar;
