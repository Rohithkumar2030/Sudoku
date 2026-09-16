import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

/**
 * Renders a clean status banner above the Sudoku grid.
 */
export default function ValidationBanner({ validation }) {
  if (!validation) {
    return (
      <div className="status-banner banner-idle">
        <Info size={18} className="banner-icon" />
        <span className="banner-text">
          Enter digits 1–9 into the grid and click <strong>Validate Board</strong> to check all Sudoku rules.
        </span>
      </div>
    );
  }

  const { isValid, message } = validation;

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
      <span className="banner-text">
        {message || (isValid ? 'Board is valid according to all Sudoku rules!' : 'Validation conflict detected.')}
      </span>
    </div>
  );
}
