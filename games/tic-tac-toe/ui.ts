import { createGame, makeMove, getBestMove, getRandomMove, GameState, WinResult } from './engine.js';

// 🏠 State Container (The only mutable part)
let appState: GameState = createGame();

// 🖥️ UI References Definitions
interface UIFields {
    status: HTMLElement;
    board: HTMLElement;
    scoreX: HTMLElement;
    scoreO: HTMLElement;
    scoreDraw: HTMLElement;
    difficulty: HTMLSelectElement;
    cells: HTMLElement[];
    resetBtn: HTMLButtonElement;
}

// 🖥️ UI References Implementation
// We use type assertion since we assume the HTML structure exists
const els: UIFields = {
    status: document.getElementById('status') as HTMLElement,
    board: document.getElementById('board') as HTMLElement,
    scoreX: document.getElementById('scoreX') as HTMLElement,
    scoreO: document.getElementById('scoreO') as HTMLElement,
    scoreDraw: document.getElementById('scoreDraw') as HTMLElement,
    difficulty: document.getElementById('difficulty') as HTMLSelectElement,
    cells: Array.from(document.querySelectorAll('.cell')) as HTMLElement[],
    resetBtn: document.querySelector('.btn-primary') as HTMLButtonElement
};

// 📊 Global Stats
const stats = { X: 0, O: 0, draw: 0 };

/**
 * 🎨 Renders the current state to the DOM
 */
function render(state: GameState) {
    // 1. Render Board
    state.board.forEach((cellValue, idx) => {
        const cell = els.cells[idx];
        cell.textContent = cellValue;

        // classes: cell taken X/O
        cell.className = 'cell';
        if (cellValue) cell.classList.add('taken', cellValue);

        // Highlight winning cells
        if (state.winResult && state.winResult.pattern.includes(idx)) {
            cell.classList.add('winning');
        }
    });

    // 2. Render Status
    if (state.isGameOver) {
        if (state.winResult?.winner === 'draw') {
            els.status.textContent = "It's a draw!";
        } else {
            els.status.textContent = state.winResult?.winner === 'X' ? 'You win!' : 'AI wins!';
        }

    } else {
        if (state.currentPlayer === 'X') {
            els.status.textContent = 'Your turn (X)';
        } else {
            els.status.textContent = 'AI is thinking...';
        }
    }
}

/**
 * 🎮 Game Loop & Event Handlers
 */
function handleMove(index: number) {
    if (appState.isGameOver || appState.board[index]) return;

    // 1. Human Move
    appState = makeMove(appState, index);
    render(appState);

    // Check for game over after human move
    if (appState.isGameOver) {
        updateStats(appState.winResult);
        return;
    }

    // 2. AI Turn
    setTimeout(() => {
        const difficulty = els.difficulty.value; // 'easy'|'medium'|'hard' by default but typed string from DOM
        // Force update difficulty in state if we want strict sync
        // appState.difficulty = difficulty as 'easy'|'medium'|'hard'; 

        let aiMoveIdx = -1;

        if (difficulty === 'easy') {
            aiMoveIdx = getRandomMove(appState);
        } else if (difficulty === 'medium') {
            aiMoveIdx = Math.random() < 0.5 ? getBestMove(appState) : getRandomMove(appState);
        } else {
            aiMoveIdx = getBestMove(appState);
        }

        if (aiMoveIdx !== -1) {
            appState = makeMove(appState, aiMoveIdx);
            render(appState);

            if (appState.isGameOver) {
                updateStats(appState.winResult);
            }
        }
    }, 500);
}

function updateStats(result: WinResult | null) {
    if (!result) return;
    if (result.winner === 'draw') {
        stats.draw++;
        els.scoreDraw.textContent = stats.draw.toString();
    } else if (result.winner === 'X') {
        stats.X++;
        els.scoreX.textContent = stats.X.toString();
    } else {
        stats.O++;
        els.scoreO.textContent = stats.O.toString();
    }
}

function resetGame() {
    appState = createGame();
    render(appState);
}

// 🔌 Wiring
els.board.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('.cell') as HTMLElement | null;
    if (cell && cell.dataset.index) {
        const idx = parseInt(cell.dataset.index);
        handleMove(idx);
    }
});

els.resetBtn.addEventListener('click', resetGame);
els.difficulty.addEventListener('change', resetGame);

// Initial Render
render(appState);
