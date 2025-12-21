import React, { useState, useEffect } from 'react';
import { useApi } from '../auth/useApi';
import { useAuth } from '../auth/AuthContext';
import ModelSelector from '../components/modelSelector';
import '../styles/settings.css';

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
            const result = await api.post<{ provider: string; default_model: string }>('/settings', {
                provider: newProvider
            });
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
            await api.post('/settings', {
                provider: settings.provider,
                model: newModel
            });
            setSettings({
                ...settings,
                default_model: newModel
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
                    <p>Loading settings...</p>
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
                <p>Configure your MFC Toolbox experience and manage API connections.</p>
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

            {/* API Keys Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">API Keys</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Anthropic API Key</h3>
                            <p className="settings-card-description">Used for Claude model access.</p>
                        </div>
                        <span className="settings-status settings-status-warning">Not Set</span>
                    </div>

                    <div className="api-key-display">
                        <code>sk-ant-••••••••••••••••</code>
                        <div className="api-key-actions">
                            <button className="api-key-btn" aria-label="Copy">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <button className="api-key-btn" aria-label="Edit">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">OpenAI API Key</h3>
                            <p className="settings-card-description">Used for GPT model access and embeddings.</p>
                        </div>
                        <span className="settings-status settings-status-warning">Not Set</span>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">API Key</label>
                        <input
                            type="password"
                            className="settings-input"
                            placeholder="sk-proj-..."
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="settings-btn settings-btn-primary">Save Key</button>
                        <button className="settings-btn settings-btn-secondary">Test Connection</button>
                    </div>
                </div>
            </div>

            {/* MCP Servers Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">MCP Server Connections</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Drawing Coordinator</h3>
                            <p className="settings-card-description">Handles transmittal processing and document management.</p>
                        </div>
                        <span className="settings-status settings-status-success">Connected</span>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Server URL</label>
                        <input
                            type="text"
                            className="settings-input"
                            defaultValue="http://localhost:8080"
                        />
                    </div>
                </div>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">PDF Classifier</h3>
                            <p className="settings-card-description">Classifies construction drawings by discipline.</p>
                        </div>
                        <span className="settings-status settings-status-error">Disconnected</span>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Server URL</label>
                        <input
                            type="text"
                            className="settings-input"
                            defaultValue="http://localhost:8081"
                        />
                    </div>

                    <button className="settings-btn settings-btn-secondary">Reconnect</button>
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