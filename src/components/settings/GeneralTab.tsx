import React from 'react';
import { useConfirm } from '../ConfirmDialog';
import { useToast } from '../Toast';
import { useApi } from '../../auth';
import { useTheme } from '../../hooks';

interface User {
    email: string;
    display_name: string;
    role: string;
}

interface GeneralTabProps {
    user: User | null;
    saving: boolean;
}

const GeneralTab: React.FC<GeneralTabProps> = ({
    user,
    saving,
}) => {
    const api = useApi();
    const { confirm } = useConfirm();
    const { showToast } = useToast();
    const { theme, toggleTheme, isLoading: themeSaving } = useTheme();

    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'Reset Conversation',
            message: 'Are you sure you want to reset the conversation? This cannot be undone.',
            confirmText: 'Reset',
            cancelText: 'Cancel',
            variant: 'danger'
        });

        if (!confirmed) return;

        try {
            await api.post('/reset', {});
            showToast('Conversation reset successfully', 'success');
        } catch (error) {
            console.error("Failed to reset conversation:", error);
            showToast('Failed to reset conversation', 'error');
        }
    };

    const handleThemeToggle = async () => {
        try {
            await toggleTheme();
            showToast(`Switched to ${theme === 'dark' ? 'light' : 'dark'} mode`, 'success');
        } catch (error) {
            console.error("Failed to toggle theme:", error);
            showToast('Failed to update theme', 'error');
        }
    };

    return (
        <>
            {/* Account Information Section */}
            {user && (
                <div className="settings-section">
                    <h2 className="settings-section-title">Account Information</h2>

                    <div className="settings-card">
                        <div className="account-info">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Display Name:</strong> {user.display_name}</p>
                            <p><strong>Role:</strong> <span className="settings-role-badge">{user.role}</span></p>
                        </div>
                    </div>
                </div>
            )}

            {/* Preferences Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">Preferences</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Dark Mode</h3>
                            <p className="settings-card-description">
                                Use dark theme throughout the application.
                            </p>
                        </div>
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={theme === 'dark'}
                                onChange={handleThemeToggle}
                                disabled={saving || themeSaving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section">
                <h2 className="settings-section-title">Danger Zone</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Reset Conversation</h3>
                            <p className="settings-card-description">
                                Clear the current conversation history. This action cannot be undone.
                            </p>
                        </div>
                        <button
                            onClick={handleReset}
                            className="settings-btn settings-btn-danger"
                            disabled={saving}
                        >
                            Reset Conversation
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GeneralTab;
