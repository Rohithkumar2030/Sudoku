import React, { useRef, useEffect } from 'react';

/**
 * 9x9 Sudoku Grid Component
 * Features:
 * - Clear distinction between starting clues and player entries
 * - 3x3 box borders and inner cell dividers
 * - Active cell selection and keyboard navigation
 * - Peer crosshair highlighting (row, column, 3x3 box)
 * - Same-number highlighting across the entire grid
 * - Instant conflict highlighting
 */
export default function SudokuGrid({
  board,
  initialBoard = [],
  onCellChange,
  conflictCells = [],
  selectedCell = null,
  onSelectCell,
}) {
  const cellInputRefs = useRef([]);

  // Fast coordinate lookup for conflicts: "row,col"
  const conflictCoordinates = new Set(
    conflictCells.map((cell) => `${cell.row},${cell.col}`)
  );

  // Determine value of currently selected cell for same-number highlighting
  const selectedValue =
    selectedCell &&
    board[selectedCell.row] &&
    board[selectedCell.row][selectedCell.col] > 0
      ? board[selectedCell.row][selectedCell.col]
      : null;

  // Ensure focus syncs when selectedCell changes programmatically
  useEffect(() => {
    if (selectedCell) {
      const idx = selectedCell.row * 9 + selectedCell.col;
      cellInputRefs.current[idx]?.focus();
    }
  }, [selectedCell]);

  const handleCellClick = (rowIndex, colIndex) => {
    if (onSelectCell) {
      onSelectCell(rowIndex, colIndex);
    }
  };

  const handleKeyDown = (rowIndex, colIndex, event) => {
    const isGiven = initialBoard[rowIndex]?.[colIndex] !== 0;

    // Clear cell on Backspace, Delete, or 0 (only if not a starting clue)
    if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0') {
      event.preventDefault();
      if (!isGiven) {
        onCellChange(rowIndex, colIndex, 0);
      }
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
    if (onSelectCell) {
      onSelectCell(nextRow, nextCol);
    }
    const nextIndex = nextRow * 9 + nextCol;
    cellInputRefs.current[nextIndex]?.focus();
  };

  const handleInputChange = (rowIndex, colIndex, event) => {
    const isGiven = initialBoard[rowIndex]?.[colIndex] !== 0;
    if (isGiven) {
      // Starting clues cannot be overwritten
      return;
    }

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
    }
  };

  return (
    <div className="sudoku-grid-wrapper">
      <div className="sudoku-grid" role="grid" aria-label="9x9 Sudoku Board">
        {board.map((row, rowIndex) =>
          row.map((cellValue, colIndex) => {
            const cellFlatIndex = rowIndex * 9 + colIndex;
            const isGiven = initialBoard[rowIndex]?.[colIndex] !== 0;
            const isConflict = conflictCoordinates.has(`${rowIndex},${colIndex}`);
            const isSelected =
              selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

            // Peer crosshair highlight (same row, col, or 3x3 box)
            const isPeer =
              selectedCell &&
              !isSelected &&
              (selectedCell.row === rowIndex ||
                selectedCell.col === colIndex ||
                (Math.floor(selectedCell.row / 3) === Math.floor(rowIndex / 3) &&
                  Math.floor(selectedCell.col / 3) === Math.floor(colIndex / 3)));

            // Same number highlight
            const isSameNumber =
              selectedValue !== null &&
              cellValue === selectedValue &&
              !isSelected;

            // Border styling
            let rightBorderClass = 'cell-border-right';
            if (colIndex === 2 || colIndex === 5) {
              rightBorderClass = 'subgrid-border-right';
            } else if (colIndex === 8) {
              rightBorderClass = 'no-border-right';
            }

            let bottomBorderClass = 'cell-border-bottom';
            if (rowIndex === 2 || rowIndex === 5) {
              bottomBorderClass = 'subgrid-border-bottom';
            } else if (rowIndex === 8) {
              bottomBorderClass = 'no-border-bottom';
            }

            return (
              <div
                key={`cell-${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`cell-box ${rightBorderClass} ${bottomBorderClass} ${
                  isGiven ? 'cell-given' : 'cell-user'
                } ${isSelected ? 'cell-selected' : ''} ${
                  isPeer ? 'cell-peer' : ''
                } ${isSameNumber ? 'cell-same-num' : ''} ${
                  isConflict ? 'cell-conflict' : ''
                }`}
              >
                <input
                  ref={(element) => (cellInputRefs.current[cellFlatIndex] = element)}
                  type="text"
                  inputMode="numeric"
                  pattern="[1-9]*"
                  maxLength={1}
                  readOnly={isGiven}
                  value={cellValue === 0 ? '' : cellValue}
                  onFocus={() => handleCellClick(rowIndex, colIndex)}
                  onChange={(event) => handleInputChange(rowIndex, colIndex, event)}
                  onKeyDown={(event) => handleKeyDown(rowIndex, colIndex, event)}
                  className={`cell-input ${isGiven ? 'input-given' : 'input-user'} ${
                    isConflict ? 'input-has-conflict' : ''
                  } ${cellValue !== 0 ? 'input-has-value' : ''}`}
                  aria-label={`Row ${rowIndex + 1}, Column ${colIndex + 1}${
                    isGiven ? ' (Given clue)' : ''
                  }`}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
