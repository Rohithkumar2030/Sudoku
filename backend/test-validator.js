import { validateSudoku } from './src/validator.js';

let passed = 0;
let total = 0;

function assert(description, condition) {
  total++;
  if (condition) {
    passed++;
    console.log(`PASS: ${description}`);
  } else {
    console.error(`FAIL: ${description}`);
  }
}

// Test 1: Empty board (valid as partial board)
const emptyBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
assert('Empty board is valid', validateSudoku(emptyBoard).isValid === true);

// Test 2: Valid partial board
const validBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
validBoard[0][0] = 5;
validBoard[0][1] = 3;
validBoard[1][0] = 6;
assert('Valid partial board', validateSudoku(validBoard).isValid === true);

// Test 3: Row duplicate
const rowDuplicate = Array.from({ length: 9 }, () => Array(9).fill(0));
rowDuplicate[0][0] = 5;
rowDuplicate[0][8] = 5;
const r1 = validateSudoku(rowDuplicate);
assert('Row duplicate caught', r1.isValid === false && r1.conflictCells.length === 2);

// Test 4: Column duplicate
const colDuplicate = Array.from({ length: 9 }, () => Array(9).fill(0));
colDuplicate[0][3] = 7;
colDuplicate[7][3] = 7;
const r2 = validateSudoku(colDuplicate);
assert('Column duplicate caught', r2.isValid === false && r2.conflictCells.length === 2);

// Test 5: 3x3 Box duplicate
const boxDuplicate = Array.from({ length: 9 }, () => Array(9).fill(0));
boxDuplicate[0][0] = 9;
boxDuplicate[2][2] = 9;
const r3 = validateSudoku(boxDuplicate);
assert('3x3 Box duplicate caught', r3.isValid === false && r3.conflictCells.length === 2);

// Test 6: Invalid character or out of range (> 9)
const invalidChar = Array.from({ length: 9 }, () => Array(9).fill(0));
invalidChar[0][0] = 10;
assert('Value > 9 rejected', validateSudoku(invalidChar).isValid === false);

// Test 7: Full valid Sudoku
const fullValidBoard = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9]
];
assert('Full valid board accepted', validateSudoku(fullValidBoard).isValid === true);

// Edge Case 8: Non-array input
assert('Non-array payload rejected', validateSudoku(null).isValid === false);
assert('Empty array rejected', validateSudoku([]).isValid === false);

// Edge Case 9: Ragged row (missing cell)
const raggedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
raggedBoard[2] = [1, 2, 3]; // only 3 cells instead of 9
assert('Ragged row (< 9 cells) rejected', validateSudoku(raggedBoard).isValid === false);

// Edge Case 10: Non-integer / decimal values
const decimalBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
decimalBoard[0][0] = 3.5;
assert('Decimal values rejected', validateSudoku(decimalBoard).isValid === false);

// Edge Case 11: Negative values
const negativeBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
negativeBoard[0][0] = -1;
assert('Negative values rejected', validateSudoku(negativeBoard).isValid === false);

// Edge Case 12: Mixed string digits ('5') and empty representations (null, '', '0')
const mixedBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
mixedBoard[0][0] = '5';
mixedBoard[0][1] = null;
mixedBoard[0][2] = '';
mixedBoard[0][3] = '0';
assert('String digits and null/empty cells normalized properly', validateSudoku(mixedBoard).isValid === true);

console.log(`\nResults: ${passed}/${total} tests passed.`);
if (passed !== total) process.exit(1);
