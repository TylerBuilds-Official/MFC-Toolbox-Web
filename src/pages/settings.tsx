import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApi } from '../auth';
import { useAuth } from '../auth';
import { useNavbarContext } from '../hooks';
import MemoriesTab from '../components/settings/MemoriesTab';
import ConnectorsTab from '../components/settings/ConnectorsTab';
import ModelTab from '../components/settings/ModelTab';
import GeneralTab from '../components/settings/GeneralTab';
import { GearIcon, BookmarkIcon, CpuIcon } from '../assets/svg/memories';
import { PlugIcon } from '../assets/svg/connectors';
import '../styles/settings.css';
import LoadingSpinner from "../components/loadingSpinner.tsx";

type Settings = {
    provider: string;
    default_model: string;
    dark_mode: boolean;
    // Streaming & Reasoning
    enable_streaming: boolean;
    enable_extended_thinking: boolean;
    openai_reasoning_effort: string;
    anthropic_thinking_budget: number;
};

type SettingsTab = 'general' | 'model' | 'memories' | 'connectors';

// Tab display names for navbar context
const TAB_LABELS: Record<SettingsTab, string> = {
    general: 'General',
    model: 'Model',
    memories: 'Memories',
    connectors: 'Connectors',
};

const VALID_TABS: SettingsTab[] = ['general', 'model', 'memories', 'connectors'];

// Type for location state
interface LocationState {
    tab?: SettingsTab;
}

const SettingsPage: React.FC = () => {
    const { user } = useAuth();
    const api = useApi();
    const { setPageContext, clearPageContext } = useNavbarContext();
    const location = useLocation();
    const hasHandledLocationState = useRef(false);

    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Handle location state for tab routing (e.g., from guide pages)
    useEffect(() => {
        const state = location.state as LocationState | null;
        if (!state || hasHandledLocationState.current) return;

        if (state.tab && VALID_TABS.includes(state.tab)) {
            setActiveTab(state.tab);
        }

        hasHandledLocationState.current = true;
        // Clear the state so refreshing doesn't re-apply
        window.history.replaceState({}, document.title);
    }, [location.state]);

    // Update navbar context when tab changes
    useEffect(() => {
        setPageContext('Settings', TAB_LABELS[activeTab]);
        return () => clearPageContext();
    }, [activeTab, setPageContext, clearPageContext]);

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

    const handleSettingsUpdate = (updates: Partial<Settings>) => {
        if (!settings) return;
        setSettings({ ...settings, ...updates });
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
                <p>Configure your FabCore AI experience.</p>
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
                    className={`settings-tab ${activeTab === 'model' ? 'settings-tab-active' : ''}`}
                    onClick={() => setActiveTab('model')}
                >
                    <CpuIcon size={16} />
                    Model
                </button>
                <button
                    className={`settings-tab ${activeTab === 'memories' ? 'settings-tab-active' : ''}`}
                    onClick={() => setActiveTab('memories')}
                >
                    <BookmarkIcon size={16} />
                    Memories
                </button>
                <button
                    className={`settings-tab ${activeTab === 'connectors' ? 'settings-tab-active' : ''}`}
                    onClick={() => setActiveTab('connectors')}
                >
                    <PlugIcon size={16} />
                    Connectors
                </button>
            </div>

            {/* Message Notifications */}
            {message && (
                <div className={`message ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'general' && (
                <GeneralTab
                    user={user}
                    saving={saving}
                />
            )}

            {activeTab === 'model' && (
                <ModelTab
                    settings={settings}
                    saving={saving}
                    onProviderChange={handleProviderChange}
                    onModelChange={handleModelChange}
                    onToggleChange={handleToggleChange}
                    onSelectChange={handleSelectChange}
                    onNumberChange={handleNumberChange}
                    onSettingsUpdate={handleSettingsUpdate}
                />
            )}

            {activeTab === 'memories' && <MemoriesTab />}

            {activeTab === 'connectors' && <ConnectorsTab />}
        </div>
    );
};

export default SettingsPage;
