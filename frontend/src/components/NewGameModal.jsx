import React, { useState } from 'react';
import { X, Sparkles, Zap, Flame, ShieldAlert } from 'lucide-react';

/**
 * Modal to choose difficulty and start a brand new generated puzzle.
 */
export default function NewGameModal({ isOpen, onClose, onStartNewGame, isGenerating = false }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');

  if (!isOpen) return null;

  const difficulties = [
    {
      id: 'easy',
      title: 'Easy',
      desc: '~30 starting clues. Ideal balance of given clues and open cells for casual play.',
      icon: Sparkles,
      color: 'easy-accent',
    },
    {
      id: 'medium',
      title: 'Medium',
      desc: '~27 starting clues. Standard puzzle layout with 180° rotational symmetry.',
      icon: Zap,
      color: 'medium-accent',
    },
    {
      id: 'hard',
      title: 'Hard',
      desc: '~24 starting clues. Minimal clues with symmetric layout for deeper deduction.',
      icon: Flame,
      color: 'hard-accent',
    },
  ];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Start a New Sudoku Game</h2>
            <p className="modal-subtitle">Select a difficulty level to generate a fresh puzzle.</p>
          </div>
          <button onClick={onClose} className="btn-modal-close" title="Close">
            <X size={18} />
          </button>
        </div>

        <div className="difficulty-options-list">
          {difficulties.map((diff) => {
            const Icon = diff.icon;
            const isSelected = selectedDifficulty === diff.id;
            return (
              <div
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`difficulty-card ${isSelected ? 'selected-diff-card' : ''}`}
              >
                <div className={`diff-icon-wrapper ${diff.color}`}>
                  <Icon size={20} />
                </div>
                <div className="diff-info">
                  <span className="diff-card-title">{diff.title}</span>
                  <span className="diff-card-desc">{diff.desc}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-actions">
          <button
            onClick={() => onStartNewGame(selectedDifficulty)}
            disabled={isGenerating}
            className="btn-modal btn-modal-primary"
          >
            {isGenerating ? 'Generating Puzzle...' : `Start ${selectedDifficulty.toUpperCase()} Game`}
          </button>
          <button onClick={onClose} className="btn-modal btn-modal-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
