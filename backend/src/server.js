import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
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

// Clear validation history (utility endpoint)
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
