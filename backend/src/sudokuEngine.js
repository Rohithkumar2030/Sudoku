/**
 * Sudoku Engine: Algorithms for Generation, Solving, and Real-time Validation.
 */

// Helper to create empty 9x9 board
export function createEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

// Deep clone 9x9 grid
export function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

/**
 * Check if putting `num` at (row, col) is valid on the given grid.
 * Ignores (row, col) itself so it works for checking existing values too.
 */
export function isSafe(grid, row, col, num) {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const curR = startRow + r;
      const curC = startCol + c;
      if ((curR !== row || curC !== col) && grid[curR][curC] === num) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Find all conflict cells for a specific cell (row, col) with value `num`.
 */
export function findCellConflicts(grid, row, col, num) {
  if (!num || num === 0) return [];
  const conflicts = [];

  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && grid[row][c] === num) {
      conflicts.push({ row, col: c, reason: `Row ${row + 1}` });
    }
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && grid[r][col] === num) {
      conflicts.push({ row: r, col, reason: `Column ${col + 1}` });
    }
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const curR = startRow + r;
      const curC = startCol + c;
      if ((curR !== row || curC !== col) && grid[curR][curC] === num) {
        const boxNum = Math.floor(row / 3) * 3 + Math.floor(col / 3) + 1;
        // avoid duplicate if already in row or col
        if (!conflicts.some((item) => item.row === curR && item.col === curC)) {
          conflicts.push({ row: curR, col: curC, reason: `3x3 Box ${boxNum}` });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Backtracking solver.
 * If randomize is true, shuffles numbers 1-9 to produce randomized valid solutions.
 */
export function solveSudoku(grid, randomize = false) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (grid[row][col] === 0) {
        let numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        if (randomize) {
          numbers.sort(() => Math.random() - 0.5);
        }

        for (const num of numbers) {
          if (isSafe(grid, row, col, num)) {
            grid[row][col] = num;
            if (solveSudoku(grid, randomize)) {
              return true;
            }
            grid[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

/**
 * Counts the number of solutions for a grid up to a maximum limit.
 * Used to ensure unique solution.
 */
export function countSolutions(grid, limit = 2) {
  let count = 0;

  function backtrack(board) {
    if (count >= limit) return;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isSafe(board, r, c, num)) {
              board[r][c] = num;
              backtrack(board);
              board[r][c] = 0;
              if (count >= limit) return;
            }
          }
          return;
        }
      }
    }
    count++;
  }

  const copy = cloneGrid(grid);
  backtrack(copy);
  return count;
}

/**
 * Fill a 3x3 block at (row, col) with random numbers 1-9.
 */
function fillBox(grid, row, col) {
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  let idx = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      grid[row + r][col + c] = nums[idx++];
    }
  }
}

/**
 * Generates a valid starting Sudoku board matching standard online/newspaper rules (NYT & Sudoku.com):
 * - Uses 180° rotational symmetry for balanced, elegant clue placement.
 * - Targets authentic clue counts:
 *   - easy: ~30-32 clues (about 3-4 per 3x3 box, 49-51 empty cells to solve)
 *   - medium: ~26-28 clues (about 2-3 per 3x3 box, 53-55 empty cells to solve)
 *   - hard: ~23-25 clues (about 2-3 per 3x3 box, 56-58 empty cells to solve)
 * - Guarantees a single unique valid solution.
 */
export function generateSudoku(difficulty = 'medium') {
  const targetClues = {
    easy: 32,
    medium: 27,
    hard: 24,
  }[difficulty] || 28;

  const fullGrid = createEmptyGrid();

  // 1. Fill diagonal 3x3 blocks (independent of each other)
  fillBox(fullGrid, 0, 0);
  fillBox(fullGrid, 3, 3);
  fillBox(fullGrid, 6, 6);

  // 2. Solve remaining grid to get complete valid solution
  solveSudoku(fullGrid, true);

  const solution = cloneGrid(fullGrid);
  const puzzle = cloneGrid(fullGrid);

  // 3. 180° Rotational Symmetric Pairs
  // Real Sudoku games pair cell (r, c) with (8-r, 8-c) to maintain symmetry and even distribution
  const symmetricPairs = [];
  const visited = new Set();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const symR = 8 - r;
      const symC = 8 - c;
      const k1 = `${r},${c}`;
      const k2 = `${symR},${symC}`;
      if (!visited.has(k1)) {
        visited.add(k1);
        visited.add(k2);
        symmetricPairs.push({ r1: r, c1: c, r2: symR, c2: symC });
      }
    }
  }

  // Shuffle pair order randomly
  symmetricPairs.sort(() => Math.random() - 0.5);

  let currentClues = 81;

  // Pass 1: Symmetric pair removal
  for (const { r1, c1, r2, c2 } of symmetricPairs) {
    if (currentClues <= targetClues) break;

    const b1 = puzzle[r1][c1];
    const b2 = puzzle[r2][c2];
    puzzle[r1][c1] = 0;
    puzzle[r2][c2] = 0;

    // Check uniqueness
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r1][c1] = b1;
      puzzle[r2][c2] = b2;
    } else {
      currentClues -= r1 === r2 && c1 === c2 ? 1 : 2;
    }
  }

  // Pass 2: Single-cell removal if still above target (especially for hard difficulty)
  if (currentClues > targetClues) {
    const remainingCells = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (puzzle[r][c] !== 0) {
          remainingCells.push({ r, c });
        }
      }
    }
    remainingCells.sort(() => Math.random() - 0.5);

    for (const { r, c } of remainingCells) {
      if (currentClues <= targetClues) break;
      const backup = puzzle[r][c];
      puzzle[r][c] = 0;
      if (countSolutions(puzzle, 2) !== 1) {
        puzzle[r][c] = backup;
      } else {
        currentClues--;
      }
    }
  }

  return {
    initialBoard: puzzle,
    solution: solution,
    difficulty,
  };
}

/**
 * Comprehensive board validation.
 */
export function validateFullBoard(board) {
  if (!Array.isArray(board) || board.length !== 9) {
    return {
      isValid: false,
      isComplete: false,
      message: 'Board must be a 9x9 grid.',
      conflictCells: [],
      emptyCount: 81,
    };
  }

  const conflictCellsSet = new Set();
  const errors = [];
  let emptyCount = 0;

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const val = Number(board[r][c]) || 0;
      if (val === 0) {
        emptyCount++;
        continue;
      }
      if (val < 1 || val > 9) {
        conflictCellsSet.add(`${r},${c}`);
        errors.push(`Invalid digit '${val}' at row ${r + 1}, col ${c + 1}`);
        continue;
      }

      if (seen.has(val)) {
        seen.get(val).push(c);
      } else {
        seen.set(val, [c]);
      }
    }

    for (const [val, cols] of seen.entries()) {
      if (cols.length > 1) {
        errors.push(`Duplicate ${val} in row ${r + 1}`);
        cols.forEach((col) => conflictCellsSet.add(`${r},${col}`));
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const val = Number(board[r][c]) || 0;
      if (val === 0) continue;

      if (seen.has(val)) {
        seen.get(val).push(r);
      } else {
        seen.set(val, [r]);
      }
    }

    for (const [val, rows] of seen.entries()) {
      if (rows.length > 1) {
        errors.push(`Duplicate ${val} in column ${c + 1}`);
        rows.forEach((row) => conflictCellsSet.add(`${row},${c}`));
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = br * 3 + r;
          const col = bc * 3 + c;
          const val = Number(board[row][col]) || 0;
          if (val === 0) continue;

          if (seen.has(val)) {
            seen.get(val).push({ row, col });
          } else {
            seen.set(val, [{ row, col }]);
          }
        }
      }

      for (const [val, posList] of seen.entries()) {
        if (posList.length > 1) {
          errors.push(`Duplicate ${val} in 3x3 box (${br + 1}, ${bc + 1})`);
          posList.forEach((p) => conflictCellsSet.add(`${p.row},${p.col}`));
        }
      }
    }
  }

  const isValid = errors.length === 0;
  const isComplete = isValid && emptyCount === 0;

  let message = 'Board is valid so far!';
  if (!isValid) {
    message = errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more issue${errors.length > 2 ? 's' : ''})` : '');
  } else if (isComplete) {
    message = '🎉 Congratulations! You have successfully solved the puzzle!';
  } else {
    message = `Board is valid so far! (${81 - emptyCount}/81 cells filled)`;
  }

  return {
    isValid,
    isComplete,
    message,
    errors,
    emptyCount,
    conflictCells: Array.from(conflictCellsSet).map((str) => {
      const [row, col] = str.split(',').map(Number);
      return { row, col };
    }),
  };
}
