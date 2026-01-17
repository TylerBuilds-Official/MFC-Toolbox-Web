import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavItem {
    path: string;
    title: string;
}

interface GuideNavProps {
    prev?: NavItem | null;
    next?: NavItem | null;
}

const GuideNav = ({ prev, next }: GuideNavProps) => {
    return (
        <nav className="guide-nav">
            {prev ? (
                <Link to={prev.path} className="guide-nav-link prev">
                    <span className="guide-nav-label">
                        <ChevronLeft size={14} />
                        Previous
                    </span>
                    <span className="guide-nav-title">{prev.title}</span>
                </Link>
            ) : (
                <div className="guide-nav-placeholder" />
            )}

            {next ? (
                <Link to={next.path} className="guide-nav-link next">
                    <span className="guide-nav-label">
                        Next
                        <ChevronRight size={14} />
                    </span>
                    <span className="guide-nav-title">{next.title}</span>
                </Link>
            ) : (
                <div className="guide-nav-placeholder" />
            )}
        </nav>
    );
};

export default GuideNav;
