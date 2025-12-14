
import { describe, it, expect } from 'vitest';
import { createGame, makeMove, checkWin, isBoardFull, ROWS, COLS, GameState } from './engine.js';

describe('Connect Four Engine (Functional Core)', () => {
    it('should create initial game state', () => {
        const state = createGame(1);
        expect(state.board.length).toBe(ROWS);
        expect(state.board[0].length).toBe(COLS);
        expect(state.currentPlayer).toBe(1);
        expect(state.gameOver).toBe(false);
        expect(state.winner).toBeNull();
    });

    it('should update board and switch player on valid move', () => {
        const state = createGame(1);
        const nextState = makeMove(state, 0); // Drop in col 0

        expect(nextState).not.toBe(state); // Immutability
        expect(nextState.board[ROWS - 1][0]).toBe(1); // Bottom row, col 0
        expect(nextState.currentPlayer).toBe(2);
    });

    it('should stack pieces correctly (gravity)', () => {
        let state = createGame(1);
        state = makeMove(state, 0); // P1
        state = makeMove(state, 0); // P2

        expect(state.board[ROWS - 1][0]).toBe(1);
        expect(state.board[ROWS - 2][0]).toBe(2);
    });

    it('should not allow move in full column', () => {
        let state = createGame(1);
        // Fill col 0
        for (let i = 0; i < ROWS; i++) {
            state = makeMove(state, 0);
        }
        const fullColState = state;

        // Try one more
        const nextState = makeMove(fullColState, 0);
        expect(nextState).toBe(fullColState); // Should return same state reference
    });

    it('should detect horizontal win', () => {
        let state = createGame(1);
        // P1 plays 0,1,2,3. P2 plays 0,1,2 (dummy).
        // Sequence: P1(0), P2(0), P1(1), P2(1)... wait, that stacks.
        // We need P1 horizontal.
        // P1: (5,0), (5,1), (5,2), (5,3)
        // We need to manipulate moves carefully or just mock board for checkWin?
        // Let's use makeMove sequence.

        /*
          P1(0), P2(0) - Stacked
          P1(1), P2(1)
          ... this is tedious.
          Let's just test checkWin directly with a constructed board for specific scenarios,
          but makeMove is the main integration.
        */

        // P1(0), P2(0), P1(1), P2(1), P1(2), P2(2), P1(3)
        // P1 gets bottom row 0,1,2,3 NO.
        // P1 gets (5,0). P2 gets (4,0).
        // So P1 does 0, P2 does 0.
        // P1 does 1, P2 does 1.

        // Let's alternate columns.
        // P1: 0. P2: 0 (stacked). NO.

        // P1: 0. P2: 6.
        // P1: 1. P2: 6.
        // P1: 2. P2: 6.
        // P1: 3. WIN.

        state = makeMove(state, 0); // P1
        state = makeMove(state, 6); // P2
        state = makeMove(state, 1); // P1
        state = makeMove(state, 6); // P2
        state = makeMove(state, 2); // P1
        state = makeMove(state, 6); // P2

        const winningState = makeMove(state, 3); // P1

        expect(winningState.gameOver).toBe(true);
        expect(winningState.winner).toBe(1);
    });

    it('should detect diagonal win', () => {
        // Harder to script moves.
        // Let's test checkWin directly with a mock board if we exported it?
        // Implementation detail: checkWin is exported.
        const state = createGame(1);

        // Construct diagonal
        // 0,0 (R)
        // 1,1 (R)
        // 2,2 (R)
        // 3,3 (R)

        // We need to fill support structure for 1,1; 2,2; 3,3.
        // Or just mutually agree that `checkWin` operates on the array.
        const board = state.board.map(r => [...r]);
        board[0][0] = 1;
        board[1][1] = 1;
        board[2][2] = 1;
        board[3][3] = 1; // Win

        expect(checkWin(board, 1)).toBe(true);
    });
});
