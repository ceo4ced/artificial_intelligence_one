
export type Player = 1 | 2; // 1 = Red, 2 = Yellow
export type Cell = Player | 0;
export type Board = Cell[][];

export interface GameState {
    board: Board;
    currentPlayer: Player;
    gameOver: boolean;
    winner: Player | null; // null if draw or game ongoing
    lastMove: { row: number, col: number } | null;
}

export const ROWS = 6;
export const COLS = 7;

/**
 * pure function to create a new game state
 */
export function createGame(startingPlayer: Player = 1): GameState {
    const board: Board = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    return {
        board,
        currentPlayer: startingPlayer,
        gameOver: false,
        winner: null,
        lastMove: null
    };
}

/**
 * Pure function to make a move. Returns NEW state.
 */
export function makeMove(state: GameState, col: number): GameState {
    if (state.gameOver) return state;

    // valid column check
    if (col < 0 || col >= COLS || state.board[0][col] !== 0) return state;

    // Find lowest empty row
    let row = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (state.board[r][col] === 0) {
            row = r;
            break;
        }
    }

    if (row === -1) return state; // Should be covered by valid col check but safety first

    // Create new board (Immutability)
    const newBoard = state.board.map(r => [...r]);
    newBoard[row][col] = state.currentPlayer;

    // Check Win/Draw
    const win = checkWin(newBoard, state.currentPlayer);
    const full = isBoardFull(newBoard);

    let winner = state.winner;
    let isGameOver: boolean = state.gameOver; // Rename to avoid confusion and type explicitly

    if (win) {
        winner = state.currentPlayer;
        isGameOver = true;
    } else if (full) {
        isGameOver = true; // Draw
    }

    return {
        board: newBoard,
        currentPlayer: state.currentPlayer === 1 ? 2 : 1,
        gameOver: isGameOver,
        winner,
        lastMove: { row, col }
    };
}

export function isBoardFull(board: Board): boolean {
    return board[0].every(cell => cell !== 0);
}

export function checkWin(board: Board, player: Player): boolean {
    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (board[r][c] === player && board[r][c + 1] === player &&
                board[r][c + 2] === player && board[r][c + 3] === player) return true;
        }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            if (board[r][c] === player && board[r + 1][c] === player &&
                board[r + 2][c] === player && board[r + 3][c] === player) return true;
        }
    }
    // Diagonal Down-Right
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (board[r][c] === player && board[r + 1][c + 1] === player &&
                board[r + 2][c + 2] === player && board[r + 3][c + 3] === player) return true;
        }
    }
    // Diagonal Down-Left
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 3; c < COLS; c++) {
            if (board[r][c] === player && board[r + 1][c - 1] === player &&
                board[r + 2][c - 2] === player && board[r + 3][c - 3] === player) return true;
        }
    }
    return false;
}


// --- AI (Minimax) ---

function evaluateWindow(window: number[], player: Player): number {
    let score = 0;
    const opponent = player === 1 ? 2 : 1;

    const playerCount = window.filter(x => x === player).length;
    const emptyCount = window.filter(x => x === 0).length;
    const oppCount = window.filter(x => x === opponent).length;

    if (playerCount === 4) score += 100;
    else if (playerCount === 3 && emptyCount === 1) score += 5;
    else if (playerCount === 2 && emptyCount === 2) score += 2;

    if (oppCount === 3 && emptyCount === 1) score -= 4;

    return score;
}

export function evaluateBoard(board: Board, player: Player): number {
    let score = 0;

    // Center preference
    const centerCol = Math.floor(COLS / 2);
    const centerCount = board.reduce((acc, row) => acc + (row[centerCol] === player ? 1 : 0), 0);
    score += centerCount * 3;

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            score += evaluateWindow([board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]], player);
        }
    }
    // Vertical
    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS - 3; r++) {
            score += evaluateWindow([board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]], player);
        }
    }
    // Diagonals
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            score += evaluateWindow([board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]], player);
        }
        for (let c = 3; c < COLS; c++) {
            score += evaluateWindow([board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]], player);
        }
    }
    return score;
}

export function getValidMoves(board: Board): number[] {
    const moves = [];
    for (let c = 0; c < COLS; c++) {
        if (board[0][c] === 0) moves.push(c);
    }
    return moves;
}

// Simplified Minimax compatible with functional state
// Note: To be pure, we pass board/player explicitly
function minimax(
    board: Board,
    depth: number,
    alpha: number,
    beta: number,
    maximizingPlayer: boolean,
    aiPlayer: Player
): number {
    const validMoves = getValidMoves(board);
    const opponent = aiPlayer === 1 ? 2 : 1;

    // Terminal checks (Win/Loss/Draw/Depth)
    // Note: checkWin needs to know WHO won to return score
    if (checkWin(board, aiPlayer)) return 100000;
    if (checkWin(board, opponent)) return -100000;
    if (validMoves.length === 0) return 0;
    if (depth === 0) return evaluateBoard(board, aiPlayer);

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (const col of validMoves) {
            // Find row
            let r = ROWS - 1;
            while (r >= 0 && board[r][col] !== 0) r--;

            // Simulate move (mutation for performance in recursion, cloning is too slow for minimax JS)
            // But we must undo it.
            board[r][col] = aiPlayer;
            const evalScore = minimax(board, depth - 1, alpha, beta, false, aiPlayer);
            board[r][col] = 0; // Undo

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const col of validMoves) {
            let r = ROWS - 1;
            while (r >= 0 && board[r][col] !== 0) r--;

            board[r][col] = opponent;
            const evalScore = minimax(board, depth - 1, alpha, beta, true, aiPlayer);
            board[r][col] = 0;

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

export function getBestMove(state: GameState, depth: number): number {
    // Clone board once for the simulation to avoid mutating actual game state
    // We use a clone for the root, but inside minimax we backtrack (mutate/unmutate) for perf.
    const boardClone = state.board.map(r => [...r]);
    const aiPlayer = state.currentPlayer;
    const validMoves = getValidMoves(boardClone);

    let bestScore = -Infinity;
    let bestMove = validMoves[0];

    for (const col of validMoves) {
        let r = ROWS - 1;
        while (r >= 0 && boardClone[r][col] !== 0) r--;

        boardClone[r][col] = aiPlayer;
        const score = minimax(boardClone, depth - 1, -Infinity, Infinity, false, aiPlayer);
        boardClone[r][col] = 0; // Backtrack

        if (score > bestScore) {
            bestScore = score;
            bestMove = col;
        }
    }
    return bestMove;
}
