/**
 * Validates a 9x9 Sudoku board.
 * A board is valid if:
 * 1. It is a 9x9 grid.
 * 2. Filled values are integers between 1 and 9 (empty cells: null, 0, or "").
 * 3. No duplicate values in any row.
 * 4. No duplicate values in any column.
 * 5. No duplicate values in any 3x3 subgrid.
 *
 * @param {Array<Array<number|string|null>>} board
 * @returns {{ isValid: boolean, message: string, conflictCells: Array<{row: number, col: number}> }}
 */
export function validateSudoku(board) {
  if (!Array.isArray(board) || board.length !== 9) {
    return {
      isValid: false,
      message: 'Board must be a 9x9 array.',
      conflictCells: [],
    };
  }

  const conflictCellsSet = new Set();
  const errors = [];

  // Parse and check board structure and values
  const normalizedBoard = [];

  for (let r = 0; r < 9; r++) {
    if (!Array.isArray(board[r]) || board[r].length !== 9) {
      return {
        isValid: false,
        message: `Row ${r + 1} must contain exactly 9 cells.`,
        conflictCells: [],
      };
    }

    const rowValues = [];
    for (let c = 0; c < 9; c++) {
      const cell = board[r][c];

      // Empty cells
      if (cell === null || cell === undefined || cell === '' || cell === 0 || cell === '0') {
        rowValues.push(0);
        continue;
      }

      const num = Number(cell);
      if (!Number.isInteger(num) || num < 1 || num > 9) {
        conflictCellsSet.add(`${r},${c}`);
        errors.push(`Invalid cell value '${cell}' at row ${r + 1}, column ${c + 1}. Values must be 1-9.`);
        rowValues.push(-1);
      } else {
        rowValues.push(num);
      }
    }
    normalizedBoard.push(rowValues);
  }

  // If there are invalid non-integer or out-of-range cell values, mark invalid
  if (errors.length > 0) {
    return {
      isValid: false,
      message: errors[0],
      conflictCells: Array.from(conflictCellsSet).map((key) => {
        const [row, col] = key.split(',').map(Number);
        return { row, col };
      }),
    };
  }

  // Check rows for duplicates
  for (let r = 0; r < 9; r++) {
    const seen = new Map(); // value -> [colIndex]
    for (let c = 0; c < 9; c++) {
      const val = normalizedBoard[r][c];
      if (val === 0) continue;

      if (seen.has(val)) {
        seen.get(val).push(c);
      } else {
        seen.set(val, [c]);
      }
    }

    for (const [val, cols] of seen.entries()) {
      if (cols.length > 1) {
        errors.push(`Duplicate number ${val} in row ${r + 1}.`);
        for (const col of cols) {
          conflictCellsSet.add(`${r},${col}`);
        }
      }
    }
  }

  // Check columns for duplicates
  for (let c = 0; c < 9; c++) {
    const seen = new Map(); // value -> [rowIndex]
    for (let r = 0; r < 9; r++) {
      const val = normalizedBoard[r][c];
      if (val === 0) continue;

      if (seen.has(val)) {
        seen.get(val).push(r);
      } else {
        seen.set(val, [r]);
      }
    }

    for (const [val, rows] of seen.entries()) {
      if (rows.length > 1) {
        errors.push(`Duplicate number ${val} in column ${c + 1}.`);
        for (const row of rows) {
          conflictCellsSet.add(`${row},${c}`);
        }
      }
    }
  }

  // Check 3x3 subgrids
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const seen = new Map(); // value -> [{r, c}]

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = boxRow * 3 + r;
          const col = boxCol * 3 + c;
          const val = normalizedBoard[row][col];
          if (val === 0) continue;

          if (seen.has(val)) {
            seen.get(val).push({ row, col });
          } else {
            seen.set(val, [{ row, col }]);
          }
        }
      }

      for (const [val, positions] of seen.entries()) {
        if (positions.length > 1) {
          errors.push(`Duplicate number ${val} in 3x3 box (${boxRow + 1}, ${boxCol + 1}).`);
          for (const pos of positions) {
            conflictCellsSet.add(`${pos.row},${pos.col}`);
          }
        }
      }
    }
  }

  const isValid = errors.length === 0;
  const message = isValid
    ? 'Board is valid according to Sudoku rules!'
    : errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more issue${errors.length > 2 ? 's' : ''})` : '');

  return {
    isValid,
    message,
    allErrors: errors,
    conflictCells: Array.from(conflictCellsSet).map((key) => {
      const [row, col] = key.split(',').map(Number);
      return { row, col };
    }),
  };
}
