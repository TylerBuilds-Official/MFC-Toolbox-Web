/**
 * DataSessionHeader - Shows session info, status, and actions
 */

import type { DataSession } from '../../types/data';
import styles from '../../styles/data_page/DataSessionHeader.module.css';

interface DataSessionHeaderProps {
    session: DataSession;
}

const DataSessionHeader = ({ session }: DataSessionHeaderProps) => {
    const formatToolName = (name: string): string => {
        return name
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'success':
                return styles.statusSuccess;
            case 'error':
                return styles.statusError;
            case 'running':
                return styles.statusRunning;
            default:
                return styles.statusPending;
        }
    };

    return (
        <div className={styles.header}>
            <div className={styles.info}>
                <h2 className={styles.toolName}>
                    {formatToolName(session.tool_name)}
                </h2>
                <div className={styles.meta}>
                    <span className={`${styles.status} ${getStatusColor(session.status)}`}>
                        {session.status}
                    </span>
                    <span className={styles.timestamp}>
                        {formatDate(session.created_at)}
                    </span>
                    {session.session_group_id && session.parent_session_id && (
                        <span className={styles.lineage}>
                            Refined from session #{session.parent_session_id}
                        </span>
                    )}
                </div>
            </div>

            {session.tool_params && Object.keys(session.tool_params).length > 0 && (
                <div className={styles.params}>
                    {Object.entries(session.tool_params).map(([key, value]) => (
                        <span key={key} className={styles.param}>
                            <span className={styles.paramKey}>{key}:</span>
                            <span className={styles.paramValue}>{String(value)}</span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DataSessionHeader;
