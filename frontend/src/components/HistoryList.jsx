import React from 'react';
import { History, Check, X, RotateCcw, Trash2, Clock } from 'lucide-react';

/**
 * Renders the list of previous board validations saved in SQLite.
 */
export default function HistoryList({ history, onLoadBoard, onClearHistory, isLoading }) {
  const formatTime = (isoDateString) => {
    try {
      const date = new Date(isoDateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return isoDateString;
    }
  };

  const formatDate = (isoDateString) => {
    try {
      const date = new Date(isoDateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="panel-card history-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <History size={16} className="panel-icon" />
          <h2 className="panel-title">Validation History</h2>
          <span className="count-pill">{history.length}</span>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="btn-clear-ghost"
            title="Clear all stored validation history"
          >
            <Trash2 size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>

      <div className="history-scroll-area">
        {isLoading ? (
          <div className="history-placeholder">
            <Clock size={20} className="placeholder-icon" />
            <p>Loading validation records...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="history-placeholder">
            <Clock size={24} className="placeholder-icon" />
            <p className="placeholder-title">No validations yet</p>
            <p className="placeholder-text">
              Validate a board to see past check results stored in SQLite.
            </p>
          </div>
        ) : (
          <div className="history-list">
            {history.map((record) => (
              <div
                key={record.id}
                className={`history-card-item ${record.isValid ? 'card-valid' : 'card-invalid'}`}
              >
                <div className="card-top-row">
                  <span className={`status-badge ${record.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                    {record.isValid ? <Check size={11} /> : <X size={11} />}
                    {record.isValid ? 'VALID' : 'INVALID'}
                  </span>
                  <span className="timestamp-text">
                    {formatDate(record.createdAt)} &bull; {formatTime(record.createdAt)}
                  </span>
                </div>

                <p className="card-message-text" title={record.message}>
                  {record.message || (record.isValid ? 'All rules satisfied' : 'Rule conflicts found')}
                </p>

                {record.board && record.board.length === 9 && (
                  <button
                    onClick={() => onLoadBoard(record.board)}
                    className="btn-restore-board"
                    title="Load this board configuration onto the grid"
                  >
                    <RotateCcw size={12} />
                    <span>Load Board</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
