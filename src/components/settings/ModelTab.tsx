import React, { useState } from 'react';
import ModelSelector from '../modelSelector';
import GlassySelect from '../GlassySelect';

interface Settings {
    provider: string;
    default_model: string;
    enable_streaming: boolean;
    enable_extended_thinking: boolean;
    openai_reasoning_effort: string;
    anthropic_thinking_budget: number;
}

interface ModelTabProps {
    settings: Settings;
    saving: boolean;
    onProviderChange: (provider: string) => void;
    onModelChange: (model: string) => void;
    onToggleChange: (key: keyof Settings, value: boolean) => void;
    onSelectChange: (key: keyof Settings, value: string) => void;
    onNumberChange: (key: keyof Settings, value: number) => void;
    onSettingsUpdate: (updates: Partial<Settings>) => void;
}

// Provider options for the dropdown
const providerOptions = [
    { value: 'anthropic', label: 'Anthropic (Claude)' },
    { value: 'openai', label: 'OpenAI (GPT)' },
];

// Map thinking budget to user-friendly levels
const budgetToLevel = (budget: number): string => {
    if (budget <= 4096) return 'quick';
    if (budget <= 12000) return 'balanced';
    return 'thorough';
};

const levelToBudget = (level: string): number => {
    switch (level) {
        case 'quick': return 4096;
        case 'balanced': return 10240;
        case 'thorough': return 32000;
        default: return 10240;
    }
};

const ChevronIcon: React.FC<{ expanded: boolean; size?: number }> = ({ expanded, size = 16 }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
        }}
    >
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

const ModelTab: React.FC<ModelTabProps> = ({
    settings,
    saving,
    onProviderChange,
    onModelChange,
    onToggleChange,
    onSelectChange,
    onNumberChange,
    onSettingsUpdate,
}) => {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const handleThinkingDepthChange = (level: string) => {
        const budget = levelToBudget(level);
        onSettingsUpdate({ anthropic_thinking_budget: budget });
        onNumberChange('anthropic_thinking_budget', budget);
    };

    return (
        <>
            {/* Model Selection Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">Model Selection</h2>

                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">AI Provider</h3>
                            <p className="settings-card-description">
                                Choose which AI service powers your conversations.
                            </p>
                        </div>
                        <span className="settings-status settings-status-success">Active</span>
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Provider</label>
                        <GlassySelect
                            value={settings.provider}
                            onChange={onProviderChange}
                            options={providerOptions}
                            disabled={saving}
                        />
                    </div>

                    <div className="settings-input-group">
                        <label className="settings-label">Model</label>
                        <ModelSelector
                            value={settings.default_model}
                            onChange={onModelChange}
                            provider={settings.provider}
                            disabled={saving}
                        />
                    </div>
                </div>
            </div>

            {/* Advanced Settings Collapsible */}
            <div className="settings-section">
                <button
                    className="settings-advanced-toggle"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                    aria-expanded={advancedOpen}
                >
                    <ChevronIcon expanded={advancedOpen} />
                    <span>Advanced settings</span>
                </button>

                {advancedOpen && (
                    <div className="settings-advanced-content">
                        {/* Response Style */}
                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">Live responses</h3>
                                    <p className="settings-card-description">
                                        See responses as they're written instead of waiting for the full reply.
                                    </p>
                                </div>
                                <label className="settings-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_streaming}
                                        onChange={(e) => onToggleChange('enable_streaming', e.target.checked)}
                                        disabled={saving}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="settings-card">
                            <div className="settings-card-header">
                                <div className="settings-card-info">
                                    <h3 className="settings-card-title">Show reasoning</h3>
                                    <p className="settings-card-description">
                                        See Atlas's thought process before it responds. Not all models support this feature — when enabled, compatible models will display their reasoning.
                                    </p>
                                </div>
                                <label className="settings-toggle">
                                    <input
                                        type="checkbox"
                                        checked={settings.enable_extended_thinking}
                                        onChange={(e) => onToggleChange('enable_extended_thinking', e.target.checked)}
                                        disabled={saving}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        {/* Provider-specific settings */}
                        {settings.provider === 'openai' && (
                            <div className="settings-card">
                                <div className="settings-card-header">
                                    <div className="settings-card-info">
                                        <h3 className="settings-card-title">Thinking effort</h3>
                                        <p className="settings-card-description">
                                            How much time Atlas spends thinking before responding. Higher effort may give better answers but takes longer.
                                        </p>
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <div className="settings-button-group">
                                        <button
                                            className={`settings-button-option ${settings.openai_reasoning_effort === 'low' ? 'active' : ''}`}
                                            onClick={() => onSelectChange('openai_reasoning_effort', 'low')}
                                            disabled={saving}
                                        >
                                            Quick
                                        </button>
                                        <button
                                            className={`settings-button-option ${settings.openai_reasoning_effort === 'medium' ? 'active' : ''}`}
                                            onClick={() => onSelectChange('openai_reasoning_effort', 'medium')}
                                            disabled={saving}
                                        >
                                            Balanced
                                        </button>
                                        <button
                                            className={`settings-button-option ${settings.openai_reasoning_effort === 'high' ? 'active' : ''}`}
                                            onClick={() => onSelectChange('openai_reasoning_effort', 'high')}
                                            disabled={saving}
                                        >
                                            Thorough
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {settings.provider === 'anthropic' && (
                            <div className="settings-card">
                                <div className="settings-card-header">
                                    <div className="settings-card-info">
                                        <h3 className="settings-card-title">Thinking depth</h3>
                                        <p className="settings-card-description">
                                            How deeply Atlas reasons through complex problems. Deeper thinking may give better answers but takes longer and costs more.
                                        </p>
                                    </div>
                                </div>

                                <div className="settings-input-group">
                                    <div className="settings-button-group">
                                        <button
                                            className={`settings-button-option ${budgetToLevel(settings.anthropic_thinking_budget) === 'quick' ? 'active' : ''}`}
                                            onClick={() => handleThinkingDepthChange('quick')}
                                            disabled={saving}
                                        >
                                            Quick
                                        </button>
                                        <button
                                            className={`settings-button-option ${budgetToLevel(settings.anthropic_thinking_budget) === 'balanced' ? 'active' : ''}`}
                                            onClick={() => handleThinkingDepthChange('balanced')}
                                            disabled={saving}
                                        >
                                            Balanced
                                        </button>
                                        <button
                                            className={`settings-button-option ${budgetToLevel(settings.anthropic_thinking_budget) === 'thorough' ? 'active' : ''}`}
                                            onClick={() => handleThinkingDepthChange('thorough')}
                                            disabled={saving}
                                        >
                                            Thorough
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default ModelTab;
