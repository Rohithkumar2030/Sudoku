import React, { useState } from 'react';
import { History, Play, CheckCircle2, Trash2, Clock, PlusCircle } from 'lucide-react';

/**
 * Saved Puzzles and Games History Sidebar:
 * - Lists all past and in-progress Sudoku puzzles from SQLite
 * - Displays difficulty, progress bar, time elapsed, and status
 * - Quick "Resume / Load" button on every card
 * - Allows switching between puzzles easily
 */
export default function HistoryList({
  games = [],
  currentGameId = null,
  onLoadGame,
  onDeleteGame,
  onNewGameClick,
  isLoading = false,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'in_progress' | 'completed'

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoDateString) => {
    try {
      const date = new Date(isoDateString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getDifficultyClass = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return 'diff-easy';
      case 'hard':
        return 'diff-hard';
      default:
        return 'diff-medium';
    }
  };

  const filteredGames = games.filter((g) => {
    if (filter === 'in_progress') return g.status === 'in_progress';
    if (filter === 'completed') return g.status === 'completed';
    return true;
  });

  const inProgressCount = games.filter((g) => g.status === 'in_progress').length;
  const completedCount = games.filter((g) => g.status === 'completed').length;

  return (
    <div className="panel-card history-panel">
      <div className="panel-header">
        <div className="panel-title-group">
          <History size={16} className="panel-icon" />
          <h2 className="panel-title">Saved Puzzles</h2>
          <span className="count-pill">{games.length}</span>
        </div>

        <button
          onClick={onNewGameClick}
          className="btn-new-game-compact"
          title="Start a fresh puzzle"
        >
          <PlusCircle size={14} />
          <span>New Game</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="history-filter-tabs">
        <button
          onClick={() => setFilter('all')}
          className={`filter-tab-btn ${filter === 'all' ? 'active-filter' : ''}`}
        >
          All ({games.length})
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`filter-tab-btn ${filter === 'in_progress' ? 'active-filter' : ''}`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`filter-tab-btn ${filter === 'completed' ? 'active-filter' : ''}`}
        >
          Completed ({completedCount})
        </button>
      </div>

      <div className="history-scroll-area">
        {isLoading ? (
          <div className="history-placeholder">
            <Clock size={20} className="placeholder-icon" />
            <p>Loading saved puzzles...</p>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="history-placeholder">
            <History size={24} className="placeholder-icon" />
            <p className="placeholder-title">No puzzles found</p>
            <p className="placeholder-text">
              {filter === 'all'
                ? 'Start a new game and your progress will automatically save here!'
                : `No ${filter === 'in_progress' ? 'in-progress' : 'completed'} puzzles saved.`}
            </p>
          </div>
        ) : (
          <div className="history-list">
            {filteredGames.map((game) => {
              const isCurrent = game.id === currentGameId;
              const isCompleted = game.status === 'completed';

              return (
                <div
                  key={game.id}
                  className={`history-card-item ${isCurrent ? 'card-active-game' : ''} ${
                    isCompleted ? 'card-completed-game' : ''
                  }`}
                >
                  <div className="card-top-row">
                    <div className="card-title-area">
                      <span className="game-card-title">{game.title}</span>
                      {isCurrent && <span className="active-tag">CURRENT</span>}
                    </div>

                    <span className={`diff-badge ${getDifficultyClass(game.difficulty)}`}>
                      {game.difficulty?.toUpperCase()}
                    </span>
                  </div>

                  <div className="card-meta-line">
                    <span className="meta-time">
                      <Clock size={12} />
                      {formatTime(game.timeElapsed)}
                    </span>
                    <span className="meta-timestamp">{formatDate(game.updatedAt || game.createdAt)}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="card-progress-box">
                    <div className="card-progress-text">
                      <span>{isCompleted ? 'Completed' : 'Progress'}</span>
                      <span>
                        {game.filledCount || 0}/81 ({game.progressPercent || 0}%)
                      </span>
                    </div>
                    <div className="progress-track mini-track">
                      <div
                        className={`progress-fill ${isCompleted ? 'fill-completed' : ''}`}
                        style={{ width: `${game.progressPercent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="card-footer-actions">
                    <button
                      onClick={() => onLoadGame(game.id)}
                      className={`btn-restore-board ${isCurrent ? 'btn-current-loaded' : ''}`}
                      title="Load this puzzle onto the board"
                    >
                      {isCompleted ? <CheckCircle2 size={13} /> : <Play size={13} />}
                      <span>{isCurrent ? 'Playing Now' : isCompleted ? 'View Board' : 'Load Puzzle'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteGame(game.id);
                      }}
                      className="btn-delete-card"
                      title="Delete this puzzle"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
