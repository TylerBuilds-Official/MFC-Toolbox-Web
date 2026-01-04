/**
 * DataSessionSidebar - Right-side panel showing user's data sessions
 * Allows browsing and selecting previous data explorations
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useDataApi } from '../../store/useDataApi';
import DataSessionItem from './DataSessionItem';
import LoadingDots from '../LoadingDots';
import styles from '../../styles/data_page/DataSessionSidebar.module.css';

interface DataSessionSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DataSessionSidebar = ({ isOpen, onClose }: DataSessionSidebarProps) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activeSessionId = searchParams.get('session');
    
    const { sessions, isLoading } = useDataStore();
    const { fetchSessions, deleteSession } = useDataApi();

    // Fetch sessions when sidebar opens
    useEffect(() => {
        if (isOpen && sessions.length === 0) {
            fetchSessions({ limit: 50 }).catch(console.error);
        }
    }, [isOpen, sessions.length, fetchSessions]);

    const handleSelectSession = (sessionId: number) => {
        navigate(`/data?session=${sessionId}`);
        onClose();
    };

    const handleDeleteSession = async (sessionId: number) => {
        try {
            await deleteSession(sessionId);
            // If we deleted the active session, navigate away
            if (activeSessionId === String(sessionId)) {
                navigate('/data');
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const handleRefresh = () => {
        fetchSessions({ limit: 50 }).catch(console.error);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className={`${styles.backdrop} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />

            {/* Sidebar Panel */}
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <h2>Data Sessions</h2>
                    </div>
                    
                    <div className={styles.headerActions}>
                        <button 
                            className={styles.refreshBtn} 
                            onClick={handleRefresh}
                            aria-label="Refresh sessions"
                            title="Refresh"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 2v6h-6" />
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                                <path d="M3 22v-6h6" />
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                            </svg>
                        </button>
                        
                        <button 
                            className={styles.closeBtn} 
                            onClick={onClose} 
                            aria-label="Close sidebar"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className={styles.content}>
                    {/* Loading State */}
                    {isLoading && (
                        <div className={styles.loadingState}>
                            <LoadingDots variant="primary" message="Loading sessions..." size="small" />
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && sessions.length === 0 && (
                        <div className={styles.emptyState}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>No sessions yet</span>
                            <p>Run a data tool to create your first session!</p>
                        </div>
                    )}

                    {/* Sessions List */}
                    {!isLoading && sessions.length > 0 && (
                        <div className={styles.sessionsList}>
                            {sessions.map(session => (
                                <DataSessionItem
                                    key={session.id}
                                    session={session}
                                    isActive={activeSessionId === String(session.id)}
                                    onSelect={() => handleSelectSession(session.id)}
                                    onDelete={() => handleDeleteSession(session.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
};

export default DataSessionSidebar;
