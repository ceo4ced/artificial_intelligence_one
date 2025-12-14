import { describe, it, expect } from 'vitest';
import { createGame, makeMove, checkWinner, getBestMove, minimax } from './engine.js';

describe('Tic-Tac-Toe Engine (Functional Core)', () => {

    it('should initialize with empty state', () => {
        const state = createGame();
        expect(state.board).toEqual(['', '', '', '', '', '', '', '', '']);
        expect(state.currentPlayer).toBe('X');
        expect(state.isGameOver).toBe(false);
    });

    it('should immutably update state on move', () => {
        const initialState = createGame();
        const nextState = makeMove(initialState, 0);

        // Check Immutability
        expect(initialState.board[0]).toBe('');
        expect(nextState.board[0]).toBe('X');

        // Check Player Switch
        expect(nextState.currentPlayer).toBe('O');
    });

    it('should detect a row win', () => {
        // X X X
        // . . .
        // . . .
        const board = ['X', 'X', 'X', '', '', '', '', '', ''];
        const result = checkWinner(board);
        expect(result.winner).toBe('X');
    });

    it('should block moves on completed game', () => {
        let state = createGame();
        // Simulate X winning
        state = makeMove(state, 0); // X
        state = makeMove(state, 3); // O
        state = makeMove(state, 1); // X
        state = makeMove(state, 4); // O
        state = makeMove(state, 2); // X wins

        expect(state.isGameOver).toBe(true);
        expect(state.winResult.winner).toBe('X');

        // Try to move again
        const nextState = makeMove(state, 8);
        expect(nextState).toBe(state); // Same object reference returned
    });

    it('Minimax should block immediate threat', () => {
        // X X .
        // O . .
        // . . .
        // O should block at index 2
        const state = {
            board: ['X', 'X', '', 'O', '', '', '', '', ''],
            currentPlayer: 'O',
            isGameOver: false,
            winResult: null,
            difficulty: 'hard'
        };

        const bestMove = getBestMove(state);
        expect(bestMove).toBe(2);
    });
});
