import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface GuideTryItProps {
    to: string;
    children?: string;
}

const GuideTryIt = ({ to, children = 'Try it' }: GuideTryItProps) => {
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
        <Link to={to} className="guide-try-it">
            {children}
            <ArrowRight size={16} />
        </Link>
    );
};

export default GuideTryIt;
