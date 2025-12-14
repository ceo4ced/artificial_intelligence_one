import { createGame, makeMove, getBestMove, getRandomMove } from './engine.js';

// 🏠 State Container (The only mutable part)
let appState = createGame();

// 🖥️ UI References
const els = {
    status: document.getElementById('status'),
    board: document.getElementById('board'),
    scoreX: document.getElementById('scoreX'),
    scoreO: document.getElementById('scoreO'),
    scoreDraw: document.getElementById('scoreDraw'),
    difficulty: document.getElementById('difficulty'),
    cells: Array.from(document.querySelectorAll('.cell')),
    resetBtn: document.querySelector('.btn-primary') // Assuming "New Game" is the primary btn
};

// 📊 Global Stats (kept separate from game state for persistence across resets)
const stats = { X: 0, O: 0, draw: 0 };

/**
 * 🎨 Renders the current state to the DOM
 * This is the ONLY place where DOM updates happen based on Game State.
 */
function render(state) {
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
        if (state.winResult.winner === 'draw') {
            els.status.textContent = "It's a draw!";
        } else {
            els.status.textContent = state.winResult.winner === 'X' ? 'You win!' : 'AI wins!';
        }

        // Update stats if this is a fresh game over (simple check to avoid double counting)
        // In a real app we'd trigger a specific "GAME_OVER" effect
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
function handleMove(index) {
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
        const difficulty = els.difficulty.value;
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
    }, 500); // Artificial delay for UX
}

function updateStats(result) {
    if (!result) return;
    if (result.winner === 'draw') {
        stats.draw++;
        els.scoreDraw.textContent = stats.draw;
    } else if (result.winner === 'X') {
        stats.X++;
        els.scoreX.textContent = stats.X;
    } else {
        stats.O++;
        els.scoreO.textContent = stats.O;
    }
}

function resetGame() {
    appState = createGame();
    render(appState);
}

// 🔌 Wiring
els.board.addEventListener('click', (e) => {
    const cell = e.target.closest('.cell');
    if (cell) {
        const idx = parseInt(cell.dataset.index);
        handleMove(idx);
    }
});

els.resetBtn.addEventListener('click', resetGame);
els.difficulty.addEventListener('change', resetGame); // Reset when changing difficulty

// Initial Render
render(appState);
