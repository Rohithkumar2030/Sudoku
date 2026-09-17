import React from 'react';
import { Play, PlusCircle, Clock, Grid3X3, Award } from 'lucide-react';

/**
 * Modal shown on app launch if the user has an unfinished puzzle in progress.
 */
export default function ResumeGameModal({
  unfinishedGame,
  onResume,
  onStartNew,
}) {
  if (!unfinishedGame) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="resume-title">
      <div className="modal-card">
        <div className="modal-header">
          <div className="modal-icon-badge">
            <Grid3X3 size={24} />
          </div>
          <div>
            <h2 id="resume-title" className="modal-title">
              Resume Unfinished Puzzle?
            </h2>
            <p className="modal-subtitle">
              You have a puzzle in progress from your previous session.
            </p>
          </div>
        </div>

        <div className="modal-puzzle-card">
          <div className="puzzle-meta-header">
            <span className="puzzle-title-text">{unfinishedGame.title}</span>
            <span className={`diff-badge ${getDifficultyClass(unfinishedGame.difficulty)}`}>
              {unfinishedGame.difficulty?.toUpperCase()}
            </span>
          </div>

          <div className="puzzle-progress-section">
            <div className="progress-info-row">
              <span className="progress-label">Progress</span>
              <span className="progress-fraction">
                {unfinishedGame.filledCount} / {unfinishedGame.totalCells || 81} cells (
                {unfinishedGame.progressPercent || 0}%)
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${unfinishedGame.progressPercent || 0}%` }}
              />
            </div>
          </div>

          <div className="puzzle-stats-row">
            <div className="stat-item">
              <Clock size={14} />
              <span>Time: {formatTime(unfinishedGame.timeElapsed || 0)}</span>
            </div>
            <div className="stat-item">
              <Award size={14} />
              <span>Moves: {unfinishedGame.movesCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button
            onClick={() => onResume(unfinishedGame)}
            className="btn-modal btn-modal-primary"
            autoFocus
          >
            <Play size={16} />
            <span>Resume Puzzle</span>
          </button>

          <button
            onClick={onStartNew}
            className="btn-modal btn-modal-secondary"
          >
            <PlusCircle size={16} />
            <span>Start a New Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
