import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface GuideTryItProps {
    to: string;
    state?: Record<string, unknown>;
    children?: string;
}

const GuideTryIt = ({ to, state, children = 'Try it' }: GuideTryItProps) => {
    // Check if it's an external link or internal route
    const isExternal = to.startsWith('http');

    if (isExternal) {
        return (
            <a 
                href={to} 
                className="guide-try-it"
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
                <ArrowRight size={16} />
            </a>
        );
    }

    return (
        <Link to={to} state={state} className="guide-try-it">
            {children}
            <ArrowRight size={16} />
        </Link>
    );
};

export default GuideTryIt;
