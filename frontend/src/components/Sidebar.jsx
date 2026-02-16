import { useState, useEffect } from 'react';
import './Sidebar.css';

function parseDate(dateStr) {
  if (!dateStr) return new Date();

  // Handle naive UTC strings from legacy backend which are interpreted as local time by default
  // If string has no 'Z' and no timezone offset (e.g. +00:00), treat as UTC
  if (typeof dateStr === 'string' &&
    !dateStr.endsWith('Z') &&
    !dateStr.includes('+') &&
    /^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    return new Date(dateStr + 'Z');
  }

  return new Date(dateStr);
}

function getRelativeTime(dateStr) {
  const now = new Date();
  const date = parseDate(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function truncateText(text, maxLen = 40) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen).trim() + '…';
}

export default function Sidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  toggleSidebar,
}) {
  // Group conversations by time
  const groupedConversations = conversations.reduce((groups, conv) => {
    const timeLabel = getRelativeTime(conv.created_at);
    if (!groups[timeLabel]) {
      groups[timeLabel] = [];
    }
    groups[timeLabel].push(conv);
    return groups;
  }, {});

  // Predefined order for known labels
  const labelOrder = ['Just now', 'Today', 'Yesterday'];

  // Sort keys: known labels first, then others (e.g. 2d ago)
  const sortedLabels = Object.keys(groupedConversations).sort((a, b) => {
    const idxA = labelOrder.indexOf(a);
    const idxB = labelOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0; // Keep original order for others usually
  });

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div className="logo" style={{ marginBottom: 0 }}>
            <img src="/Logo.png" alt="PolyLLM Council" className="logo-image" />
            <span>PolyLLM Council</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
        </div>
        <button className="new-btn" onClick={onNewConversation}>
          <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          New Chat
        </button>
      </div>

      <div className="conversation-list">
        {conversations.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No history yet
          </div>
        ) : (
          sortedLabels.map(label => (
            <div key={label}>
              <div className="time-group-label">{label}</div>
              {groupedConversations[label].map(conv => (
                <div
                  key={conv.id}
                  className={`conversation-item ${conv.id === currentConversationId ? 'active' : ''}`}
                >
                  <div className="conversation-content" onClick={() => onSelectConversation(conv.id)}>
                    <div className="conversation-title">
                      {conv.title && conv.title !== 'New Conversation'
                        ? conv.title
                        : (conv.first_message ? truncateText(conv.first_message) : 'New Conversation')}
                    </div>
                    <div className="conversation-meta">
                      <span>{parseDate(conv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="conversation-menu">
                    <button
                      className="menu-btn"
                      aria-label="Conversation options"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    <div className="menu-dropdown">
                      <button
                        className="menu-item delete-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
