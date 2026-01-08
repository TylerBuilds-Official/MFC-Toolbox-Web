import React, { useState, useEffect } from 'react';
import { useApi } from '../auth/useApi';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import ModelSelector from '../components/modelSelector';
import MemoriesTab from '../components/settings/MemoriesTab';
import { GearIcon, BookmarkIcon } from '../assets/svg/memories';
import '../styles/settings.css';
import LoadingSpinner from "../components/loadingSpinner.tsx";

type Settings = {
    provider: string;
    default_model: string;
    auto_save_conversations: boolean;
    dark_mode: boolean;
    // Streaming & Reasoning
    enable_streaming: boolean;
    enable_extended_thinking: boolean;
    openai_reasoning_effort: string;
    anthropic_thinking_budget: number;
};

type SettingsTab = 'general' | 'memories';

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const api = useApi();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
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

    const handleToggleChange = async (key: keyof Settings, value: boolean) => {
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

    const handleSelectChange = async (key: keyof Settings, value: string) => {
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

    const handleNumberChange = async (key: keyof Settings, value: number) => {
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

            {/* Tab Navigation */}
            <div className="settings-tabs">
                <button
                    className={`settings-tab ${activeTab === 'general' ? 'settings-tab-active' : ''}`}
                    onClick={() => setActiveTab('general')}
                >
                    <GearIcon size={16} />
                    General
                </button>
                <button
                    className={`settings-tab ${activeTab === 'memories' ? 'settings-tab-active' : ''}`}
                    onClick={() => setActiveTab('memories')}
                >
                    <BookmarkIcon size={16} />
                    Memories
                </button>
            </div>

            {/* Message Notifications */}
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'memories' ? (
                <MemoriesTab />
            ) : (
                <>
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

                    {/* Response Behavior Section */}
                    <div className="settings-section">
                        <h2 className="settings-section-title">Response Behavior</h2>

                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">Enable Streaming</h3>
                                    <p className="settings-card-description">
                                        Stream responses token-by-token for a more interactive experience.
                                    </p>
                                </div>
                                <label className="settings-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_streaming}
                                        onChange={(e) => handleToggleChange('enable_streaming', e.target.checked)}
                                        disabled={saving}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">Enable Extended Thinking</h3>
                                    <p className="settings-card-description">
                                        Show the model's reasoning process before responses. Available for Claude models with extended thinking capability.
                                    </p>
                                </div>
                                <label className="settings-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_extended_thinking}
                                        onChange={(e) => handleToggleChange('enable_extended_thinking', e.target.checked)}
                                        disabled={saving}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Advanced Reasoning Section */}
                    <div className="settings-section">
                        <h2 className="settings-section-title">Advanced Reasoning</h2>

                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">OpenAI Reasoning Effort</h3>
                                    <p className="settings-card-description">
                                        Controls how much effort OpenAI reasoning models (o1, o3) spend thinking. Higher effort may produce better results but takes longer.
                                    </p>
                                </div>
                                <span className="settings-badge settings-badge-openai">OpenAI</span>
                            </div>

                            <div className="settings-input-group">
                                <label className="settings-label">Effort Level</label>
                                <select
                                    className="settings-input settings-select"
                                    value={settings.openai_reasoning_effort}
                                    onChange={(e) => handleSelectChange('openai_reasoning_effort', e.target.value)}
                                    disabled={saving}
                                >
                                    <option value="low">Low - Faster responses</option>
                                    <option value="medium">Medium - Balanced (Default)</option>
                                    <option value="high">High - More thorough</option>
                                </select>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">Anthropic Thinking Budget</h3>
                                    <p className="settings-card-description">
                                        Maximum tokens Claude can use for extended thinking. Higher values allow deeper reasoning but increase response time and cost.
                                    </p>
                                </div>
                                <span className="settings-badge settings-badge-anthropic">Anthropic</span>
                            </div>

                            <div className="settings-input-group">
                                <label className="settings-label">
                                    Token Budget: <strong>{settings.anthropic_thinking_budget.toLocaleString()}</strong>
                                </label>
                                <div className="settings-range-container">
                                    <input
                                        type="range"
                                        className="settings-range"
                                        min="1024"
                                        max="32000"
                                        step="1024"
                                        value={settings.anthropic_thinking_budget}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            setSettings({ ...settings, anthropic_thinking_budget: value });
                                        }}
                                        onMouseUp={(e) => {
                                            const value = parseInt((e.target as HTMLInputElement).value);
                                            handleNumberChange('anthropic_thinking_budget', value);
                                        }}
                                        onTouchEnd={(e) => {
                                            const value = parseInt((e.target as HTMLInputElement).value);
                                            handleNumberChange('anthropic_thinking_budget', value);
                                        }}
                                        disabled={saving}
                                    />
                                    <div className="settings-range-labels">
                                        <span>1K</span>
                                        <span>8K</span>
                                        <span>16K</span>
                                        <span>24K</span>
                                        <span>32K</span>
                                    </div>
                                </div>
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
                                    <p><strong>Role:</strong> <span className="settings-role-badge">{user.role}</span></p>
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
                </>
            )}
        </div>
    );
};

export default SettingsPage;
