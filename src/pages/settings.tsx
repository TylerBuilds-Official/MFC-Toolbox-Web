import React from 'react';
import '../styles/settings.css';

const Settings: React.FC = () => {
    return (
        <div className="settings-page">
            {/* Page Header */}
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Configure your MFC Toolbox experience and manage API connections.</p>
            </div>

            {/* Model Configuration Section */}
            <div className="settings-section">
                <h2 className="settings-section-title">Model Configuration</h2>
                
                <div className="settings-card">
                    <div className="settings-card-header">
                        <div className="settings-card-info">
                            <h3 className="settings-card-title">Primary Model</h3>
                            <p className="settings-card-description">Select the default AI model for conversations.</p>
                        </div>
                        <span className="settings-status settings-status-success">Active</span>
                    </div>
                    
                    <div className="settings-input-group">
                        <label className="settings-label">Model Provider</label>
                        <select className="settings-input settings-select">
                            <option value="anthropic">Anthropic (Claude)</option>
                            <option value="openai">OpenAI (GPT)</option>
                            <option value="local">Local Model</option>
                        </select>
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
                            <input type="checkbox" defaultChecked />
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
                            <input type="checkbox" defaultChecked />
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
                            <h3 className="settings-card-title">Clear All Data</h3>
                            <p className="settings-card-description">Remove all saved conversations and cached data.</p>
                        </div>
                        <button className="settings-btn settings-btn-danger">Clear Data</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
