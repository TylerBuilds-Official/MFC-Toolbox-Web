import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../auth';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmDialog';
import LoadingSpinner from '../loadingSpinner';
import Checkbox from '../Checkbox';
import {
    HardDriveIcon,
    CheckCircleIcon,
    XCircleIcon,
    TrashIcon,
    PlusIcon,
    AlertTriangleIcon,
} from '../../assets/svg/connectors';

interface AllowedFolder {
    id: number;
    user_id: string;
    path: string;
    can_read: boolean;
    can_write: boolean;
    can_delete: boolean;
    created_at: string;
}

interface ConnectorStatus {
    connector_type: string;
    enabled: boolean;
    agent_connected: boolean;
    agent_hostname: string | null;
    agent_version: string | null;
    folders: AllowedFolder[];
}

interface FolderPickerResponse {
    path: string | null;
    cancelled: boolean;
    error: string | null;
}

const ConnectorsTab: React.FC = () => {
    const api = useApi();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // State
    const [status, setStatus] = useState<ConnectorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pickingFolder, setPickingFolder] = useState(false);

    // Load connector status
    const loadStatus = useCallback(async () => {
        try {
            const data = await api.get<ConnectorStatus>('/settings/connectors/filesystem');
            setStatus(data);
        } catch (error) {
            console.error('Failed to load connector status:', error);
            showToast('Failed to load connector status', 'error');
        } finally {
            setLoading(false);
        }
    }, [api, showToast]);

    useEffect(() => {
        loadStatus();
    }, [loadStatus]);

    // Handlers
    const handleToggleEnabled = async () => {
        if (!status) return;

        setSaving(true);
        try {
            await api.put('/settings/connectors/filesystem', {
                enabled: !status.enabled,
            });
            setStatus({ ...status, enabled: !status.enabled });
            showToast(
                status.enabled ? 'Filesystem connector disabled' : 'Filesystem connector enabled',
                'success'
            );
        } catch (error) {
            console.error('Failed to toggle connector:', error);
            showToast('Failed to update connector', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handlePickFolder = async () => {
        setPickingFolder(true);
        showToast('Opening folder picker on your computer...', 'info');
        
        try {
            const response = await api.post<FolderPickerResponse>(
                '/settings/connectors/filesystem/pick-folder',
                {}
            );
            
            if (response.error) {
                showToast(response.error, 'error');
                return;
            }
            
            if (response.cancelled || !response.path) {
                // User cancelled - no toast needed
                return;
            }
            
            // Add the selected folder
            await handleAddFolder(response.path);
            
        } catch (error: any) {
            console.error('Failed to pick folder:', error);
            if (error?.response?.status === 503) {
                showToast('Agent not connected. Please ensure the Toolbox Agent is running.', 'error');
            } else {
                showToast('Failed to open folder picker', 'error');
            }
        } finally {
            setPickingFolder(false);
        }
    };

    const handleAddFolder = async (path: string) => {
        try {
            const newFolder = await api.post<AllowedFolder>('/settings/connectors/filesystem/folders', {
                path,
                can_read: true,
                can_write: false,
                can_delete: false,
            });
            
            setStatus((prev) => 
                prev ? { ...prev, folders: [...prev.folders, newFolder] } : prev
            );
            showToast('Folder added successfully', 'success');
        } catch (error: any) {
            console.error('Failed to add folder:', error);
            if (error?.response?.status === 409) {
                showToast('Folder already allowed', 'error');
            } else {
                showToast('Failed to add folder', 'error');
            }
        }
    };

    const handleUpdatePermissions = async (
        folderId: number,
        updates: { can_read?: boolean; can_write?: boolean; can_delete?: boolean }
    ) => {
        try {
            const updated = await api.put<AllowedFolder>(
                `/settings/connectors/filesystem/folders/${folderId}`,
                updates
            );
            
            setStatus((prev) =>
                prev
                    ? {
                          ...prev,
                          folders: prev.folders.map((f) =>
                              f.id === folderId ? updated : f
                          ),
                      }
                    : prev
            );
            showToast('Permissions updated', 'success');
        } catch (error) {
            console.error('Failed to update permissions:', error);
            showToast('Failed to update permissions', 'error');
        }
    };

    const handleRemoveFolder = async (folderId: number, path: string) => {
        const confirmed = await confirm({
            title: 'Remove Folder Access',
            message: `Remove access to "${path}"? Claude will no longer be able to access files in this folder.`,
            confirmText: 'Remove',
            cancelText: 'Cancel',
            variant: 'danger',
        });

        if (!confirmed) return;

        try {
            await api.delete(`/settings/connectors/filesystem/folders/${folderId}`);
            setStatus((prev) =>
                prev
                    ? { ...prev, folders: prev.folders.filter((f) => f.id !== folderId) }
                    : prev
            );
            showToast('Folder access removed', 'success');
        } catch (error) {
            console.error('Failed to remove folder:', error);
            showToast('Failed to remove folder', 'error');
        }
    };

    if (loading) {
        return (
            <div className="connectors-loading">
                <LoadingSpinner size="small" message="Loading connectors..." variant="secondary" />
            </div>
        );
    }

    if (!status) {
        return (
            <div className="connectors-error">
                <p>Failed to load connector settings. Please refresh the page.</p>
            </div>
        );
    }

    const isDisabled = !status.agent_connected;

    return (
        <div className="connectors-tab">
            {/* Filesystem Connector Card */}
            <div className="settings-section">
                <h2 className="settings-section-title">Filesystem Connector</h2>

                <div className="settings-card">
                    {/* Header with status and toggle */}
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <div className="connector-title-row">
                                <HardDriveIcon size={20} />
                                <h3 className="settings-card-title">Local File Access</h3>
                            </div>
                            <p className="settings-card-description">
                                Allow Claude to read and write files on your computer.
                                Only folders you explicitly allow can be accessed.
                            </p>
                        </div>
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={status.enabled}
                                onChange={handleToggleEnabled}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>

                    {/* Agent Status */}
                    <div className="connector-agent-status">
                        {status.agent_connected ? (
                            <div className="agent-status agent-status-connected">
                                <CheckCircleIcon size={16} />
                                <span>
                                    Connected to <strong>{status.agent_hostname}</strong>
                                </span>
                                <span className="agent-version">v{status.agent_version}</span>
                            </div>
                        ) : (
                            <div className="agent-status agent-status-disconnected">
                                <XCircleIcon size={16} />
                                <span>Agent not connected</span>
                            </div>
                        )}
                    </div>

                    {/* Disconnected Warning */}
                    {!status.agent_connected && (
                        <div className="connector-warning">
                            <AlertTriangleIcon size={18} />
                            <div className="connector-warning-content">
                                <strong>Agent not connected</strong>
                                <p>
                                    The Toolbox Agent must be running on your computer to use
                                    filesystem features. If the agent is installed, try restarting
                                    it. Contact IT if you need the agent installed.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Folders Section */}
                    <div className={`connector-folders ${isDisabled ? 'connector-folders-disabled' : ''}`}>
                        <div className="connector-folders-header">
                            <h4>Allowed Folders</h4>
                            <button
                                className="connector-add-btn"
                                onClick={handlePickFolder}
                                disabled={isDisabled || pickingFolder}
                            >
                                {pickingFolder ? (
                                    <>
                                        <LoadingSpinner size="tiny" variant="inline" />
                                        Waiting...
                                    </>
                                ) : (
                                    <>
                                        <PlusIcon size={14} />
                                        Add Folder
                                    </>
                                )}
                            </button>
                        </div>

                        {status.folders.length === 0 ? (
                            <div className="connector-folders-empty">
                                <p>No folders configured. Add a folder to allow Claude access.</p>
                            </div>
                        ) : (
                            <div className="connector-folders-list">
                                {status.folders.map((folder) => (
                                    <div key={folder.id} className="connector-folder-item">
                                        <div className="connector-folder-path">
                                            <HardDriveIcon size={16} />
                                            <span>{folder.path}</span>
                                        </div>
                                        <div className="connector-folder-permissions">
                                            <Checkbox
                                                checked={folder.can_read}
                                                onChange={(checked) =>
                                                    handleUpdatePermissions(folder.id, {
                                                        can_read: checked,
                                                    })
                                                }
                                                disabled={isDisabled}
                                                label="Read"
                                                size="small"
                                            />
                                            <Checkbox
                                                checked={folder.can_write}
                                                onChange={(checked) =>
                                                    handleUpdatePermissions(folder.id, {
                                                        can_write: checked,
                                                    })
                                                }
                                                disabled={isDisabled}
                                                label="Write"
                                                size="small"
                                            />
                                            <Checkbox
                                                checked={folder.can_delete}
                                                onChange={(checked) =>
                                                    handleUpdatePermissions(folder.id, {
                                                        can_delete: checked,
                                                    })
                                                }
                                                disabled={isDisabled}
                                                label="Delete"
                                                size="small"
                                            />
                                        </div>
                                        <button
                                            className="connector-folder-remove"
                                            onClick={() => handleRemoveFolder(folder.id, folder.path)}
                                            disabled={isDisabled}
                                            title="Remove folder access"
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="connector-info-card">
                    <p>
                        <strong>ℹ️ How it works:</strong> The filesystem connector allows Claude to
                        read and write files on your computer through the Toolbox Agent. Only
                        folders you explicitly allow can be accessed, and you control the
                        permissions for each folder.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConnectorsTab;
