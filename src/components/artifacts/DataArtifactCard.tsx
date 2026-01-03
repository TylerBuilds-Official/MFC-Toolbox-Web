/**
 * DataArtifactCard - Clickable card for data visualization artifacts
 * 
 * Rendered inline in chat messages where <artifact /> markers appear.
 * Clicking opens the data visualization page with a new or existing DataSession.
 */

import { useState } from 'react';
import { useApi } from '../../auth';
import type { EmbeddedArtifact, OpenArtifactResponse } from '../../types/artifact';
import styles from '../../styles/artifacts/DataArtifactCard.module.css';

interface DataArtifactCardProps {
    artifact: EmbeddedArtifact;
    onError?: (message: string) => void;
}

// Chart type icons
const ChartIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

const LoadingSpinner = () => (
    <div className={styles.spinner} />
);

const DataArtifactCard = ({ artifact, onError }: DataArtifactCardProps) => {
    const api = useApi();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClick = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post<OpenArtifactResponse>(
                `/artifacts/${artifact.id}/open`
            );

            // Open in new tab
            window.open(`/data?session=${response.session_id}`, '_blank');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to open artifact';
            setError(message);
            onError?.(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRetry = (e: React.MouseEvent) => {
        e.stopPropagation();
        setError(null);
        handleClick();
    };

    return (
        <div 
            className={`${styles.card} ${isLoading ? styles.loading : ''} ${error ? styles.error : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
        >
            <div className={styles.iconContainer}>
                {isLoading ? <LoadingSpinner /> : <ChartIcon />}
            </div>
            
            <div className={styles.content}>
                <span className={styles.title}>{artifact.title}</span>
                <span className={styles.subtitle}>
                    {error ? (
                        <span className={styles.errorText}>{error}</span>
                    ) : (
                        'Click to open visualization'
                    )}
                </span>
            </div>

            <div className={styles.action}>
                {error ? (
                    <button 
                        className={styles.retryButton}
                        onClick={handleRetry}
                        aria-label="Retry"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10" />
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                    </button>
                ) : (
                    <ExternalLinkIcon />
                )}
            </div>
        </div>
    );
};

export default DataArtifactCard;
