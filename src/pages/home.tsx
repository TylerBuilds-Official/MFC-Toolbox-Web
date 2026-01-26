import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { 
    MessageSquare, 
    BarChart3, 
    Wrench, 
    Settings, 
    BookOpen,
    ArrowRight,
    Sparkles
} from 'lucide-react';
import '../styles/landing.css';

const featureCards = [
    {
        path: '/chat',
        title: 'Chat with Atlas',
        description: 'Your AI-powered assistant for fabrication workflows, document processing, and internal operations.',
        icon: MessageSquare,
        accent: 'primary',
        cta: 'Start Chatting'
    },
    {
        path: '/data',
        title: 'Data & Analytics',
        description: 'Visualize production data, generate reports, and explore insights from your fabrication operations.',
        icon: BarChart3,
        accent: 'blue',
        cta: 'View Data'
    },
    {
        path: '/chat',
        title: 'Toolbox',
        description: 'Quick-access tools for common tasks — labor bids, document lookups, job scanning, and more.',
        icon: Wrench,
        accent: 'orange',
        cta: 'Open Toolbox',
        isToolbox: true
    },
    {
        path: '/settings',
        title: 'Settings',
        description: 'Configure your AI preferences, default models, and personalize your FabCore experience.',
        icon: Settings,
        accent: 'gray',
        cta: 'Configure'
    },
];

const Home = () => {
    const { user } = useAuth();
    const firstName = user?.display_name.split(' ')[0] || 'there';

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-icon">
                    <Sparkles size={48} />
                </div>
                <h1 className="landing-hero-title">
                    Welcome back, {firstName}
                </h1>
                <p className="landing-hero-subtitle">
                    FabCore AI is your central hub for AI-powered fabrication tools, 
                    data analysis, and workflow automation.
                </p>
                <Link to="/chat" className="landing-hero-cta">
                    <MessageSquare size={20} />
                    Start a conversation with Atlas
                    <ArrowRight size={18} />
                </Link>
            </section>

            {/* Feature Cards */}
            <section className="landing-features">
                <div className="landing-features-grid">
                    {featureCards.map(({ path, title, description, icon: Icon, accent, cta, isToolbox }) => (
                        <Link 
                            key={title} 
                            to={path}
                            state={isToolbox ? { openToolbox: true } : undefined}
                            className={`landing-feature-card accent-${accent}`}
                        >
                            <div className="landing-feature-icon">
                                <Icon size={28} />
                            </div>
                            <h2 className="landing-feature-title">{title}</h2>
                            <p className="landing-feature-description">{description}</p>
                            <span className="landing-feature-cta">
                                {cta}
                                <ArrowRight size={16} />
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Guide Section */}
            <section className="landing-guide">
                <div className="landing-guide-content">
                    <div className="landing-guide-icon">
                        <BookOpen size={24} />
                    </div>
                    <div className="landing-guide-text">
                        <h3 className="landing-guide-title">New to FabCore AI?</h3>
                        <p className="landing-guide-description">
                            Check out the guide for tips on getting the most out of Atlas, 
                            understanding models, and using the toolbox effectively.
                        </p>
                    </div>
                    <Link to="/guide" className="landing-guide-link">
                        Explore the Guide
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Home;
