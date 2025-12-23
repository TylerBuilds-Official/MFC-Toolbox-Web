
interface RegenResponseButtonProps {
    onRegen: () => void;
    isRegenerating: boolean;
    className?: string;
}

const RegenResponseButton = ({ onRegen, isRegenerating, className = "" }: RegenResponseButtonProps) => {
    return (
        <button
            onClick={onRegen}
            disabled={isRegenerating}
            className={`regenerate-btn ${isRegenerating ? 'regenerating' : ''} ${className}`}
            aria-label={isRegenerating ? 'Regenerating...' : 'Regenerate response'}>

            {isRegenerating ? (

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>

            ) : (

                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>

            )}

        </button>
    );
};

export default RegenResponseButton;