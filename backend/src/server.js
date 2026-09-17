import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import {
  generateSudoku,
  validateFullBoard,
  cloneGrid,
  findCellConflicts,
  solveSudoku,
} from './sudokuEngine.js';
import { validateSudoku } from './validator.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// =========================================================================
// GAME / PUZZLE MANAGEMENT ENDPOINTS
// =========================================================================

// 1. Get the most recent unfinished game (for app load prompt)
app.get('/api/games/unfinished', async (req, res) => {
  try {
    const unfinishedGame = await prisma.game.findFirst({
      where: { status: 'in_progress' },
      orderBy: { updatedAt: 'desc' },
    });

    if (!unfinishedGame) {
      return res.json({ game: null });
    }

    const parsedInitial = JSON.parse(unfinishedGame.initialBoard);
    const parsedCurrent = JSON.parse(unfinishedGame.currentBoard);

    // Calculate filled cells
    let filledCount = 0;
    let totalCells = 81;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (parsedCurrent[r][c] !== 0) filledCount++;
      }
    }

    return res.json({
      game: {
        ...unfinishedGame,
        initialBoard: parsedInitial,
        currentBoard: parsedCurrent,
        solution: unfinishedGame.solution ? JSON.parse(unfinishedGame.solution) : null,
        filledCount,
        totalCells,
        progressPercent: Math.round((filledCount / totalCells) * 100),
      },
    });
  } catch (error) {
    console.error('Error fetching unfinished game:', error);
    return res.status(500).json({ error: 'Failed to check for unfinished games.' });
  }
});

// 2. Get all games / puzzle history
app.get('/api/games', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && (status === 'in_progress' || status === 'completed')) {
      where.status = status;
    }

    const games = await prisma.game.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const formatted = games.map((g) => {
      let current = [];
      let initial = [];
      try {
        current = JSON.parse(g.currentBoard);
        initial = JSON.parse(g.initialBoard);
      } catch {
        current = [];
        initial = [];
      }

      let filledCount = 0;
      if (Array.isArray(current)) {
        for (let r = 0; r < 9; r++) {
          for (let c = 0; c < 9; c++) {
            if (current[r]?.[c] !== 0) filledCount++;
          }
        }
      }

      return {
        id: g.id,
        title: g.title,
        difficulty: g.difficulty,
        initialBoard: initial,
        currentBoard: current,
        solution: g.solution ? JSON.parse(g.solution) : null,
        status: g.status,
        timeElapsed: g.timeElapsed,
        movesCount: g.movesCount,
        isValid: g.isValid,
        isCompleted: g.isCompleted,
        filledCount,
        totalCells: 81,
        progressPercent: Math.round((filledCount / 81) * 100),
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      };
    });

    return res.json(formatted);
  } catch (error) {
    console.error('Error fetching games history:', error);
    return res.status(500).json({ error: 'Failed to fetch games history.' });
  }
});

// 3. Create a new Sudoku game with starting numbers
app.post('/api/games/new', async (req, res) => {
  try {
    const { difficulty = 'medium', title } = req.body;
    const validDifficulty = ['easy', 'medium', 'hard'].includes(difficulty)
      ? difficulty
      : 'medium';

    // Generate puzzle using backtracking algorithm
    const generated = generateSudoku(validDifficulty);

    // Count existing games to provide friendly title
    const count = await prisma.game.count();
    const gameTitle =
      title ||
      `${validDifficulty.charAt(0).toUpperCase() + validDifficulty.slice(1)} Puzzle #${count + 1}`;

    const newGame = await prisma.game.create({
      data: {
        title: gameTitle,
        difficulty: validDifficulty,
        initialBoard: JSON.stringify(generated.initialBoard),
        currentBoard: JSON.stringify(generated.initialBoard), // initially same as starting
        solution: JSON.stringify(generated.solution),
        status: 'in_progress',
        timeElapsed: 0,
        movesCount: 0,
        isValid: true,
        isCompleted: false,
      },
    });

    let filledCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (generated.initialBoard[r][c] !== 0) filledCount++;
      }
    }

    return res.status(201).json({
      ...newGame,
      initialBoard: generated.initialBoard,
      currentBoard: cloneGrid(generated.initialBoard),
      solution: generated.solution,
      filledCount,
      totalCells: 81,
      progressPercent: Math.round((filledCount / 81) * 100),
      conflictCells: [],
      message: `New ${validDifficulty} game generated with ${filledCount} starting clues!`,
    });
  } catch (error) {
    console.error('Error creating new game:', error);
    return res.status(500).json({ error: 'Failed to generate new game.' });
  }
});

// 4. Update an existing game (autosave board moves, time, validation)
app.put('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentBoard, timeElapsed, movesCount } = req.body;

    if (!currentBoard) {
      return res.status(400).json({ error: 'currentBoard is required.' });
    }

    // Validate board
    const validation = validateFullBoard(currentBoard);
    const isCompleted = validation.isComplete;
    const status = isCompleted ? 'completed' : 'in_progress';

    const updateData = {
      currentBoard: JSON.stringify(currentBoard),
      isValid: validation.isValid,
      isCompleted,
      status,
    };

    if (typeof timeElapsed === 'number') {
      updateData.timeElapsed = timeElapsed;
    }
    if (typeof movesCount === 'number') {
      updateData.movesCount = movesCount;
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: updateData,
    });

    let filledCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (currentBoard[r][c] !== 0) filledCount++;
      }
    }

    return res.json({
      game: {
        ...updatedGame,
        initialBoard: JSON.parse(updatedGame.initialBoard),
        currentBoard: JSON.parse(updatedGame.currentBoard),
        solution: updatedGame.solution ? JSON.parse(updatedGame.solution) : null,
        filledCount,
        totalCells: 81,
        progressPercent: Math.round((filledCount / 81) * 100),
      },
      validation: {
        isValid: validation.isValid,
        isComplete: validation.isComplete,
        message: validation.message,
        conflictCells: validation.conflictCells,
      },
    });
  } catch (error) {
    console.error('Error updating game:', error);
    return res.status(500).json({ error: 'Failed to update game.' });
  }
});

// 5. Get a specific game by ID
app.get('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    const initial = JSON.parse(game.initialBoard);
    const current = JSON.parse(game.currentBoard);
    const validation = validateFullBoard(current);

    let filledCount = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (current[r][c] !== 0) filledCount++;
      }
    }

    return res.json({
      ...game,
      initialBoard: initial,
      currentBoard: current,
      solution: game.solution ? JSON.parse(game.solution) : null,
      filledCount,
      totalCells: 81,
      progressPercent: Math.round((filledCount / 81) * 100),
      validation: {
        isValid: validation.isValid,
        isComplete: validation.isComplete,
        message: validation.message,
        conflictCells: validation.conflictCells,
      },
    });
  } catch (error) {
    console.error('Error fetching game by ID:', error);
    return res.status(500).json({ error: 'Failed to retrieve game.' });
  }
});

// 6. Provide a Hint for the current game
app.post('/api/games/:id/hint', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetRow, targetCol } = req.body || {};

    const game = await prisma.game.findUnique({ where: { id } });
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    let solution = game.solution ? JSON.parse(game.solution) : null;
    const current = JSON.parse(game.currentBoard);

    if (!solution) {
      // Solve from initial board if solution missing
      const solvedGrid = cloneGrid(JSON.parse(game.initialBoard));
      solveSudoku(solvedGrid);
      solution = solvedGrid;
    }

    // Determine which cell to hint
    let hintRow = -1;
    let hintCol = -1;

    if (
      Number.isInteger(targetRow) &&
      targetRow >= 0 &&
      targetRow < 9 &&
      Number.isInteger(targetCol) &&
      targetCol >= 0 &&
      targetCol < 9 &&
      current[targetRow][targetCol] !== solution[targetRow][targetCol]
    ) {
      hintRow = targetRow;
      hintCol = targetCol;
    } else {
      // Find first incorrect or empty cell
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (current[r][c] !== solution[r][c]) {
            hintRow = r;
            hintCol = c;
            break;
          }
        }
        if (hintRow !== -1) break;
      }
    }

    if (hintRow === -1) {
      return res.json({
        message: 'All cells are already correctly filled!',
        hint: null,
      });
    }

    const hintValue = solution[hintRow][hintCol];

    return res.json({
      message: `Hint: Placed ${hintValue} at row ${hintRow + 1}, column ${hintCol + 1}`,
      hint: {
        row: hintRow,
        col: hintCol,
        value: hintValue,
      },
    });
  } catch (error) {
    console.error('Error generating hint:', error);
    return res.status(500).json({ error: 'Failed to generate hint.' });
  }
});

// 7. Delete game by ID
app.delete('/api/games/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.game.delete({ where: { id } });
    return res.json({ message: 'Game deleted successfully.' });
  } catch (error) {
    console.error('Error deleting game:', error);
    return res.status(500).json({ error: 'Failed to delete game.' });
  }
});

// =========================================================================
// LEGACY / DIRECT VALIDATION ENDPOINTS (Maintained for backwards compatibility)
// =========================================================================

// Validate Sudoku board and save history
app.post('/api/validate', async (req, res) => {
  try {
    const { board } = req.body;

    if (!board) {
      return res.status(400).json({
        error: 'Board is required in request body.',
      });
    }

    const validationResult = validateSudoku(board);

    // Save validation attempt to SQLite database via Prisma
    const record = await prisma.validationHistory.create({
      data: {
        board: JSON.stringify(board),
        isValid: validationResult.isValid,
        message: validationResult.message,
      },
    });

    return res.json({
      isValid: validationResult.isValid,
      message: validationResult.message,
      conflictCells: validationResult.conflictCells,
      record: {
        id: record.id,
        board: JSON.parse(record.board),
        isValid: record.isValid,
        message: record.message,
        createdAt: record.createdAt,
      },
    });
  } catch (error) {
    console.error('Error during validation:', error);
    return res.status(500).json({
      error: 'Internal server error validating board.',
      details: error.message,
    });
  }
});

// Get validation history
app.get('/api/history', async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Math.max(1, Math.min(Number.isInteger(requestedLimit) ? requestedLimit : 20, 100));

    const history = await prisma.validationHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const formattedHistory = history.map((item) => {
      let parsedBoard = [];
      try {
        parsedBoard = JSON.parse(item.board);
      } catch {
        parsedBoard = [];
      }
      return {
        id: item.id,
        isValid: item.isValid,
        message: item.message,
        board: parsedBoard,
        createdAt: item.createdAt,
      };
    });

    return res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({
      error: 'Failed to retrieve validation history.',
      details: error.message,
    });
  }
});

// Clear validation history
app.delete('/api/history', async (req, res) => {
  try {
    await prisma.validationHistory.deleteMany();
    return res.json({ message: 'History cleared successfully.' });
  } catch (error) {
    console.error('Error clearing history:', error);
    return res.status(500).json({
      error: 'Failed to clear history.',
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sudoku backend server running on http://localhost:${PORT}`);
});
