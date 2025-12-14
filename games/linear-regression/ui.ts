
import {
    GameState, INITIAL_STATE, STOCK_PROFILES,
    startNewRound, checkPrediction
} from './engine.js';

// 🏠 State
let appState: GameState = { ...INITIAL_STATE };
// Initial data generation
appState = startNewRound(appState);

// 🖥️ UI References
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// 🎨 Rendering
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
        const x = 100 + i * 70;
        ctx.beginPath();
        ctx.moveTo(x, 50);
        ctx.lineTo(x, 450);
        ctx.stroke();
    }

    for (let i = 0; i <= 10; i++) {
        const y = 50 + i * 40;
        ctx.beginPath();
        ctx.moveTo(100, y);
        ctx.lineTo(870, y);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, 450);
    ctx.lineTo(870, 450);
    ctx.moveTo(100, 50);
    ctx.lineTo(100, 450);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    for (let i = 1; i <= 11; i++) {
        ctx.fillText('Day ' + i, 100 + (i - 1) * 70, 470);
    }

    ctx.save();
    ctx.translate(70, 250);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Price ($)', 0, 0);
    ctx.restore();

    // Find min/max for scaling
    // Use last regression/data to determine scale
    const prices = appState.stockData.map(d => d.price);
    const minPrice = Math.min(...prices) - 10;
    const maxPrice = Math.max(...prices) + 10;

    function priceToY(price: number) {
        return 450 - ((price - minPrice) / (maxPrice - minPrice)) * 400;
    }

    // Draw data points
    appState.stockData.forEach(point => {
        const x = 100 + (point.day - 1) * 70;
        const y = priceToY(point.price);

        ctx.fillStyle = '#2196F3';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#333';
        ctx.font = '11px Arial';
        ctx.fillText('$' + point.price.toFixed(0), x, y - 15);
    });

    // Draw Regression Line if State Indicates (We need a flag for "showing result")
    // UI State needs track if we are showing results.
    // Let's modify appState or keep a local UI flag. Local flag is fine for "view state".
    if (isShowingResult) {
        const { slope, intercept, day11Price } = appState.lastRegression;

        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.beginPath();

        for (let day = 1; day <= 11; day++) {
            const price = slope * day + intercept;
            const x = 100 + (day - 1) * 70;
            const y = priceToY(price);
            if (day === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Day 11 Prediction
        const x11 = 100 + 10 * 70; // (11-1)*70 = 700. 100+700=800.
        // Wait, loop above: 100 + i*70. Day 11 is index 10.
        const y11 = priceToY(day11Price);

        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(x11, y11, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('$' + day11Price.toFixed(2), x11, y11 - 15);
    }

    // Title
    ctx.fillStyle = '#2d3748';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(STOCK_PROFILES[appState.currentStock].name + ' - Stock Price History', 450, 30);
}

// 🕹️ Interaction State
let isShowingResult = false;

function updateStats() {
    document.getElementById('round')!.textContent = appState.round.toString();
    document.getElementById('totalScore')!.textContent = appState.totalScore.toString();
    const avgError = appState.errors.length > 0
        ? appState.errors.reduce((a, b) => a + b, 0) / appState.errors.length
        : 0;
    document.getElementById('avgError')!.textContent = '$' + avgError.toFixed(2);
    document.getElementById('bestAccuracy')!.textContent = appState.bestAccuracy.toFixed(1) + '%';
}

function handleStockSelect(stock: string) {
    appState = startNewRound(appState, stock);
    isShowingResult = false;
    document.getElementById('resultBox')!.classList.remove('show');
    (document.getElementById('predictionInput') as HTMLInputElement).value = '';

    // UI Active State
    document.querySelectorAll('.stock-btn').forEach(btn => btn.classList.remove('active'));
    // We can't easily find the button triggered without event... 
    // Just re-render logic or assume user clicked.
    // We'll rely on the HTML onclick passing strict strings.
    // Better: Query based on onclick attr? Or data attr.
    // For now, simpler:
    // This is "imperative shell", so manual DOM manipulation is expected.
}

function handleNewRound() {
    appState = startNewRound(appState);
    isShowingResult = false;
    document.getElementById('resultBox')!.classList.remove('show');
    (document.getElementById('predictionInput') as HTMLInputElement).value = '';
    updateStats();
    draw();
}

function handleSubmit() {
    const input = document.getElementById('predictionInput') as HTMLInputElement;
    const val = parseFloat(input.value);

    if (isNaN(val) || val <= 0) {
        alert("Please enter a valid price!");
        return;
    }

    const result = checkPrediction(appState, val);
    appState = result.newState;
    isShowingResult = true;

    updateStats();

    // Show Result Box
    document.getElementById('yourPrediction')!.textContent = val.toFixed(2);
    document.getElementById('actualValue')!.textContent = appState.lastRegression.day11Price.toFixed(2);
    document.getElementById('error')!.textContent = result.error.toFixed(2);
    document.getElementById('displayRoundScore')!.textContent = result.score.toString();
    document.getElementById('resultBox')!.classList.add('show');

    document.getElementById('roundScore')!.textContent = result.score.toString();

    // Badge
    const badge = document.getElementById('accuracyBadge')!;
    const acc = result.accuracy;
    if (acc >= 95) {
        badge.textContent = '🏆 Excellent!';
        badge.style.background = '#FFD700';
        badge.style.color = '#000';
    } else if (acc >= 90) {
        badge.textContent = '⭐ Great!';
        badge.style.background = '#4CAF50';
        badge.style.color = '#fff';
    } else if (acc >= 80) {
        badge.textContent = '👍 Good';
        badge.style.background = '#2196F3';
        badge.style.color = '#fff';
    } else {
        badge.textContent = '😞 Poor';
        badge.style.background = '#F44336';
        badge.style.color = '#fff';
    }

    draw();
}

function handleShowTrend() {
    isShowingResult = true;
    draw();
}

function handleReset() {
    if (confirm('Reset scores?')) {
        appState = { ...INITIAL_STATE };
        appState = startNewRound(appState); // Generate initial data
        isShowingResult = false;
        document.getElementById('resultBox')!.classList.remove('show');
        updateStats();
        draw();
    }
}

// Bind Globals
(window as any).selectStock = (s: string) => {
    handleStockSelect(s);
    // Update active class manually since we lost the `event` reference
    document.querySelectorAll('.stock-btn').forEach(btn => {
        if (btn.textContent?.includes(STOCK_PROFILES[s].name)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    updateStats();
    draw();
};
(window as any).setDifficulty = (d: string) => {
    appState = startNewRound(appState, undefined, d);
    isShowingResult = false;
    document.getElementById('resultBox')!.classList.remove('show');
    // Active class logic...
    document.querySelectorAll('.difficulty-btn').forEach(btn => {
        if (btn.textContent?.toLowerCase() === d) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    updateStats();
    draw();
};

(window as any).newRound = handleNewRound;
(window as any).submitPrediction = handleSubmit;
(window as any).showRegression = handleShowTrend;
(window as any).reset = handleReset;

// Init
updateStats();
draw();
