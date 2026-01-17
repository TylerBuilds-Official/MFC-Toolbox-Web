import { ReactNode } from 'react';
import { Lightbulb, Info, CheckCircle, AlertTriangle } from 'lucide-react';

type TipVariant = 'info' | 'success' | 'warning';

interface GuideTipProps {
    children: ReactNode;
    title?: string;
    variant?: TipVariant;
    action?: ReactNode;
}

const variantIcons = {
    info: Lightbulb,
    success: CheckCircle,
    warning: AlertTriangle,
};

const variantTitles = {
    info: 'Quick Tip',
    success: 'Pro Tip',
    warning: 'Note',
};

const GuideTip = ({ 
    children, 
    title, 
    variant = 'info',
    action 
}: GuideTipProps) => {
    const Icon = variantIcons[variant];
    const displayTitle = title || variantTitles[variant];

    return (
        <div className={`guide-tip variant-${variant}`}>
            <div className="guide-tip-icon">
                <Icon size={18} />
            </div>
            <div className="guide-tip-content">
                <div className="guide-tip-title">{displayTitle}</div>
                <p className="guide-tip-text">{children}</p>
                {action && (
                    <div className="guide-tip-action">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GuideTip;
