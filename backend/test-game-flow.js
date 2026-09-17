import http from 'http';

// Quick test verifying sudokuEngine methods
import { generateSudoku, validateFullBoard } from './src/sudokuEngine.js';

console.log('Testing generateSudoku...');
const game = generateSudoku('easy');
console.log('Initial clues:', game.initialBoard.flat().filter(x => x !== 0).length);
console.log('Solution complete:', game.solution.flat().filter(x => x !== 0).length);

const validation = validateFullBoard(game.initialBoard);
console.log('Validation of initial board:', validation.isValid, 'Errors:', validation.errors);

const solvedValidation = validateFullBoard(game.solution);
console.log('Validation of solution:', solvedValidation.isValid, 'isComplete:', solvedValidation.isComplete);

if (validation.isValid && solvedValidation.isValid && solvedValidation.isComplete) {
  console.log('Engine tests passed successfully!');
} else {
  console.error('Engine test failed!');
  process.exit(1);
}
