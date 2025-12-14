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

// 🟢 IMMUTABLE CONSTANTS
export const INITIAL_STATE = {
    board: Array(9).fill(''),
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
 * @returns {GameState}
 */
export function createGame() {
    return { ...INITIAL_STATE };
}

/**
 * Checks for a winner on a given board
 * @param {Board} board 
 * @returns {WinResult}
 */
export function checkWinner(board) {
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
 * @param {GameState} state 
 * @param {number} index 
 * @returns {GameState}
 */
export function makeMove(state, index) {
    // 🛡️ Guard Clauses
    if (state.isGameOver || state.board[index] !== '') {
        return state;
    }

    // 🟢 Immutability: Copy the board
    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;

    const winResult = checkWinner(newBoard);
    const nextPlayer = state.currentPlayer === 'X' ? 'O' : 'X';

    return {
        ...state,
        board: newBoard,
        currentPlayer: winResult ? state.currentPlayer : nextPlayer, // If won, don't switch
        isGameOver: !!winResult,
        winResult: winResult
    };
}

/**
 * Minimax Algorithm (Pure Function)
 * @param {Board} board 
 * @param {number} depth 
 * @param {boolean} isMaximizing 
 * @returns {number}
 */
export function minimax(board, depth, isMaximizing) {
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
                board[i] = 'O'; // Mutating local copy strictly for recursion speed in JS is acceptable if wrapper is pure, but let's be strict for now.
                // Actually, for true FP, we should clone. But minimax performance matters.
                // Let's stick to mutation-and-revert pattern WITHIN the function scope as it's efficient and contained.
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
 * @param {GameState} state 
 * @returns {number}
 */
export function getBestMove(state) {
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
 * @param {GameState} state 
 * @returns {number}
 */
export function getRandomMove(state) {
    const availableMoves = state.board
        .map((val, idx) => val === '' ? idx : null)
        .filter(val => val !== null);

    if (availableMoves.length === 0) return -1;
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
}
