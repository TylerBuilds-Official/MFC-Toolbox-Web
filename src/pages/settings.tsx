import React, { useState, useEffect } from 'react';
import { useApi } from '../auth/useApi';
import { useAuth } from '../auth/AuthContext';
import ModelSelector from '../components/modelSelector';
import '../styles/settings.css';
import LoadingSpinner from "../components/loading.tsx";

type Settings = {
    provider: string;
    default_model: string;
    auto_save_conversations: boolean;
    dark_mode: boolean;
};

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const api = useApi();

    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    const loadSettings = async () => {
        try {
            const data = await api.get<Settings>('/settings');
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleProviderChange = async (newProvider: string) => {
        if (!settings) return;

        setSaving(true);
        try {
            // Use the dedicated provider endpoint with query params
            const result = await api.post<{ status: string; provider: string; default_model: string }>(
                `/settings/provider?provider=${encodeURIComponent(newProvider)}`
            );
            setSettings({
                ...settings,
                provider: result.provider,
                default_model: result.default_model
            });
            showMessage('success', `Provider changed to ${newProvider}`);
        } catch (error) {
            console.error("Failed to change provider:", error);
            showMessage('error', 'Failed to change provider');
        } finally {
            setSaving(false);
        }
    };

    const handleModelChange = async (newModel: string) => {
        if (!settings) return;

        setSaving(true);
        try {
            // Use the dedicated provider endpoint with default_model param
            const result = await api.post<{ status: string; provider: string; default_model: string }>(
                `/settings/provider?provider=${encodeURIComponent(settings.provider)}&default_model=${encodeURIComponent(newModel)}`
            );
            setSettings({
                ...settings,
                default_model: result.default_model
            });
            showMessage('success', 'Default model updated');
        } catch (error) {
            console.error("Failed to change model:", error);
            showMessage('error', 'Failed to change model');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleChange = async (key: 'auto_save_conversations' | 'dark_mode', value: boolean) => {
        if (!settings) return;

        setSaving(true);
        try {
            const updates = { [key]: value };
            await api.post('/settings', updates);
            setSettings({
                ...settings,
                [key]: value
            });
            showMessage('success', 'Settings updated');
        } catch (error) {
            console.error("Failed to update settings:", error);
            showMessage('error', 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!confirm('Are you sure you want to reset the conversation? This cannot be undone.')) {
            return;
        }

        try {
            await api.post('/reset', {});
            showMessage('success', 'Conversation reset successfully');
        } catch (error) {
            console.error("Failed to reset conversation:", error);
            showMessage('error', 'Failed to reset conversation');
        }
    };

    if (loading) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <LoadingSpinner size='small' message="Loading settings..." variant="secondary"/>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="settings-page">
                <div className="settings-header">
                    <h1>Settings</h1>
                    <p className="error">Failed to load settings. Please refresh the page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Configure your MFC Toolbox experience.</p>
            </div>

            {/* Message Notifications */}
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Model Configuration Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">Model Configuration</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">AI Provider</h3>
                            <p className="settings-card-description">Select your preferred AI provider and model.</p>
                        </div>
                        <span className="settings-status settings-status-success">Active</span>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Model Provider</label>
                        <select
                            className="settings-input settings-select"
                            value={settings.provider}
                            onChange={(e) => handleProviderChange(e.target.value)}
                            disabled={saving}
                        >
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="openai">OpenAI (GPT)</option>
                        </select>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Default Model</label>
                        <ModelSelector
                            value={settings.default_model}
                            onChange={handleModelChange}
                            provider={settings.provider}
                            disabled={saving}
                        />
                    </div>
                </div>
            </div>

            {/* Preferences Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">Preferences</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Auto-save Conversations</h3>
                            <p className="settings-card-description">Automatically save chat history for future reference.</p>
                        </div>
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.auto_save_conversations}
                                onChange={(e) => handleToggleChange('auto_save_conversations', e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Dark Mode</h3>
                            <p className="settings-card-description">Use dark theme throughout the application.</p>
                        </div>
                        <label className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={settings.dark_mode}
                                onChange={(e) => handleToggleChange('dark_mode', e.target.checked)}
                                disabled={saving}
                            />
                            <span className="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Account Information Section */}
            {user && (
                <div className="settings-section">
                    <h2 className="settings-section-title">Account Information</h2>

                    <div className="settings-card">
                        <div className="account-info">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Display Name:</strong> {user.display_name}</p>
                            <p><strong>Role:</strong> {user.role}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Danger Zone */}
            <div className="settings-section">
                <h2 className="settings-section-title">Danger Zone</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Reset Conversation</h3>
                            <p className="settings-card-description">Clear the current conversation history. This action cannot be undone.</p>
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
        </div>
    );
};

export default SettingsPage;
