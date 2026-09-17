import React from 'react';
import { CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';

/**
 * Renders real-time feedback above the Sudoku grid:
 * - Real-time valid moves
 * - Specific conflict warnings (row, col, box)
 * - Completion celebration banner
 */
export default function ValidationBanner({ validation, progressPercent = 0, filledCount = 0 }) {
  if (!validation) {
    return (
      <div className="status-banner banner-idle">
        <Info size={18} className="banner-icon" />
        <span className="banner-text">
          Fill in numbers 1–9. As you enter digits, each move is validated in real-time!
        </span>
      </div>
    );
  }

  const { isValid, isComplete, message } = validation;

  if (isComplete && isValid) {
    return (
      <div className="status-banner banner-success" role="status">
        <Sparkles size={18} className="banner-icon icon-sparkle" />
        <div className="banner-content-stacked">
          <strong>Congratulations! Puzzle Solved!</strong>
          <span className="banner-subtext">
            All 81 cells are correctly filled following every Sudoku rule.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`status-banner ${isValid ? 'banner-valid' : 'banner-invalid'}`}
      role="status"
    >
      {isValid ? (
        <CheckCircle2 size={18} className="banner-icon" />
      ) : (
        <AlertCircle size={18} className="banner-icon" />
      )}
      <div className="banner-text-row">
        <span className="banner-main-message">
          {message || (isValid ? 'Move is valid!' : 'Rule conflict detected.')}
        </span>
        {isValid && (
          <span className="banner-progress-pill">
            {filledCount}/81 cells ({progressPercent}%)
          </span>
        )}
      </div>
    </div>
  );
}
