import { Link } from 'react-router-dom';
import { 
    BookOpen,
    Cpu, 
    MessageSquare, 
    Wrench, 
    MessagesSquare,
    FolderKanban,
    BarChart3,
    Brain
} from 'lucide-react';
import { usePageContext } from '../../hooks';
import GuidePage from './GuidePage';

const quickLinks = [
    { 
        path: '/guide/models', 
        title: 'Models & Providers', 
        description: 'Choose the right AI for your task',
        icon: Cpu 
    },
    { 
        path: '/guide/chat', 
        title: 'Using the Chat', 
        description: 'Natural language commands',
        icon: MessageSquare 
    },
    { 
        path: '/guide/toolbox', 
        title: 'The Toolbox', 
        description: 'Click-to-use tools',
        icon: Wrench 
    },
    { 
        path: '/guide/conversations', 
        title: 'Conversations', 
        description: 'Managing your chat history',
        icon: MessagesSquare 
    },
    { 
        path: '/guide/projects', 
        title: 'Projects', 
        description: 'Organize & share conversations',
        icon: FolderKanban 
    },
    { 
        path: '/guide/data', 
        title: 'Data Page', 
        description: 'Visualizations & reports',
        icon: BarChart3 
    },
    { 
        path: '/guide/memories', 
        title: 'Memories', 
        description: 'How Atlas remembers context',
        icon: Brain 
    },
];

const GuideIndex = () => {
    usePageContext('Guide', 'Welcome');
    return (
        <GuidePage>
            <div className="guide-welcome">
                <div className="guide-welcome-icon">
                    <BookOpen size={40} />
                </div>
                <h1 className="guide-welcome-title">Welcome to the FabCore AI Guide</h1>
                <p className="guide-welcome-subtitle">
                    Everything you need to know to get the most out of Atlas, 
                    your AI-powered assistant for fabrication workflows, document processing, and internal operations.
                </p>
            </div>

            <div className="guide-quick-links">
                {quickLinks.map(({ path, title, description, icon: Icon }) => (
                    <Link key={path} to={path} className="guide-quick-link">
                        <div className="guide-quick-link-icon">
                            <Icon size={24} />
                        </div>
                        <span className="guide-quick-link-title">{title}</span>
                        <span className="guide-quick-link-description">{description}</span>
                    </Link>
                ))}
            </div>
        </GuidePage>
    );
};

export default GuideIndex;
