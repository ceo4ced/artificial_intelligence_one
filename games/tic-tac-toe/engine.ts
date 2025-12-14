/**
 * @typedef {'X' | 'O' | ''} Player
 * @typedef {Player[]} Board
 * @typedef {{ winner: Player | 'draw', pattern: number[] } | null} WinResult
 * 
 * @typedef {Object} GameState
 * @property {Board} board - Array of 9 cells
 * @property {Player} currentPlayer - Current turn
 * @property {boolean} isGameOver - Is the game finished
 * @property {WinResult} winResult - Details of the win if any
 * @property {string} difficulty - AI Difficulty level
 */

export type Player = 'X' | 'O' | '';
export type Board = Player[];

export interface WinResult {
    winner: Player | 'draw';
    pattern: number[];
}

export interface GameState {
    board: Board;
    currentPlayer: Player;
    isGameOver: boolean;
    winResult: WinResult | null;
    difficulty: 'easy' | 'medium' | 'hard';
}

// 🟢 IMMUTABLE CONSTANTS
export const INITIAL_STATE: GameState = {
    board: Array(9).fill('') as Board,
    currentPlayer: 'X',
    isGameOver: false,
    winResult: null,
    difficulty: 'hard'
};

const WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]              // Diagonals
];

/**
 * Creates a new game state
 */
export function createGame(): GameState {
    return { ...INITIAL_STATE, board: [...INITIAL_STATE.board] };
}

/**
 * Checks for a winner on a given board
 */
export function checkWinner(board: Board): WinResult | null {
    for (const pattern of WIN_PATTERNS) {
        const [a, b, c] = pattern;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return { winner: board[a], pattern };
        }
    }

    if (!board.includes('')) {
        return { winner: 'draw', pattern: [] };
    }

    return null;
}

/**
 * Pure Reducer: Applies a move to the state and returns a NEW state
 */
export function makeMove(state: GameState, index: number): GameState {
    // 🛡️ Guard Clauses
    if (state.isGameOver || state.board[index] !== '') {
        return state;
    }

    // 🟢 Immutability: Copy the board
    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;

    const winResult = checkWinner(newBoard);
    const nextPlayer: Player = state.currentPlayer === 'X' ? 'O' : 'X';

    return {
        ...state,
        board: newBoard,
        currentPlayer: winResult ? state.currentPlayer : nextPlayer,
        isGameOver: !!winResult,
        winResult: winResult
    };
}

/**
 * Minimax Algorithm (Pure Function)
 */
export function minimax(board: Board, depth: number, isMaximizing: boolean): number {
    const result = checkWinner(board);
    if (result) {
        if (result.winner === 'O') return 10 - depth;
        if (result.winner === 'X') return depth - 10;
        return 0; // Draw
    }

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, depth + 1, false);
                board[i] = ''; // Backtrack
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = '';
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

/**
 * Get Best AI Move
 */
export function getBestMove(state: GameState): number {
    let bestScore = -Infinity;
    let bestMove = -1;
    // We work on a copy to ensure we don't accidentally mutate state passed in
    const board = [...state.board];

    for (let i = 0; i < 9; i++) {
        if (board[i] === '') {
            board[i] = 'O';
            const score = minimax(board, 0, false);
            board[i] = '';

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

/**
 * Get Random Move
 */
export function getRandomMove(state: GameState): number {
    const availableMoves = state.board
        .map((val, idx) => val === '' ? idx : null)
        .filter((val): val is number => val !== null);

    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}
