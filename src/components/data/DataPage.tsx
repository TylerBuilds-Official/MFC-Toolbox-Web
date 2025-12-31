/**
 * DataPage - Main data visualization page
 * Handles URL params, loads sessions, coordinates child components
 */

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { useDataApi } from '../../store/useDataApi';
import DataToolSidebar from './DataToolSidebar';
import DataVisualizationPanel from './DataVisualizationPanel';
import DataSessionHeader from './DataSessionHeader';
import styles from '../../styles/data_page/DataPage.module.css';

const DataPage = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session');
    
    const { 
        activeSession, 
        activeResult, 
        isLoading, 
        error,
        sidebarOpen,
        setSidebarOpen,
    } = useDataStore();
    
    const { fetchSession, fetchResults, fetchTools } = useDataApi();

    // Load tools on mount
    useEffect(() => {
        fetchTools().catch(console.error);
    }, [fetchTools]);

    // Load session from URL param
    useEffect(() => {
        if (sessionId) {
            const id = parseInt(sessionId, 10);
            if (!isNaN(id)) {
                fetchSession(id)
                    .then((session) => {
                        // If session has results, fetch them
                        if (session.status === 'success') {
                            return fetchResults(id);
                        }
                    })
                    .catch(console.error);
            }
        }
    }, [sessionId, fetchSession, fetchResults]);

    return (
        <div className={styles.dataPage}>
            {/* Tool Sidebar */}
            <DataToolSidebar 
                isOpen={sidebarOpen} 
                onClose={() => setSidebarOpen(false)} 
            />

            {/* Main Content */}
            <div className={styles.mainContent}>
                {/* Header with session info */}
                {activeSession && (
                    <DataSessionHeader session={activeSession} />
                )}

                {/* Toggle button for sidebar */}
                <button
                    className={styles.sidebarToggle}
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open Tools"
                    title="Open Tools"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
                </button>

                {/* Error State */}
                {error && (
                    <div className={styles.errorBanner}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {/* Visualization Panel */}
                <DataVisualizationPanel 
                    session={activeSession}
                    result={activeResult}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default DataPage;
