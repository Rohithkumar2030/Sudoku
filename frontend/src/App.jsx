import React, { useState, useEffect } from 'react';
import SudokuGrid from './components/SudokuGrid.jsx';
import ValidationBanner from './components/ValidationBanner.jsx';
import HistoryList from './components/HistoryList.jsx';
import { Check, RotateCcw, Grid3X3 } from 'lucide-react';

const createEmptyBoard = () => Array.from({ length: 9 }, () => Array(9).fill(0));

export default function App() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [validation, setValidation] = useState(null);
  const [conflictCells, setConflictCells] = useState([]);
  const [history, setHistory] = useState([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  // Load history records from SQLite on initial mount
  useEffect(() => {
    fetchValidationHistory();
  }, []);

  const fetchValidationHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setNetworkError(null);

      const response = await fetch('/api/history');
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const records = await response.json();
      setHistory(records);
    } catch (error) {
      console.error('Failed to load history:', error);
      setNetworkError('Unable to connect to the backend server. Make sure it is running on port 5001.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleCellChange = (rowIndex, colIndex, value) => {
    setBoard((currentBoard) => {
      const updatedBoard = currentBoard.map((row) => [...row]);
      updatedBoard[rowIndex][colIndex] = value;
      return updatedBoard;
    });

    // Reset conflict highlights when the user modifies any cell
    if (conflictCells.length > 0) {
      setConflictCells([]);
    }
  };

  const handleValidateBoard = async () => {
    try {
      setIsValidating(true);
      setNetworkError(null);

      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board }),
      });

      if (!response.ok) {
        throw new Error(`Validation failed with status ${response.status}`);
      }

      const result = await response.json();

      setValidation({
        isValid: result.isValid,
        message: result.message,
      });
      setConflictCells(result.conflictCells || []);

      // If validation record was saved to SQLite, prepend it to history list
      if (result.record) {
        setHistory((prevHistory) => [result.record, ...prevHistory]);
      }
    } catch (error) {
      console.error('Validation request failed:', error);
      setNetworkError('Failed to validate board. Please verify the backend server.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearBoard = () => {
    setBoard(createEmptyBoard());
    setValidation(null);
    setConflictCells([]);
  };

  const handleLoadBoard = (selectedBoard) => {
    if (Array.isArray(selectedBoard) && selectedBoard.length === 9) {
      setBoard(selectedBoard.map((row) => [...row]));
      setValidation(null);
      setConflictCells([]);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm('Clear all saved validation history records?')) return;
    try {
      const response = await fetch('/api/history', { method: 'DELETE' });
      if (response.ok) {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  return (
    <div className="app-layout">
      {/* Full-Width Top Navigation Bar */}
      <nav className="top-navbar">
        <div className="navbar-inner">
          <div className="brand-title-area">
            <div className="brand-logo">
              <Grid3X3 size={20} />
            </div>
            <div>
              <h1 className="brand-name">Sudoku Validator</h1>
              <p className="brand-tagline">Validate 9×9 Sudoku boards against row, column, and 3×3 grid rules</p>
            </div>
          </div>
          <div className="navbar-actions">
            <span className="grid-dimension-pill">9×9</span>
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
          {/* Left Column: Validation History Sidebar */}
          <aside className="column-sidebar">
            <HistoryList
              history={history}
              onLoadBoard={handleLoadBoard}
              onClearHistory={handleClearHistory}
              isLoading={isLoadingHistory}
            />
          </aside>

          {/* Right Column: Sudoku Board Panel */}
          <section className="column-workspace">
            <div className="panel-card board-panel">
              <div className="panel-header">
                <div className="panel-title-group">
                  <Grid3X3 size={16} className="panel-icon" />
                  <h2 className="panel-title">Sudoku Board</h2>
                </div>
                {validation && (
                  <span className={`status-badge ${validation.isValid ? 'badge-valid' : 'badge-invalid'}`}>
                    {validation.isValid ? 'VALID' : 'INVALID'}
                  </span>
                )}
              </div>

              <div className="board-panel-body">
                {/* Status banner */}
                <ValidationBanner validation={validation} />

                {/* 9x9 Sudoku Board */}
                <SudokuGrid
                  board={board}
                  onCellChange={handleCellChange}
                  conflictCells={conflictCells}
                />

                {/* Primary Action Buttons */}
                <div className="action-buttons-row">
                  <button
                    onClick={handleValidateBoard}
                    disabled={isValidating}
                    className="btn-action btn-validate"
                  >
                    <Check size={16} />
                    <span>{isValidating ? 'Validating...' : 'Validate Board'}</span>
                  </button>

                  <button
                    onClick={handleClearBoard}
                    disabled={isValidating}
                    className="btn-action btn-clear"
                  >
                    <RotateCcw size={16} />
                    <span>Clear Board</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Deployable Footer */}
      <footer className="app-footer">
        <p>Full-Stack Sudoku Validator &bull; React + Vite &bull; Node.js + Express &bull; SQLite + Prisma ORM</p>
      </footer>
    </div>
  );
}
