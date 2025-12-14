
```
import {
    createGame, makeMove, getBestMove,
    GameState, Player, ROWS, COLS
} from './engine.js';

// 🏠 State
let game: GameState = createGame(1);
let humanPlayer: Player = 1;
let aiDepth = 4;
let isAiThinking = false; // UI lock

// 🖥️ UI References
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const CELL_SIZE = 80;
const RADIUS = 30;

// 🎨 Rendering
function drawBoard(state: GameState) {
    // Bg
    ctx.fillStyle = '#2c5aa0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const x = c * CELL_SIZE + CELL_SIZE / 2;
            const y = r * CELL_SIZE + CELL_SIZE / 2;

            // Draw Hole
            ctx.beginPath();
            ctx.arc(x, y, RADIUS, 0, Math.PI * 2);

            const cell = state.board[r][c];
            if (cell === 0) {
                ctx.fillStyle = '#ffffff';
            } else if (cell === 1) {
                ctx.fillStyle = '#f44336';
            } else {
                ctx.fillStyle = '#ffd54f';
            }
            ctx.fill();
            ctx.strokeStyle = '#1a3a6e';
            ctx.lineWidth = 3;
            ctx.stroke();
        }
    }
}

// 🕹️ Actions
function handleColumnClick(col: number) {
    if (game.gameOver || game.currentPlayer !== humanPlayer || isAiThinking) return;

    const newState = makeMove(game, col);
    if (newState === game) return; // Invalid move

    game = newState;
    drawBoard(game);
    updateStatus();

    if (!game.gameOver && game.currentPlayer !== humanPlayer) {
        triggerAiMove();
    }
}

function triggerAiMove() {
    isAiThinking = true;
    updateStatus('🤔 AI is thinking...');
    document.getElementById('thinkingIndicator')!.style.display = 'block';

    // setTimeout to let UI render before heavy calc
    setTimeout(() => {
        const bestMove = getBestMove(game, aiDepth);
        game = makeMove(game, bestMove);
        isAiThinking = false;
        document.getElementById('thinkingIndicator')!.style.display = 'none';

        drawBoard(game);
        updateStatus();
    }, 100);
}

function updateStatus(msg?: string) {
    const el = document.getElementById('statusDisplay')!;
    if (msg) {
        el.textContent = msg;
        return;
    }

    if (game.gameOver) {
        if (game.winner === humanPlayer) el.textContent = '🎉 You Win!';
        else if (game.winner) el.textContent = '🟡 AI Wins!';
        else el.textContent = "🤝 It's a Draw!";
    } else {
        if (game.currentPlayer === humanPlayer) el.textContent = '🔴 Your Turn';
        else el.textContent = '⏳ AI Turn';
    }

    // Stats update? (Simplified from original for pilot speed)
    // Original had 'moveCount' etc. We can re-enable later if needed.
}

function newGame(startingStats?: { player: Player }) {
    if (startingStats) humanPlayer = startingStats.player;
    game = createGame(humanPlayer === 1 ? 1 : 1); // Logic: Red passes first? No, Red always moves first?
    // Usually Red goes first. If I am Red, I go. If I am Yellow, opponent (Red-AI) goes.
    // Let's assume Player 1 is ALWAYS Red and ALWAYS goes first.
    // If Human chooses Yellow (2), then AI is Red (1) and goes first.
    game = createGame(1);

    console.log('Human:', humanPlayer, 'Current:', game.currentPlayer);

    drawBoard(game);
    updateStatus();

    if (game.currentPlayer !== humanPlayer) {
        triggerAiMove();
    }
}

// 🔌 Bindings
canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const col = Math.floor(x / CELL_SIZE);
    if (col >= 0 && col < COLS) {
        handleColumnClick(col);
    }
});

(window as any).newGame = () => newGame();
(window as any).setPlayer = (p: Player) => {
    humanPlayer = p;
    newGame();
};
(window as any).updateDifficulty = () => {
    const el = document.getElementById('difficulty') as HTMLInputElement;
    aiDepth = parseInt(el.value);
    document.getElementById('difficultyValue')!.textContent = `Level ${ aiDepth } `;
};

// Init
drawBoard(game);
updateStatus('🔴 Your Turn!');
