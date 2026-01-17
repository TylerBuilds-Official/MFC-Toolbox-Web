import React, { useState, useEffect } from 'react';
import { useApi } from '../../auth';
import LoadingSpinner from '../loadingSpinner';
import {
    FolderIcon,
    FolderOpenIcon,
    ChevronRightIcon,
    ChevronDownIcon,
    HomeIcon,
} from '../../assets/svg/connectors';

interface FolderEntry {
    name: string;
    is_dir: boolean;
    size: number | null;
}

interface BrowseResponse {
    path: string;
    entries: FolderEntry[];
    error?: string;
}

interface FolderBrowserModalProps {
    onSelect: (path: string) => void;
    onClose: () => void;
}

const DRIVE_LETTERS = ['C:', 'D:', 'E:', 'F:'];

const FolderBrowserModal: React.FC<FolderBrowserModalProps> = ({ onSelect, onClose }) => {
    const api = useApi();

    const [currentPath, setCurrentPath] = useState<string>('');
    const [entries, setEntries] = useState<FolderEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    // Load directory contents
    const loadDirectory = async (path: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post<BrowseResponse>(
                '/settings/connectors/filesystem/browse',
                { path: path || 'C:\\' }
            );

            if (response.error) {
                setError(response.error);
                setEntries([]);
            } else {
                setEntries(response.entries.sort((a, b) => a.name.localeCompare(b.name)));
                setCurrentPath(response.path);
            }
        } catch (err: any) {
            console.error('Failed to browse directory:', err);
            if (err?.response?.status === 503) {
                setError('Agent not connected. Please ensure the Toolbox Agent is running.');
            } else {
                setError('Failed to load directory');
            }
            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial load - show drive selection
    useEffect(() => {
        // Don't auto-load, let user pick a drive
    }, []);

    // Navigate to a folder
    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        loadDirectory(path);
    };

    // Navigate up one level
    const handleNavigateUp = () => {
        if (!currentPath) return;

        const parts = currentPath.split('\\').filter(Boolean);
        if (parts.length <= 1) {
            // Going back to drive selection
            setCurrentPath('');
            setEntries([]);
        } else {
            parts.pop();
            const newPath = parts.join('\\');
            handleNavigate(newPath.includes(':') ? newPath : newPath + '\\');
        }
    };

    // Get breadcrumb parts
    const getBreadcrumbs = (): { label: string; path: string }[] => {
        if (!currentPath) return [];

        const parts = currentPath.split('\\').filter(Boolean);
        const breadcrumbs: { label: string; path: string }[] = [];

        let accumulated = '';
        for (const part of parts) {
            accumulated += (accumulated ? '\\' : '') + part;
            breadcrumbs.push({
                label: part,
                path: accumulated,
            });
        }

        return breadcrumbs;
    };

    // Handle backdrop click
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="folder-browser-backdrop" onClick={handleBackdropClick}>
            <div className="folder-browser-modal">
                {/* Header */}
                <div className="folder-browser-header">
                    <h3>Select Folder</h3>
                    <button className="folder-browser-close" onClick={onClose}>
                        ×
                    </button>
                </div>

                {/* Breadcrumb Navigation */}
                <div className="folder-browser-breadcrumb">
                    <button
                        className="breadcrumb-item breadcrumb-home"
                        onClick={() => {
                            setCurrentPath('');
                            setEntries([]);
                        }}
                    >
                        <HomeIcon size={14} />
                        Drives
                    </button>
                    {getBreadcrumbs().map((crumb, index) => (
                        <React.Fragment key={crumb.path}>
                            <ChevronRightIcon size={14} className="breadcrumb-separator" />
                            <button
                                className="breadcrumb-item"
                                onClick={() => handleNavigate(crumb.path)}
                            >
                                {crumb.label}
                            </button>
                        </React.Fragment>
                    ))}
                </div>

                {/* Content */}
                <div className="folder-browser-content">
                    {loading ? (
                        <div className="folder-browser-loading">
                            <LoadingSpinner size="small" message="Loading..." variant="secondary" />
                        </div>
                    ) : error ? (
                        <div className="folder-browser-error">
                            <p>{error}</p>
                        </div>
                    ) : !currentPath ? (
                        // Drive selection
                        <div className="folder-browser-drives">
                            {DRIVE_LETTERS.map((drive) => (
                                <button
                                    key={drive}
                                    className="folder-browser-drive"
                                    onClick={() => handleNavigate(drive + '\\')}
                                >
                                    <FolderIcon size={24} />
                                    <span>{drive}</span>
                                </button>
                            ))}
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="folder-browser-empty">
                            <p>No subfolders in this directory</p>
                        </div>
                    ) : (
                        <div className="folder-browser-list">
                            {entries.map((entry) => (
                                <button
                                    key={entry.name}
                                    className="folder-browser-item"
                                    onClick={() =>
                                        handleNavigate(
                                            currentPath +
                                                (currentPath.endsWith('\\') ? '' : '\\') +
                                                entry.name
                                        )
                                    }
                                >
                                    <FolderIcon size={18} />
                                    <span>{entry.name}</span>
                                    <ChevronRightIcon size={14} className="folder-item-chevron" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="folder-browser-footer">
                    <div className="folder-browser-selected">
                        {currentPath ? (
                            <>
                                <span className="selected-label">Selected:</span>
                                <span className="selected-path">{currentPath}</span>
                            </>
                        ) : (
                            <span className="selected-label">Select a folder to allow access</span>
                        )}
                    </div>
                    <div className="folder-browser-actions">
                        <button className="folder-browser-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="folder-browser-btn-select"
                            onClick={() => onSelect(currentPath)}
                            disabled={!currentPath}
                        >
                            Allow Access
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FolderBrowserModal;
