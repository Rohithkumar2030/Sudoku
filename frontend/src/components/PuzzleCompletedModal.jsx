import React from 'react';
import { Trophy, Sparkles, Clock, Award, PlusCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

/**
 * Celebratory Completion Modal
 * Shown automatically when all 81 cells are correctly placed according to Sudoku rules.
 */
export default function PuzzleCompletedModal({
  isOpen,
  game,
  timeElapsed,
  movesCount,
  onStartNewGame,
  onClose,
}) {
  if (!isOpen) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const difficulty = game?.difficulty?.toLowerCase() || 'medium';

  // Dynamic, thoughtful praise based on difficulty
  const getPraiseMessage = () => {
    switch (difficulty) {
      case 'hard':
        return {
          title: 'Mastermind Achievement! 🏆',
          tagline: `Sensational logic! You conquered this ${game?.title || 'Hard'} puzzle in ${formatTime(
            timeElapsed
          )} with ${movesCount} deliberate moves. Your depth of deduction and constraint analysis is world-class.`,
          levelBadge: 'Hard Master',
        };
      case 'medium':
        return {
          title: 'Outstanding Deductive Mastery! 🌟',
          tagline: `Pure brilliance! You solved ${game?.title || 'Medium'} in ${formatTime(
            timeElapsed
          )} across ${movesCount} sharp moves. You navigated every row, column, and block with surgical precision.`,
          levelBadge: 'Medium Expert',
        };
      default:
        return {
          title: 'Flawless Victory! 🎉',
          tagline: `Magnificent run! You sailed through ${game?.title || 'Easy'} in ${formatTime(
            timeElapsed
          )} with ${movesCount} clean moves. Not a single rule escaped your sharp eyes!`,
          levelBadge: 'Easy Ace',
        };
    }
  };

  const praise = getPraiseMessage();

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-title"
    >
      <div className="modal-card completion-modal-card">
        {/* Animated Trophy Icon Area */}
        <div className="completion-hero-area">
          <div className="completion-trophy-glow">
            <Trophy size={48} className="trophy-icon" />
          </div>
          <div className="sparkles-container">
            <Sparkles size={22} className="sparkle-1" />
            <Sparkles size={18} className="sparkle-2" />
          </div>
        </div>

        <div className="completion-text-block">
          <span className="completion-kicker">PUZZLE ACED</span>
          <h2 id="completion-title" className="completion-main-title">
            {praise.title}
          </h2>
          <p className="completion-description">{praise.tagline}</p>
        </div>

        {/* Highlighted Game Performance Metrics */}
        <div className="completion-stats-grid">
          <div className="completion-stat-card">
            <Clock size={18} className="stat-icon stat-time-icon" />
            <div className="stat-info">
              <span className="stat-label">TIME</span>
              <span className="stat-val">{formatTime(timeElapsed)}</span>
            </div>
          </div>

          <div className="completion-stat-card">
            <Award size={18} className="stat-icon stat-moves-icon" />
            <div className="stat-info">
              <span className="stat-label">MOVES</span>
              <span className="stat-val">{movesCount}</span>
            </div>
          </div>

          <div className="completion-stat-card">
            <CheckCircle2 size={18} className="stat-icon stat-accuracy-icon" />
            <div className="stat-info">
              <span className="stat-label">ACCURACY</span>
              <span className="stat-val">100% Valid</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="modal-actions completion-actions-stacked">
          <button
            onClick={onStartNewGame}
            className="btn-modal btn-modal-primary btn-start-new-large"
            autoFocus
          >
            <PlusCircle size={18} />
            <span>Start Another Game</span>
            <ArrowRight size={16} className="arrow-push" />
          </button>

          <button onClick={onClose} className="btn-modal btn-modal-secondary">
            <span>Review Solved Board & History</span>
          </button>
        </div>
      </div>
    </div>
  );
}
