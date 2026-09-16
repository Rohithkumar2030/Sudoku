import React, { useRef } from 'react';

/**
 * 9x9 Sudoku Grid Component
 * Features clean 3x3 box dividers, subtle inner cell lines,
 * keyboard navigation, and conflict highlighting.
 */
export default function SudokuGrid({ board, onCellChange, conflictCells = [] }) {
  const cellInputRefs = useRef([]);

  // Fast coordinate lookup for conflicts: "row,col"
  const conflictCoordinates = new Set(
    conflictCells.map((cell) => `${cell.row},${cell.col}`)
  );

  const handleKeyDown = (rowIndex, colIndex, event) => {
    // Clear cell on Backspace, Delete, or 0
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault();
      onCellChange(rowIndex, colIndex, 0);
      return;
    }

    // Arrow keys navigation
    let nextRow = rowIndex;
    let nextCol = colIndex;

    if (event.key === 'ArrowUp') nextRow = Math.max(0, rowIndex - 1);
    else if (event.key === 'ArrowDown') nextRow = Math.min(8, rowIndex + 1);
    else if (event.key === 'ArrowLeft') nextCol = Math.max(0, colIndex - 1);
    else if (event.key === 'ArrowRight') nextCol = Math.min(8, colIndex + 1);
    else return;

    event.preventDefault();
    const nextIndex = nextRow * 9 + nextCol;
    cellInputRefs.current[nextIndex]?.focus();
  };

  const handleInputChange = (rowIndex, colIndex, event) => {
    const inputValue = event.target.value;

    if (!inputValue) {
      onCellChange(rowIndex, colIndex, 0);
      return;
    }

    const lastCharacter = inputValue.slice(-1);

    // If user enters 0, clear the cell
    if (lastCharacter === '0') {
      onCellChange(rowIndex, colIndex, 0);
      return;
    }

    // Accept single digit between 1 and 9
    if (/^[1-9]$/.test(lastCharacter)) {
      onCellChange(rowIndex, colIndex, Number(lastCharacter));

      // Auto-advance cursor to next cell
      const nextIndex = rowIndex * 9 + colIndex + 1;
      if (nextIndex < 81) {
        cellInputRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div className="sudoku-grid-wrapper">
      <div className="sudoku-grid" role="grid" aria-label="9x9 Sudoku Board">
        {board.map((row, rowIndex) =>
          row.map((cellValue, colIndex) => {
            const cellFlatIndex = rowIndex * 9 + colIndex;
            const isConflict = conflictCoordinates.has(`${rowIndex},${colIndex}`);

            // Right border logic: 3x3 divider vs inner cell line vs outer edge
            let rightBorderClass = 'cell-border-right';
            if (colIndex === 2 || colIndex === 5) {
              rightBorderClass = 'subgrid-border-right';
            } else if (colIndex === 8) {
              rightBorderClass = 'no-border-right';
            }

            // Bottom border logic: 3x3 divider vs inner cell line vs outer edge
            let bottomBorderClass = 'cell-border-bottom';
            if (rowIndex === 2 || rowIndex === 5) {
              bottomBorderClass = 'subgrid-border-bottom';
            } else if (rowIndex === 8) {
              bottomBorderClass = 'no-border-bottom';
            }

            return (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                className={`cell-box ${rightBorderClass} ${bottomBorderClass} ${
                  isConflict ? 'cell-conflict' : ''
                }`}
              >
                <input
                  ref={(element) => (cellInputRefs.current[cellFlatIndex] = element)}
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9]*"
                  maxLength={1}
                  value={cellValue === 0 ? '' : cellValue}
                  onChange={(event) => handleInputChange(rowIndex, colIndex, event)}
                  onKeyDown={(event) => handleKeyDown(rowIndex, colIndex, event)}
                  className={`cell-input ${isConflict ? 'input-has-conflict' : ''} ${
                    cellValue !== 0 ? 'input-has-value' : ''
                  }`}
                  aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
