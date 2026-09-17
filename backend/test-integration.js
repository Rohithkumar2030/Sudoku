import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSudoku, validateFullBoard } from './src/sudokuEngine.js';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Testing SQLite Prisma Database Integration ---');

  // 1. Create a test game with easy difficulty
  const generated = generateSudoku('easy');
  const game = await prisma.game.create({
    data: {
      title: 'Test Integration Puzzle',
      difficulty: 'easy',
      initialBoard: JSON.stringify(generated.initialBoard),
      currentBoard: JSON.stringify(generated.initialBoard),
      solution: JSON.stringify(generated.solution),
      status: 'in_progress',
      timeElapsed: 25,
      movesCount: 2,
    },
  });

  console.log('✓ Created game ID:', game.id, 'Title:', game.title);

  // 2. Query unfinished games
  const unfinished = await prisma.game.findFirst({
    where: { status: 'in_progress' },
    orderBy: { updatedAt: 'desc' },
  });
  console.log('✓ Found unfinished game ID:', unfinished.id, 'Status:', unfinished.status);

  // 3. Update currentBoard move
  const updatedGrid = JSON.parse(unfinished.currentBoard);
  // Find an empty cell and put a number
  let testR = -1, testC = -1;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (updatedGrid[r][c] === 0) {
        testR = r;
        testC = c;
        break;
      }
    }
    if (testR !== -1) break;
  }
  const sol = JSON.parse(unfinished.solution);
  updatedGrid[testR][testC] = sol[testR][testC];

  const updatedGame = await prisma.game.update({
    where: { id: unfinished.id },
    data: {
      currentBoard: JSON.stringify(updatedGrid),
      timeElapsed: 30,
      movesCount: 3,
    },
  });
  console.log('✓ Updated game move successfully. Updated at:', updatedGame.updatedAt);

  // 4. Test fetch history list
  const allGames = await prisma.game.findMany({ orderBy: { updatedAt: 'desc' } });
  console.log(`✓ Fetched ${allGames.length} saved puzzles from SQLite.`);

  // 5. Clean up test game
  await prisma.game.delete({ where: { id: game.id } });
  console.log('✓ Cleaned up test game.');

  console.log('--- All integration tests passed! ---');
  await prisma.$disconnect();
}

runTests().catch(err => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
