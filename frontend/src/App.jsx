import React, { useState, useEffect, useRef, useCallback } from 'react';
import SudokuGrid from './components/SudokuGrid.jsx';
import ValidationBanner from './components/ValidationBanner.jsx';
import HistoryList from './components/HistoryList.jsx';
import NumberPad from './components/NumberPad.jsx';
import ResumeGameModal from './components/ResumeGameModal.jsx';
import NewGameModal from './components/NewGameModal.jsx';
import PuzzleCompletedModal from './components/PuzzleCompletedModal.jsx';
import {
  Grid3X3,
  PlusCircle,
  RotateCcw,
  Clock,
  Sparkles,
  CheckCircle2,
  Check,
  Zap,
} from 'lucide-react';

const createEmptyGrid = () => Array.from({ length: 9 }, () => Array(9).fill(0));

/**
 * Fast client-side Sudoku validation for instantaneous feedback
 */
function validateGridLocally(grid) {
  const conflictCells = new Set();
  const errors = [];
  let emptyCount = 0;

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (!val || val === 0) {
        emptyCount++;
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
        errors.push(`Duplicate number ${val} in Row ${r + 1}`);
        cols.forEach((col) => conflictCells.add(`${r},${col}`));
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (!val || val === 0) continue;
      if (seen.has(val)) {
        seen.get(val).push(r);
      } else {
        seen.set(val, [r]);
      }
    }
    for (const [val, rows] of seen.entries()) {
      if (rows.length > 1) {
        errors.push(`Duplicate number ${val} in Column ${c + 1}`);
        rows.forEach((row) => conflictCells.add(`${row},${c}`));
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
          const val = grid[row][col];
          if (!val || val === 0) continue;
          if (seen.has(val)) {
            seen.get(val).push({ row, col });
          } else {
            seen.set(val, [{ row, col }]);
          }
        }
      }
      for (const [val, posList] of seen.entries()) {
        if (posList.length > 1) {
          const boxNum = br * 3 + bc + 1;
          errors.push(`Duplicate number ${val} in 3×3 Box ${boxNum}`);
          posList.forEach((p) => conflictCells.add(`${p.row},${p.col}`));
        }
      }
    }
  }

  const isValid = errors.length === 0;
  const isComplete = isValid && emptyCount === 0;
  const filledCount = 81 - emptyCount;

  let message = 'Board is valid so far.';
  if (!isValid) {
    message = errors[0] + (errors.length > 1 ? ` (+${errors.length - 1} more issue${errors.length > 2 ? 's' : ''})` : '');
  } else if (isComplete) {
    message = '🎉 Congratulations! You have successfully solved the puzzle!';
  } else {
    message = `Valid board so far (${filledCount}/81 cells placed)`;
  }

  return {
    isValid,
    isComplete,
    message,
    emptyCount,
    filledCount,
    conflictCells: Array.from(conflictCells).map((coord) => {
      const [row, col] = coord.split(',').map(Number);
      return { row, col };
    }),
  };
}

export default function App() {
  // Game session states
  const [currentGame, setCurrentGame] = useState(null);
  const [board, setBoard] = useState(createEmptyGrid);
  const [initialBoard, setInitialBoard] = useState(createEmptyGrid);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [undoStack, setUndoStack] = useState([]);
  const [conflictCells, setConflictCells] = useState([]);
  const [validation, setValidation] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Modals & UI states
  const [unfinishedGamePrompt, setUnfinishedGamePrompt] = useState(null);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRequestingHint, setIsRequestingHint] = useState(false);
  const [savedGames, setSavedGames] = useState([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [networkError, setNetworkError] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved'); // 'Saving...' | 'Saved'

  const saveTimeoutRef = useRef(null);

  // Timer interval: active while puzzle is in progress and no blocking modal
  useEffect(() => {
    if (!currentGame || currentGame.isCompleted || unfinishedGamePrompt || isCompletedModalOpen) return;

    const timer = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [currentGame, currentGame?.isCompleted, unfinishedGamePrompt, isCompletedModalOpen]);

  // Initial mount: Check for unfinished games and fetch history
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoadingGames(true);
      setNetworkError(null);

      // 1. Fetch saved games history
      const historyRes = await fetch('/api/games');
      let gamesList = [];
      if (historyRes.ok) {
        gamesList = await historyRes.json();
        setSavedGames(gamesList);
      }

      // 2. Check for unfinished game
      const unfinishedRes = await fetch('/api/games/unfinished');
      if (unfinishedRes.ok) {
        const data = await unfinishedRes.json();
        if (data.game) {
          // Show the prompt asking whether to resume or start new
          setUnfinishedGamePrompt(data.game);
          return;
        }
      }

      // If no unfinished game, automatically generate and load a fresh new puzzle!
      await createNewGame('medium');
    } catch (err) {
      console.error('Failed to initialize app:', err);
      setNetworkError('Unable to reach Sudoku backend. Make sure it is running on port 5001.');
    } finally {
      setIsLoadingGames(false);
    }
  };

  const refreshGamesHistory = async () => {
    try {
      const res = await fetch('/api/games');
      if (res.ok) {
        const data = await res.json();
        setSavedGames(data);
      }
    } catch (e) {
      console.error('Error refreshing games history:', e);
    }
  };

  // Load an existing game into the active board
  const loadGame = (gameData) => {
    if (!gameData) return;

    let parsedSolution = gameData.solution;
    if (typeof parsedSolution === 'string') {
      try {
        parsedSolution = JSON.parse(parsedSolution);
      } catch {
        parsedSolution = null;
      }
    }

    let curr = gameData.currentBoard;
    if (typeof curr === 'string') {
      try {
        curr = JSON.parse(curr);
      } catch {
        curr = createEmptyGrid();
      }
    }
    if (!Array.isArray(curr) || curr.length !== 9) {
      curr = createEmptyGrid();
    }

    let init = gameData.initialBoard;
    if (typeof init === 'string') {
      try {
        init = JSON.parse(init);
      } catch {
        init = createEmptyGrid();
      }
    }
    if (!Array.isArray(init) || init.length !== 9) {
      init = createEmptyGrid();
    }

    const cleanGameData = {
      ...gameData,
      currentBoard: curr,
      initialBoard: init,
      solution: parsedSolution,
    };
    setCurrentGame(cleanGameData);

    setBoard(curr.map((r) => [...r]));
    setInitialBoard(init.map((r) => [...r]));
    setTimeElapsed(gameData.timeElapsed || 0);
    setUndoStack([]);

    // Validate loaded board
    const valResult = validateGridLocally(curr);
    setValidation(valResult);
    setConflictCells(valResult.conflictCells);

    // Set first empty cell or 0,0
    let firstEmpty = null;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (curr[r][c] === 0 && !firstEmpty) {
          firstEmpty = { row: r, col: c };
        }
      }
    }
    setSelectedCell(firstEmpty || { row: 0, col: 0 });
    setUnfinishedGamePrompt(null);
  };

  // Load a game by ID from server
  const handleLoadGameById = async (gameId) => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (res.ok) {
        const game = await res.json();
        loadGame(game);
      }
    } catch (err) {
      console.error('Failed to load game:', err);
    }
  };

  // Start a new game with chosen difficulty
  const createNewGame = async (difficulty = 'medium') => {
    try {
      setIsGenerating(true);
      setNetworkError(null);

      const res = await fetch('/api/games/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty }),
      });

      if (!res.ok) throw new Error('Failed to create new game');

      const newGame = await res.json();
      loadGame(newGame);
      setIsNewGameModalOpen(false);
      await refreshGamesHistory();
    } catch (err) {
      console.error('Error creating new game:', err);
      setNetworkError('Failed to generate a new puzzle. Check the backend server.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-save game to backend
  const persistGameDebounced = useCallback(
    (updatedBoard, elapsed, moves) => {
      if (!currentGame?.id) return;

      setAutoSaveStatus('Saving...');
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/games/${currentGame.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentBoard: updatedBoard,
              timeElapsed: elapsed,
              movesCount: moves,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setAutoSaveStatus('Saved');
            if (data.game?.isCompleted && !currentGame.isCompleted) {
              setCurrentGame((prev) => ({ ...prev, isCompleted: true, status: 'completed' }));
            }
            refreshGamesHistory();
          }
        } catch (e) {
          console.error('Auto-save error:', e);
          setAutoSaveStatus('Offline');
        }
      }, 500);
    },
    [currentGame?.id, currentGame?.isCompleted]
  );

  // User modifies a cell value (typing or numpad)
  const handleCellChange = (rowIndex, colIndex, value) => {
    // If puzzle is already completed, ignore input
    if (currentGame?.isCompleted) return;

    // Cannot edit starting clue cells
    if (initialBoard[rowIndex]?.[colIndex] !== 0) return;

    // Save previous state for undo
    setUndoStack((prev) => [...prev, board.map((r) => [...r])]);

    // Create updated board
    const updatedBoard = board.map((r) => [...r]);
    updatedBoard[rowIndex][colIndex] = value;
    setBoard(updatedBoard);

    // Instant local validation and diagnostic message
    const valResult = validateGridLocally(updatedBoard);

    const nextMovesCount = (currentGame?.movesCount || 0) + 1;

    if (value > 0) {
      const hasConflict = valResult.conflictCells.some(
        (c) => c.row === rowIndex && c.col === colIndex
      );

      const solutionNum = currentGame?.solution?.[rowIndex]?.[colIndex];
      const matchesSolution = solutionNum ? value === solutionNum : !hasConflict;

      if (hasConflict) {
        // Rule violation in row, column, or 3x3 box
        setConflictCells(valResult.conflictCells);
        setValidation({
          isValid: false,
          isComplete: false,
          message: `⚠️ Conflict: Number ${value} already exists in this row, column, or 3×3 box!`,
        });
        // Stay on the current cell so the user can correct it
        setSelectedCell({ row: rowIndex, col: colIndex });
        setCurrentGame((prev) => (prev ? { ...prev, movesCount: nextMovesCount } : prev));
        persistGameDebounced(updatedBoard, timeElapsed, nextMovesCount);
      } else if (!matchesSolution) {
        // Value does not match puzzle solution
        const withMismatch = [...valResult.conflictCells, { row: rowIndex, col: colIndex }];
        setConflictCells(withMismatch);
        setValidation({
          isValid: false,
          isComplete: false,
          message: `⚠️ Incorrect: Number ${value} is not correct for this cell. Try another number!`,
        });
        // Stay on the current cell so the user can correct it
        setSelectedCell({ row: rowIndex, col: colIndex });
        setCurrentGame((prev) => (prev ? { ...prev, movesCount: nextMovesCount } : prev));
        persistGameDebounced(updatedBoard, timeElapsed, nextMovesCount);
      } else {
        // Move is completely CORRECT!
        setConflictCells(valResult.conflictCells);
        setValidation({
          isValid: true,
          isComplete: valResult.isComplete,
          message: valResult.isComplete
            ? '🎉 Congratulations! You have successfully solved the puzzle!'
            : `✓ Correct! Number ${value} placed at Row ${rowIndex + 1}, Column ${colIndex + 1}.`,
        });

        // Check if the entire board is now solved!
        if (valResult.isComplete) {
          // Freeze timer and mark completed immediately
          setCurrentGame((prev) =>
            prev ? { ...prev, movesCount: nextMovesCount, isCompleted: true, status: 'completed' } : prev
          );
          setIsCompletedModalOpen(true);

          // Flush save immediately to database
          if (currentGame?.id) {
            fetch(`/api/games/${currentGame.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                currentBoard: updatedBoard,
                timeElapsed,
                movesCount: nextMovesCount,
              }),
            })
              .then(() => refreshGamesHistory())
              .catch((e) => console.error('Save completion error:', e));
          }
        } else {
          // Normal valid move
          setCurrentGame((prev) => (prev ? { ...prev, movesCount: nextMovesCount } : prev));

          // ONLY advance to next empty cell if correct
          let nextCell = null;
          const currentIndex = rowIndex * 9 + colIndex;
          for (let offset = 1; offset < 81; offset++) {
            const checkIndex = (currentIndex + offset) % 81;
            const r = Math.floor(checkIndex / 9);
            const c = checkIndex % 9;
            if (updatedBoard[r][c] === 0 && initialBoard[r]?.[c] === 0) {
              nextCell = { row: r, col: c };
              break;
            }
          }

          if (nextCell) {
            setSelectedCell(nextCell);
          } else {
            setSelectedCell({ row: rowIndex, col: colIndex });
          }

          persistGameDebounced(updatedBoard, timeElapsed, nextMovesCount);
        }
      }
    } else {
      // Cell cleared
      setConflictCells(valResult.conflictCells);
      setValidation({
        isValid: valResult.isValid,
        isComplete: false,
        message: `Cell cleared at Row ${rowIndex + 1}, Column ${colIndex + 1}.`,
      });
      setSelectedCell({ row: rowIndex, col: colIndex });
      setCurrentGame((prev) => (prev ? { ...prev, movesCount: nextMovesCount } : prev));
      persistGameDebounced(updatedBoard, timeElapsed, nextMovesCount);
    }
  };

  // Undo last player move
  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const previousBoard = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, prev.length - 1));
    setBoard(previousBoard);

    const valResult = validateGridLocally(previousBoard);
    setValidation(valResult);
    setConflictCells(valResult.conflictCells);

    persistGameDebounced(previousBoard, timeElapsed, currentGame?.movesCount || 0);
  };

  // Erase active cell
  const handleErase = () => {
    if (!selectedCell) return;
    handleCellChange(selectedCell.row, selectedCell.col, 0);
  };

  // Number selection from NumberPad
  const handleNumberSelect = (num) => {
    if (!selectedCell) return;
    handleCellChange(selectedCell.row, selectedCell.col, num);
  };

  // Request a hint
  const handleRequestHint = async () => {
    if (!currentGame?.id || currentGame?.isCompleted) return;
    try {
      setIsRequestingHint(true);
      const res = await fetch(`/api/games/${currentGame.id}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRow: selectedCell?.row,
          targetCol: selectedCell?.col,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.hint) {
          const { row, col, value } = data.hint;
          setSelectedCell({ row, col });
          handleCellChange(row, col, value);
          setValidation({
            isValid: true,
            isComplete: false,
            message: `💡 Hint provided: Placed ${value} at Row ${row + 1}, Col ${col + 1}.`,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching hint:', err);
    } finally {
      setIsRequestingHint(false);
    }
  };

  // Restart / Reset current board back to initial starting clues
  const handleResetBoard = () => {
    if (!window.confirm('Reset this board back to its original starting clues?')) return;
    const reset = initialBoard.map((r) => [...r]);
    setBoard(reset);
    setUndoStack([]);
    setIsCompletedModalOpen(false);
    setCurrentGame((prev) => (prev ? { ...prev, isCompleted: false, status: 'in_progress' } : prev));

    const valResult = validateGridLocally(reset);
    setValidation(valResult);
    setConflictCells(valResult.conflictCells);
    persistGameDebounced(reset, timeElapsed, currentGame?.movesCount || 0);
  };

  // Delete a game from SQLite
  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Delete this saved puzzle from history?')) return;
    try {
      const res = await fetch(`/api/games/${gameId}`, { method: 'DELETE' });
      if (res.ok) {
        if (currentGame?.id === gameId) {
          // If deleted the active game, load another or start fresh
          const remaining = savedGames.filter((g) => g.id !== gameId);
          if (remaining.length > 0) {
            loadGame(remaining[0]);
          } else {
            createNewGame('medium');
          }
        }
        await refreshGamesHistory();
      }
    } catch (err) {
      console.error('Failed to delete game:', err);
    }
  };

  // Format time display: MM:SS
  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate filled count and percentage
  let filledCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r]?.[c] !== 0) filledCount++;
    }
  }
  const progressPercent = Math.round((filledCount / 81) * 100);

  return (
    <div className="app-layout">
      {/* App Launch Modal: Resume unfinished game or start new */}
      {unfinishedGamePrompt && (
        <ResumeGameModal
          unfinishedGame={unfinishedGamePrompt}
          onResume={(game) => loadGame(game)}
          onStartNew={() => {
            setUnfinishedGamePrompt(null);
            setIsNewGameModalOpen(true);
          }}
        />
      )}

      {/* New Game Dashboard: Choose difficulty and automatically load */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onStartNewGame={createNewGame}
        isGenerating={isGenerating}
      />

      {/* Puzzle Completed Celebration Modal */}
      <PuzzleCompletedModal
        isOpen={isCompletedModalOpen}
        game={currentGame}
        timeElapsed={timeElapsed}
        movesCount={currentGame?.movesCount || 0}
        onStartNewGame={() => {
          setIsCompletedModalOpen(false);
          setIsNewGameModalOpen(true);
        }}
        onClose={() => setIsCompletedModalOpen(false)}
      />

      {/* Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-inner">
          <div className="brand-title-area">
            <div className="brand-logo">
              <Grid3X3 size={20} />
            </div>
            <div>
              <div className="brand-title-row">
                <h1 className="brand-name">Sudoku Studio</h1>
                <span className="version-pill">v2.0</span>
              </div>
              <p className="brand-tagline">
                Play, solve & validate Sudoku puzzles with intelligent hints and auto-saved history
              </p>
            </div>
          </div>

          <div className="navbar-actions">
            {/* Auto-save status */}
            <div className="autosave-indicator" title="All moves are automatically saved to SQLite">
              <span className={`save-dot ${autoSaveStatus === 'Saved' ? 'dot-saved' : 'dot-saving'}`} />
              <span className="save-text">{autoSaveStatus}</span>
            </div>

            <button
              onClick={() => setIsNewGameModalOpen(true)}
              className="btn-action-navbar"
              title="Open dashboard to choose difficulty and start a new game"
            >
              <PlusCircle size={15} />
              <span>New Game</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Workspace Area */}
      <main className="main-content-container">
        {networkError && (
          <div className="connection-error-box" role="alert">
            {networkError}
          </div>
        )}

        <div className="workspace-columns">
          {/* Left Column: History & Saved Puzzles */}
          <aside className="column-sidebar">
            <HistoryList
              games={savedGames}
              currentGameId={currentGame?.id}
              onLoadGame={handleLoadGameById}
              onDeleteGame={handleDeleteGame}
              onNewGameClick={() => setIsNewGameModalOpen(true)}
              isLoading={isLoadingGames}
            />
          </aside>

          {/* Right Column: Active Sudoku Board & Controls */}
          <section className="column-workspace">
            <div className="panel-card board-panel">
              <div className="panel-header board-meta-header">
                <div className="game-info-group">
                  <div className="panel-title-group">
                    <Grid3X3 size={16} className="panel-icon" />
                    <h2 className="panel-title">{currentGame?.title || 'Sudoku Puzzle'}</h2>
                  </div>
                  {currentGame?.difficulty && (
                    <span className={`diff-badge diff-${currentGame.difficulty.toLowerCase()}`}>
                      {currentGame.difficulty.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="game-status-controls">
                  <div className="game-timer-badge">
                    <Clock size={14} />
                    <span>{formatTimer(timeElapsed)}</span>
                  </div>

                  {validation && (
                    <span
                      className={`status-badge ${
                        validation.isValid ? 'badge-valid' : 'badge-invalid'
                      }`}
                    >
                      {validation.isValid ? (
                        <>
                          <Check size={11} /> VALID
                        </>
                      ) : (
                        'CONFLICT'
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div className="board-panel-body">
                {/* Real-time Status Banner */}
                <ValidationBanner
                  validation={validation}
                  progressPercent={progressPercent}
                  filledCount={filledCount}
                />

                {/* 9x9 Sudoku Board */}
                <SudokuGrid
                  board={board}
                  initialBoard={initialBoard}
                  onCellChange={handleCellChange}
                  conflictCells={conflictCells}
                  selectedCell={selectedCell}
                  onSelectCell={(r, c) => setSelectedCell({ row: r, col: c })}
                />

                {/* Modern Number Pad & Quick Actions */}
                <NumberPad
                  board={board}
                  selectedCell={selectedCell}
                  onNumberSelect={handleNumberSelect}
                  onErase={handleErase}
                  onUndo={handleUndo}
                  onHint={handleRequestHint}
                  canUndo={undoStack.length > 0}
                  isRequestingHint={isRequestingHint}
                  isGameCompleted={currentGame?.isCompleted || false}
                />

                {/* Board Utility Buttons */}
                <div className="action-buttons-row">
                  <button
                    onClick={handleResetBoard}
                    className="btn-action btn-clear"
                    title="Reset entered numbers back to starting clues"
                  >
                    <RotateCcw size={15} />
                    <span>Reset Board</span>
                  </button>

                  <button
                    onClick={() => setIsNewGameModalOpen(true)}
                    disabled={isGenerating}
                    className="btn-action btn-validate"
                    title="Open dashboard to choose difficulty and start a new game"
                  >
                    <PlusCircle size={15} />
                    <span>New Puzzle</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          Full-Stack Sudoku Studio &bull; React + Vite &bull; Node.js + Express &bull; SQLite + Prisma ORM &bull; Auto-Save & History
        </p>
      </footer>
    </div>
  );
}
