import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useApi } from '../auth';
import { useNavbarContext } from '../hooks';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/loadingSpinner';
import { 
    createAdminApi,
    type DashboardStats,
    type AdminUser,
    type UserActivity,
    type AdminConversation,
    type AdminMemory,
    type ToolStatsResponse,
    type AuditEvent,
    type HealthStatus,
} from '../services';

// Icons
import { 
    UsersIcon, 
    ChartIcon, 
    ConversationIcon, 
    MemoryIcon, 
    ToolsIcon, 
    AuditIcon, 
    HealthIcon 
} from '../assets/svg/admin';

import '../styles/admin.css';

// ============================================
// Types
// ============================================

type AdminTab = 'dashboard' | 'users' | 'conversations' | 'memories' | 'tools' | 'audit' | 'health';

const TAB_LABELS: Record<AdminTab, string> = {
    dashboard: 'Dashboard',
    users: 'Users',
    conversations: 'Conversations',
    memories: 'Memories',
    tools: 'Tools',
    audit: 'Audit Log',
    health: 'Health',
};

// ============================================
// Admin Page Component
// ============================================

const AdminPage: React.FC = () => {
    const { user, isLoading: authLoading } = useAuth();
    const api = useApi();
    const adminApi = useMemo(() => createAdminApi(api), [api]);
    const { setPageContext, clearPageContext } = useNavbarContext();
    const { showToast } = useToast();

    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Data states
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
    const [conversations, setConversations] = useState<AdminConversation[]>([]);
    const [conversationsTotal, setConversationsTotal] = useState(0);
    const [memories, setMemories] = useState<AdminMemory[]>([]);
    const [memoriesTotal, setMemoriesTotal] = useState(0);
    const [toolStats, setToolStats] = useState<ToolStatsResponse | null>(null);
    const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
    const [auditTotal, setAuditTotal] = useState(0);
    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

    // Pagination state
    const [conversationsOffset, setConversationsOffset] = useState(0);
    const [memoriesOffset, setMemoriesOffset] = useState(0);
    const [auditOffset, setAuditOffset] = useState(0);
    const pageSize = 50;

    // Update navbar context when tab changes
    useEffect(() => {
        setPageContext('Admin', TAB_LABELS[activeTab]);
        return () => clearPageContext();
    }, [activeTab, setPageContext, clearPageContext]);

    // Load data when tab changes or user is authenticated
    useEffect(() => {
        if (user?.role === 'admin') {
            loadTabData(activeTab);
        }
    }, [user, activeTab]);

    // Load data for the current tab
    const loadTabData = async (tab: AdminTab) => {
        setLoading(true);
        setError(null);

        try {
            switch (tab) {
                case 'dashboard': {
                    const data = await adminApi.getStats();
                    setStats(data);
                    break;
                }

                case 'users': {
                    const data = await adminApi.getUsers();
                    setUsers(data.users);
                    break;
                }

                case 'conversations': {
                    const data = await adminApi.getConversations({ 
                        limit: pageSize, 
                        offset: conversationsOffset 
                    });
                    setConversations(data.conversations);
                    setConversationsTotal(data.total);
                    break;
                }

                case 'memories': {
                    const data = await adminApi.getMemories({ 
                        limit: pageSize, 
                        offset: memoriesOffset 
                    });
                    setMemories(data.memories);
                    setMemoriesTotal(data.total);
                    break;
                }

                case 'tools': {
                    const data = await adminApi.getToolStats();
                    setToolStats(data);
                    break;
                }

                case 'audit': {
                    const data = await adminApi.getAuditLog({ 
                        limit: pageSize, 
                        offset: auditOffset 
                    });
                    setAuditEvents(data.events);
                    setAuditTotal(data.total);
                    break;
                }

                case 'health': {
                    const data = await adminApi.getHealthStatus();
                    setHealthStatus(data);
                    break;
                }
            }
        } catch (err) {
            console.error(`[Admin] Failed to load ${tab} data:`, err);
            setError(err instanceof Error ? err.message : 'Failed to load data');
            showToast(`Failed to load ${TAB_LABELS[tab]} data`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // User management handlers
    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            await adminApi.setUserRole(userId, newRole);
            showToast('User role updated', 'success');
            // Refresh users list
            const data = await adminApi.getUsers();
            setUsers(data.users);
        } catch (err) {
            console.error('[Admin] Failed to change role:', err);
            showToast('Failed to change user role', 'error');
        }
    };

    const handleGrantSpecialty = async (userId: number, specialty: string) => {
        try {
            await adminApi.grantSpecialty(userId, specialty);
            showToast(`Granted ${specialty} specialty`, 'success');
            // Refresh users list
            const data = await adminApi.getUsers();
            setUsers(data.users);
        } catch (err) {
            console.error('[Admin] Failed to grant specialty:', err);
            showToast('Failed to grant specialty', 'error');
        }
    };

    const handleRevokeSpecialty = async (userId: number, specialty: string) => {
        try {
            await adminApi.revokeSpecialty(userId, specialty);
            showToast(`Revoked ${specialty} specialty`, 'success');
            // Refresh users list
            const data = await adminApi.getUsers();
            setUsers(data.users);
        } catch (err) {
            console.error('[Admin] Failed to revoke specialty:', err);
            showToast('Failed to revoke specialty', 'error');
        }
    };

    const handleViewUserActivity = async (userId: number) => {
        try {
            const data = await adminApi.getUserActivity(userId);
            setSelectedUser(data);
        } catch (err) {
            console.error('[Admin] Failed to load user activity:', err);
            showToast('Failed to load user activity', 'error');
        }
    };

    // Pagination handlers
    const handleConversationsPageChange = async (newOffset: number) => {
        setConversationsOffset(newOffset);
        setLoading(true);
        try {
            const data = await adminApi.getConversations({ limit: pageSize, offset: newOffset });
            setConversations(data.conversations);
            setConversationsTotal(data.total);
        } catch (err) {
            showToast('Failed to load conversations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleMemoriesPageChange = async (newOffset: number) => {
        setMemoriesOffset(newOffset);
        setLoading(true);
        try {
            const data = await adminApi.getMemories({ limit: pageSize, offset: newOffset });
            setMemories(data.memories);
            setMemoriesTotal(data.total);
        } catch (err) {
            showToast('Failed to load memories', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Auth check - redirect non-admins
    if (authLoading) {
        return (
            <div className="admin-page">
                <LoadingSpinner size="medium" message="Loading..." />
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            {/* Page Header */}
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Manage users, monitor system health, and review activity.</p>
            </div>

            {/* Main Layout: Sidebar + Content */}
            <div className="admin-layout">
                {/* Sidebar Navigation */}
                <nav className="admin-sidebar">
                    <div className="admin-sidebar-nav">
                        <button
                            className={`admin-nav-item ${activeTab === 'dashboard' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            <ChartIcon size={18} />
                            <span>Dashboard</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'users' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <UsersIcon size={18} />
                            <span>Users</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'conversations' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('conversations')}
                        >
                            <ConversationIcon size={18} />
                            <span>Conversations</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'memories' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('memories')}
                        >
                            <MemoryIcon size={18} />
                            <span>Memories</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'tools' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('tools')}
                        >
                            <ToolsIcon size={18} />
                            <span>Tools</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'audit' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('audit')}
                        >
                            <AuditIcon size={18} />
                            <span>Audit</span>
                        </button>
                        <button
                            className={`admin-nav-item ${activeTab === 'health' ? 'admin-nav-item-active' : ''}`}
                            onClick={() => setActiveTab('health')}
                        >
                            <HealthIcon size={18} />
                            <span>Health</span>
                        </button>
                    </div>
                </nav>

                {/* Main Content */}
                <main className="admin-content">
                {loading ? (
                    <div className="admin-loading">
                        <LoadingSpinner size="small" message={`Loading ${TAB_LABELS[activeTab]}...`} />
                    </div>
                ) : error ? (
                    <div className="admin-error">
                        <p>Error: {error}</p>
                        <button 
                            className="admin-btn admin-btn-secondary"
                            onClick={() => loadTabData(activeTab)}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <>
                        {activeTab === 'dashboard' && stats && (
                            <DashboardTab stats={stats} />
                        )}
                        {activeTab === 'users' && (
                            <UsersTab
                                users={users}
                                selectedUser={selectedUser}
                                onViewActivity={handleViewUserActivity}
                                onRoleChange={handleRoleChange}
                                onGrantSpecialty={handleGrantSpecialty}
                                onRevokeSpecialty={handleRevokeSpecialty}
                                onClearSelection={() => setSelectedUser(null)}
                            />
                        )}
                        {activeTab === 'conversations' && (
                            <ConversationsTab 
                                conversations={conversations} 
                                total={conversationsTotal}
                                offset={conversationsOffset}
                                pageSize={pageSize}
                                onPageChange={handleConversationsPageChange}
                            />
                        )}
                        {activeTab === 'memories' && (
                            <MemoriesTab 
                                memories={memories}
                                total={memoriesTotal}
                                offset={memoriesOffset}
                                pageSize={pageSize}
                                onPageChange={handleMemoriesPageChange}
                            />
                        )}
                        {activeTab === 'tools' && toolStats && (
                            <ToolsTab stats={toolStats} />
                        )}
                        {activeTab === 'audit' && (
                            <AuditTab 
                                events={auditEvents}
                                total={auditTotal}
                            />
                        )}
                        {activeTab === 'health' && healthStatus && (
                            <HealthTab status={healthStatus} />
                        )}
                    </>
                )}
                </main>
            </div>
        </div>
    );
};

// ============================================
// Tab Components
// ============================================

const DashboardTab: React.FC<{ stats: DashboardStats }> = ({ stats }) => (
    <div className="admin-dashboard">
        {/* Stats Grid */}
        <div className="admin-stats-grid">
            <div className="admin-stat-card">
                <div className="admin-stat-header">
                    <UsersIcon size={20} />
                    <span>Users</span>
                </div>
                <div className="admin-stat-value">{stats.users.total}</div>
                <div className="admin-stat-breakdown">
                    <span className="stat-badge stat-badge-admin">{stats.users.by_role.admin} admin</span>
                    <span className="stat-badge stat-badge-manager">{stats.users.by_role.manager} manager</span>
                    <span className="stat-badge stat-badge-user">{stats.users.by_role.user} user</span>
                    {stats.users.by_role.pending > 0 && (
                        <span className="stat-badge stat-badge-pending">{stats.users.by_role.pending} pending</span>
                    )}
                </div>
                <div className="admin-stat-footer">
                    <span>{stats.users.active_today} active today</span>
                    <span>{stats.users.active_this_week} this week</span>
                </div>
            </div>

            <div className="admin-stat-card">
                <div className="admin-stat-header">
                    <ConversationIcon size={20} />
                    <span>Conversations</span>
                </div>
                <div className="admin-stat-value">{stats.conversations.total}</div>
                <div className="admin-stat-footer">
                    <span>{stats.conversations.active} active</span>
                    <span>{stats.conversations.this_week} this week</span>
                </div>
            </div>

            <div className="admin-stat-card">
                <div className="admin-stat-header">
                    <span>💬</span>
                    <span>Messages</span>
                </div>
                <div className="admin-stat-value">{stats.messages.total.toLocaleString()}</div>
                <div className="admin-stat-footer">
                    <span>{stats.messages.this_week} this week</span>
                </div>
            </div>

            <div className="admin-stat-card">
                <div className="admin-stat-header">
                    <MemoryIcon size={20} />
                    <span>Memories</span>
                </div>
                <div className="admin-stat-value">{stats.memories.total}</div>
                <div className="admin-stat-breakdown">
                    {Object.entries(stats.memories.by_type).map(([type, count]) => (
                        <span key={type} className="stat-badge stat-badge-default">
                            {count} {type}
                        </span>
                    ))}
                </div>
            </div>

            <div className="admin-stat-card">
                <div className="admin-stat-header">
                    <ToolsIcon size={20} />
                    <span>Data Sessions</span>
                </div>
                <div className="admin-stat-value">{stats.data_sessions.total}</div>
                <div className="admin-stat-breakdown">
                    <span className="stat-badge stat-badge-success">{stats.data_sessions.by_status.success} success</span>
                    <span className="stat-badge stat-badge-error">{stats.data_sessions.by_status.error} error</span>
                    <span className="stat-badge stat-badge-pending">{stats.data_sessions.by_status.pending} pending</span>
                </div>
            </div>
        </div>

        <div className="admin-stat-timestamp">
            Last updated: {new Date(stats.generated_at).toLocaleString()}
        </div>
    </div>
);

const UsersTab: React.FC<{
    users: AdminUser[];
    selectedUser: UserActivity | null;
    onViewActivity: (userId: number) => void;
    onRoleChange: (userId: number, role: string) => void;
    onGrantSpecialty: (userId: number, specialty: string) => void;
    onRevokeSpecialty: (userId: number, specialty: string) => void;
    onClearSelection: () => void;
}> = ({ users, selectedUser, onViewActivity, onRoleChange, onRevokeSpecialty, onClearSelection }) => {
    if (selectedUser) {
        return (
            <div className="admin-user-activity">
                <button className="admin-back-btn" onClick={onClearSelection}>
                    ← Back to Users
                </button>
                <div className="admin-user-activity-header">
                    <h3>{selectedUser.display_name}</h3>
                    <span className={`role-badge role-badge-${selectedUser.role}`}>{selectedUser.role}</span>
                </div>
                <p className="admin-user-email-detail">{selectedUser.email}</p>
                <div className="admin-user-stats-grid">
                    <div className="admin-user-stat">
                        <span className="admin-user-stat-value">{selectedUser.conversation_count}</span>
                        <span className="admin-user-stat-label">Conversations</span>
                    </div>
                    <div className="admin-user-stat">
                        <span className="admin-user-stat-value">{selectedUser.message_count}</span>
                        <span className="admin-user-stat-label">Messages</span>
                    </div>
                    <div className="admin-user-stat">
                        <span className="admin-user-stat-value">{selectedUser.memory_count}</span>
                        <span className="admin-user-stat-label">Memories</span>
                    </div>
                    <div className="admin-user-stat">
                        <span className="admin-user-stat-value">{selectedUser.data_session_count}</span>
                        <span className="admin-user-stat-label">Data Sessions</span>
                    </div>
                </div>
                <div className="admin-user-meta">
                    <p>Member since: {new Date(selectedUser.created_at).toLocaleDateString()}</p>
                    {selectedUser.last_login_at && (
                        <p>Last login: {new Date(selectedUser.last_login_at).toLocaleString()}</p>
                    )}
                    {selectedUser.last_conversation_at && (
                        <p>Last conversation: {new Date(selectedUser.last_conversation_at).toLocaleString()}</p>
                    )}
                </div>
                {selectedUser.recent_conversations.length > 0 && (
                    <div className="admin-user-recent">
                        <h4>Recent Conversations</h4>
                        <div className="admin-user-conversations-list">
                            {selectedUser.recent_conversations.map(conv => (
                                <div key={conv.id} className="admin-user-conversation-item">
                                    <span className="conv-title">{conv.title || 'Untitled'}</span>
                                    <span className="conv-meta">{conv.message_count} messages</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="admin-users">
            <div className="admin-users-list">
                {users.map(u => (
                    <div key={u.id} className="admin-user-card">
                        <div className="admin-user-info">
                            <div className="admin-user-name">{u.display_name}</div>
                            <div className="admin-user-email">{u.email}</div>
                        </div>
                        <div className="admin-user-role">
                            <select
                                value={u.role}
                                onChange={(e) => onRoleChange(u.id, e.target.value)}
                                className="admin-role-select"
                            >
                                <option value="pending">Pending</option>
                                <option value="user">User</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="admin-user-specialties">
                            {u.specialty_roles.length > 0 ? (
                                u.specialty_roles.map(s => (
                                    <span 
                                        key={s} 
                                        className="specialty-badge"
                                        onClick={() => onRevokeSpecialty(u.id, s)}
                                        title="Click to revoke"
                                    >
                                        {s} ×
                                    </span>
                                ))
                            ) : (
                                <span className="no-specialties">No specialties</span>
                            )}
                        </div>
                        <div className="admin-user-actions">
                            <button
                                className="admin-btn admin-btn-secondary"
                                onClick={() => onViewActivity(u.id)}
                            >
                                View Activity
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConversationsTab: React.FC<{ 
    conversations: AdminConversation[];
    total: number;
    offset: number;
    pageSize: number;
    onPageChange: (newOffset: number) => void;
}> = ({ conversations, total, offset, pageSize, onPageChange }) => (
    <div className="admin-conversations">
        <div className="admin-table-header">
            <span>Showing {offset + 1}-{Math.min(offset + pageSize, total)} of {total} conversations</span>
        </div>
        <div className="admin-table-wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>User</th>
                        <th>Messages</th>
                        <th>Updated</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {conversations.map(conv => (
                        <tr key={conv.id}>
                            <td className="conv-title-cell">
                                <span className="conv-title">{conv.title || 'Untitled'}</span>
                                {conv.summary && <span className="conv-summary">{conv.summary}</span>}
                            </td>
                            <td>
                                <span className="user-name">{conv.user_name}</span>
                            </td>
                            <td>{conv.message_count}</td>
                            <td>{new Date(conv.updated_at).toLocaleDateString()}</td>
                            <td>
                                <span className={`status-badge ${conv.is_active ? 'status-active' : 'status-inactive'}`}>
                                    {conv.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {total > pageSize && (
            <div className="admin-pagination">
                <button 
                    className="admin-btn admin-btn-secondary"
                    disabled={offset === 0}
                    onClick={() => onPageChange(Math.max(0, offset - pageSize))}
                >
                    Previous
                </button>
                <button 
                    className="admin-btn admin-btn-secondary"
                    disabled={offset + pageSize >= total}
                    onClick={() => onPageChange(offset + pageSize)}
                >
                    Next
                </button>
            </div>
        )}
    </div>
);

const MemoriesTab: React.FC<{ 
    memories: AdminMemory[];
    total: number;
    offset: number;
    pageSize: number;
    onPageChange: (newOffset: number) => void;
}> = ({ memories, total, offset, pageSize, onPageChange }) => (
    <div className="admin-memories">
        <div className="admin-table-header">
            <span>Showing {offset + 1}-{Math.min(offset + pageSize, total)} of {total} memories</span>
        </div>
        <div className="admin-table-wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Content</th>
                        <th>User</th>
                        <th>Type</th>
                        <th>References</th>
                        <th>Last Referenced</th>
                    </tr>
                </thead>
                <tbody>
                    {memories.map(mem => (
                        <tr key={mem.id}>
                            <td className="memory-content-cell">
                                <span className="memory-content">{mem.content}</span>
                            </td>
                            <td>
                                <span className="user-name">{mem.user_name}</span>
                            </td>
                            <td>
                                <span className={`memory-type-badge memory-type-${mem.memory_type}`}>
                                    {mem.memory_type}
                                </span>
                            </td>
                            <td>{mem.reference_count}</td>
                            <td>
                                {mem.last_referenced_at
                                    ? new Date(mem.last_referenced_at).toLocaleDateString()
                                    : 'Never'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        {total > pageSize && (
            <div className="admin-pagination">
                <button 
                    className="admin-btn admin-btn-secondary"
                    disabled={offset === 0}
                    onClick={() => onPageChange(Math.max(0, offset - pageSize))}
                >
                    Previous
                </button>
                <button 
                    className="admin-btn admin-btn-secondary"
                    disabled={offset + pageSize >= total}
                    onClick={() => onPageChange(offset + pageSize)}
                >
                    Next
                </button>
            </div>
        )}
    </div>
);

const ToolsTab: React.FC<{ stats: ToolStatsResponse }> = ({ stats }) => (
    <div className="admin-tools">
        <div className="admin-table-wrapper">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Tool</th>
                        <th>Executions</th>
                        <th>Success Rate</th>
                        <th>Unique Users</th>
                        <th>Last Used</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.tools.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="admin-empty-cell">No tool usage data yet</td>
                        </tr>
                    ) : (
                        stats.tools.map(tool => (
                            <tr key={tool.name}>
                                <td className="tool-name-cell">
                                    <code>{tool.name}</code>
                                </td>
                                <td>{tool.total_executions}</td>
                                <td>
                                    <span className={`success-rate ${tool.success_rate >= 0.9 ? 'rate-good' : tool.success_rate >= 0.7 ? 'rate-ok' : 'rate-bad'}`}>
                                        {(tool.success_rate * 100).toFixed(1)}%
                                    </span>
                                </td>
                                <td>{tool.unique_users}</td>
                                <td>
                                    {tool.last_used
                                        ? new Date(tool.last_used).toLocaleString()
                                        : 'Never'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="admin-stat-timestamp">
            Generated: {new Date(stats.generated_at).toLocaleString()}
        </div>
    </div>
);

const AuditTab: React.FC<{ events: AuditEvent[]; total: number }> = ({ events, total }) => (
    <div className="admin-audit">
        {events.length === 0 ? (
            <div className="admin-empty">No audit events recorded yet.</div>
        ) : (
            <>
                <div className="admin-table-header">
                    <span>{total} audit event{total !== 1 ? 's' : ''}</span>
                </div>
                <div className="admin-audit-list">
                    {events.map(event => (
                        <div key={event.id} className="admin-audit-item">
                            <div className="audit-icon">
                                {event.action === 'role_change' ? '👤' : 
                                 event.action === 'specialty_grant' ? '🏆' : 
                                 event.action === 'specialty_revoke' ? '🚫' : '📝'}
                            </div>
                            <div className="audit-content">
                                <div className="audit-action">
                                    <strong>{event.actor_name}</strong>
                                    {' '}
                                    {event.action === 'role_change' && (
                                        <>changed role of <strong>{event.target_name}</strong> from {String(event.details.old_role)} to {String(event.details.new_role)}</>
                                    )}
                                    {event.action === 'specialty_grant' && (
                                        <>granted <code>{String(event.details.specialty)}</code> specialty to <strong>{event.target_name}</strong></>
                                    )}
                                    {event.action === 'specialty_revoke' && (
                                        <>revoked <code>{String(event.details.specialty)}</code> specialty from <strong>{event.target_name}</strong></>
                                    )}
                                    {!['role_change', 'specialty_grant', 'specialty_revoke'].includes(event.action) && (
                                        <>performed action: {event.action}</>
                                    )}
                                </div>
                                <div className="audit-timestamp">
                                    {new Date(event.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </>
        )}
    </div>
);

const HealthTab: React.FC<{ status: HealthStatus }> = ({ status }) => (
    <div className="admin-health">
        <div className="admin-health-header">
            <div className={`health-status health-status-${status.status}`}>
                {status.status === 'healthy' ? '✓' : '⚠'} System {status.status}
            </div>
            <div className="health-meta">
                <span>Version: {status.version}</span>
                <span>Uptime: {Math.floor(status.uptime_seconds / 3600)}h {Math.floor((status.uptime_seconds % 3600) / 60)}m</span>
            </div>
        </div>

        <div className="admin-health-checks">
            <div className={`health-check ${status.checks.database.connected ? 'health-check-ok' : 'health-check-error'}`}>
                <div className="health-check-header">
                    <span className="health-check-icon">{status.checks.database.connected ? '✓' : '✗'}</span>
                    <span className="health-check-name">Database</span>
                </div>
                <div className="health-check-details">
                    {status.checks.database.connected ? (
                        <span>Connected ({status.checks.database.latency_ms}ms latency)</span>
                    ) : (
                        <span className="error-text">{status.checks.database.error}</span>
                    )}
                </div>
            </div>

            <div className={`health-check ${status.checks.agents.error ? 'health-check-error' : 'health-check-ok'}`}>
                <div className="health-check-header">
                    <span className="health-check-icon">{status.checks.agents.error ? '✗' : '✓'}</span>
                    <span className="health-check-name">Connected Agents</span>
                </div>
                <div className="health-check-details">
                    {status.checks.agents.error ? (
                        <span className="error-text">{status.checks.agents.error}</span>
                    ) : (
                        <>
                            <span>{status.checks.agents.connected_count} agent(s) connected</span>
                            {status.checks.agents.agents.length > 0 && (
                                <div className="health-agents-list">
                                    {status.checks.agents.agents.map(agent => (
                                        <span key={agent.username} className="agent-badge">
                                            {agent.username}@{agent.hostname}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>

        <div className="admin-stat-timestamp">
            Last checked: {new Date(status.generated_at).toLocaleString()}
        </div>
    </div>
);

export default AdminPage;
