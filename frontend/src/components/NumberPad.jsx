import React from 'react';
import { Eraser, Lightbulb, Undo2 } from 'lucide-react';

/**
 * Modern Sudoku number pad:
 * - 1 to 9 buttons with remaining number frequency badges
 * - Erase cell button
 * - Undo button
 * - Hint button
 */
export default function NumberPad({
  board,
  onNumberSelect,
  onErase,
  onUndo,
  onHint,
  canUndo = false,
  isRequestingHint = false,
  selectedCell = null,
  isGameCompleted = false,
}) {
  // Count how many times each digit 1-9 is currently placed on the board
  const digitCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  if (Array.isArray(board)) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = board[r]?.[c];
        if (val >= 1 && val <= 9) {
          digitCounts[val]++;
        }
      }
    }
  }

  return (
    <div className="number-pad-container">
      <div className="number-pad-digits">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const count = digitCounts[num] || 0;
          const remaining = 9 - count;
          const isComplete = remaining <= 0;

          return (
            <button
              key={num}
              disabled={isGameCompleted}
              onClick={() => onNumberSelect(num)}
              className={`numpad-digit-btn ${isComplete ? 'digit-completed' : ''}`}
              title={`Enter ${num} (${remaining > 0 ? `${remaining} remaining` : 'All 9 placed'})`}
            >
              <span className="numpad-digit-value">{num}</span>
              <span className="numpad-badge">
                {isComplete ? '✓' : remaining}
              </span>
            </button>
          );
        })}
      </div>

      <div className="numpad-utility-row">
        <button
          onClick={onErase}
          disabled={isGameCompleted}
          className="numpad-util-btn btn-erase"
          title="Erase selected cell (or press Backspace)"
        >
          <Eraser size={16} />
          <span>Erase</span>
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo || isGameCompleted}
          className="numpad-util-btn btn-undo"
          title="Undo last move"
        >
          <Undo2 size={16} />
          <span>Undo</span>
        </button>

        <button
          onClick={onHint}
          disabled={isRequestingHint || isGameCompleted}
          className="numpad-util-btn btn-hint"
          title="Get a hint for the current cell or next move"
        >
          <Lightbulb size={16} />
          <span>{isRequestingHint ? 'Finding...' : 'Hint'}</span>
        </button>
      </div>
    </div>
  );
}
