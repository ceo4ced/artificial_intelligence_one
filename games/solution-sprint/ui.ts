
import {
    GameState, INITIAL_STATE, CHALLENGES,
    startSprint, calculateScore, submitSolution, nextSprint, resetGame
} from './engine.js';

let appState: GameState = { ...INITIAL_STATE };
let timerInterval: any = null;

// DOM Elements
const totalScoreEl = document.getElementById('totalScore')!;
const sprintNumberEl = document.getElementById('sprintNumber')!;
const timerDisplayEl = document.getElementById('timerDisplay')!;
const ideaCountEl = document.getElementById('ideaCount')!;
const qualityScoreEl = document.getElementById('qualityScore')!;
const bestSprintEl = document.getElementById('bestSprint')!;
const progressBar = document.getElementById('progressBar')!;
const startBtn = document.getElementById('startBtn')!;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
const gameContent = document.getElementById('gameContent')!;


function init() {
    (window as any).startSprint = handleStartSprint;
    (window as any).submitSolution = handleSubmitSolution;
    (window as any).nextSprint = handleNextSprint;
    (window as any).skipSprint = handleSkipSprint;
    (window as any).resetGame = handleReset;
    (window as any).setTool = setTool;
    (window as any).setColor = setColor;
    (window as any).clearCanvas = clearCanvas;
    (window as any).updateCriteriaCheck = updateCriteriaCheck;

    updateStats();
}

function handleStartSprint() {
    if (appState.currentChallengeIndex >= CHALLENGES.length) {
        showGameComplete();
        return;
    }

    appState = startSprint(appState);

    startBtn.style.display = 'none';
    submitBtn.style.display = 'block';
    submitBtn.disabled = false;

    renderChallenge();
    startTimer();
}

function renderChallenge() {
    const challenge = CHALLENGES[appState.currentChallengeIndex];

    gameContent.innerHTML = `
        <div class="challenge-card">
            <h3>🎯 Sprint ${appState.currentChallengeIndex + 1}: ${challenge.title}</h3>
            <div class="persona-info">
                <h4>👤 User: ${challenge.persona.name}</h4>
                <p style="margin: 10px 0; line-height: 1.6;"><strong>Problem:</strong> ${challenge.persona.problem}</p>
                <p style="margin: 10px 0;"><strong>Pain Points:</strong></p>
                <ul style="margin-left: 20px; line-height: 1.6;">
                    ${challenge.persona.painPoints.map(p => `<li>${p}</li>`).join('')}
                </ul>
                <p style="margin: 10px 0;"><strong>Goals:</strong></p>
                <ul style="margin-left: 20px; line-height: 1.6;">
                    ${challenge.persona.goals.map(g => `<li>${g}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div style="background: #fff; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #2d3748; margin-bottom: 15px;">💡 Your Solution</h3>

            <h4 style="color: #667eea; margin: 15px 0;">Describe your solution:</h4>
            <textarea class="idea-input" id="solutionText" placeholder="What would you build to solve this problem? Describe your solution in detail - what is it, how does it work, and why it helps the user..."></textarea>

            <h4 style="color: #667eea; margin: 15px 0;">Sketch your idea (optional but recommended!):</h4>
            <div class="canvas-container">
                <div class="drawing-tools">
                    <button class="tool-btn active" onclick="setTool('pen')">✏️ Pen</button>
                    <button class="tool-btn" onclick="setTool('eraser')">🗑️ Eraser</button>
                    <button class="tool-btn" onclick="clearCanvas()">Clear</button>
                    <select onchange="setColor(this.value)" style="padding: 10px; border: 2px solid #667eea; border-radius: 6px;">
                        <option value="#000000">Black</option>
                        <option value="#667eea">Blue</option>
                        <option value="#f44336">Red</option>
                        <option value="#4CAF50">Green</option>
                    </select>
                </div>
                <canvas id="drawingCanvas" width="700" height="400"></canvas>
            </div>
        </div>

        <div class="criteria-checklist">
            <h4 style="color: #2d3748; margin-bottom: 15px;">✅ Check Your Solution Against These Criteria:</h4>
            ${challenge.criteria.map((c, i) => `
                <label class="criteria-item" id="criteria${i}">
                    <input type="checkbox" onchange="updateCriteriaCheck(${i})">
                    <span>${c}</span>
                </label>
            `).join('')}
        </div>
    `;

    setupCanvas();
    updateProgress();
}


function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        appState.timeRemaining--;
        updateTimerDisplay();

        if (appState.timeRemaining <= 0) {
            clearInterval(timerInterval);
            handleSubmitSolution();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(appState.timeRemaining / 60);
    const seconds = appState.timeRemaining % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerDisplayEl.textContent = display;

    if (appState.timeRemaining <= 30) {
        timerDisplayEl.classList.add('warning');
    } else {
        timerDisplayEl.classList.remove('warning');
    }
}

function handleSubmitSolution() {
    clearInterval(timerInterval);
    submitBtn.disabled = true;

    const solutionText = (document.getElementById('solutionText') as HTMLTextAreaElement).value.trim();
    const checkedCriteria = document.querySelectorAll('.criteria-item input:checked').length;
    const totalCriteria = CHALLENGES[appState.currentChallengeIndex].criteria.length;

    const { points, feedback } = calculateScore(solutionText, checkedCriteria, totalCriteria, appState.timeRemaining);
    appState = submitSolution(appState, points);

    updateStats();
    showSprintFeedback(points, feedback, checkedCriteria, totalCriteria);
}

function showSprintFeedback(points: number, feedback: string[], checked: number, total: number) {
    const percentage = Math.round((checked / total) * 100);

    let badge = '';
    if (percentage >= 80) badge = '<span class="badge excellent">Excellent</span>';
    else if (percentage >= 60) badge = '<span class="badge good">Good</span>';
    else badge = '<span class="badge fair">Keep Practicing</span>';

    gameContent.innerHTML = `
        <div class="feedback-box">
            <h4>🎯 Sprint ${appState.currentChallengeIndex + 1} Complete! ${badge}</h4>

            <div class="score-breakdown">
                <h4 style="color: #667eea; margin-bottom: 10px;">Score Breakdown:</h4>
                ${feedback.map(f => `<div class="score-item"><span>${f}</span></div>`).join('')}
                <div class="score-item" style="font-weight: bold; font-size: 1.2em; border-top: 2px solid #667eea; padding-top: 10px;">
                    <span>Total Sprint Score:</span><span>${points} points</span>
                </div>
            </div>

            <div style="margin-top: 20px; padding: 15px; background: ${percentage >= 60 ? '#e8f5e9' : '#fff3e0'}; border-radius: 8px;">
                <p style="line-height: 1.6; color: #4a5568;">
                    ${percentage >= 80 ?
            "Outstanding work! Your solution thoroughly addresses the user's needs. You showed strong empathy and creativity." :
            percentage >= 60 ?
                "Good effort! Your solution addresses key user needs. Consider how you could address more of the user's pain points." :
                "Keep learning! In HCD, make sure your solution directly addresses the user's specific pain points and goals, not just features."
        }
                </p>
            </div>

            <button class="btn-primary" onclick="nextSprint()" style="margin-top: 20px;">
                ${appState.currentChallengeIndex + 1 < CHALLENGES.length ? 'Next Sprint →' : 'See Final Score →'}
            </button>
        </div>
    `;
}

function handleNextSprint() {
    appState = nextSprint(appState);
    sprintNumberEl.textContent = (appState.currentChallengeIndex + 1).toString();

    if (appState.currentChallengeIndex >= CHALLENGES.length) {
        showGameComplete();
    } else {
        startBtn.style.display = 'block';
        submitBtn.style.display = 'none';
        timerDisplayEl.textContent = '5:00';
        timerDisplayEl.classList.remove('warning');

        gameContent.innerHTML = `
            <div class="challenge-card">
                <h3>🎯 Ready for Sprint ${appState.currentChallengeIndex + 1}?</h3>
                <p style="line-height: 1.8; color: #4a5568;">
                    Great work on the last sprint! When you're ready, click "Start Sprint" to begin the next challenge.
                    Remember: focus on the user's needs, not just cool features!
                </p>
            </div>
        `;
    }

    updateProgress();
}

function handleSkipSprint() {
    if (!appState.sprintStarted) {
        handleNextSprint();
    } else {
        if (confirm('Skip this sprint? You won\'t earn points.')) {
            clearInterval(timerInterval);
            handleNextSprint();
        }
    }
}

function showGameComplete() {
    const avgScore = Math.round(appState.score / CHALLENGES.length);

    gameContent.innerHTML = `
        <div class="feedback-box" style="border-color: #4CAF50;">
            <h4 style="color: #4CAF50; font-size: 2em;">🎉 All Sprints Complete!</h4>

            <div style="text-align: center; margin: 30px 0;">
                <div style="font-size: 4em; font-weight: bold; color: #667eea;">${appState.score}</div>
                <div style="font-size: 1.5em; color: #666;">Total Points</div>
                <div style="margin-top: 10px;">Average: ${avgScore} points per sprint</div>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="color: #1976d2; margin-bottom: 15px;">🎯 What You've Learned:</h4>
                <ul style="line-height: 1.8; margin-left: 20px; color: #4a5568;">
                    <li>How to quickly understand user needs and pain points</li>
                    <li>Brainstorming solutions under time pressure (like real design sprints!)</li>
                    <li>Evaluating designs against usability criteria</li>
                    <li>Focusing on user outcomes, not just features</li>
                    <li>Sketching as a thinking tool</li>
                </ul>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <p style="line-height: 1.8; color: #4a5568;">
                    Real design sprints work exactly like this - teams tackle problems with time constraints to force
                    creativity and avoid overthinking. You've practiced a key skill used by designers at companies
                    like Google, Facebook, and Airbnb!
                </p>
            </div>

            <button class="btn-primary" onclick="resetGame()" style="margin-top: 20px;">Play Again</button>
        </div>
    `;
}

function handleReset() {
    appState = resetGame();
    clearInterval(timerInterval);

    sprintNumberEl.textContent = '1';
    startBtn.style.display = 'block';
    submitBtn.style.display = 'none';
    timerDisplayEl.textContent = '5:00';
    timerDisplayEl.classList.remove('warning');

    gameContent.innerHTML = `
        <div class="challenge-card">
            <h3>🎯 Welcome to Solution Sprint!</h3>
            <p style="line-height: 1.8; color: #4a5568;">
                You'll face 5 design challenges. For each challenge, you have 5 minutes to understand the user's
                problem and design a solution. Click "Start Sprint" when you're ready!
            </p>
        </div>
    `;

    updateStats();
    updateProgress();
}

function updateStats() {
    totalScoreEl.textContent = appState.score.toString();
    ideaCountEl.textContent = appState.currentChallengeIndex.toString();

    const quality = appState.currentChallengeIndex > 0 ? Math.round((appState.score / (appState.currentChallengeIndex * 100)) * 100) : 0;
    qualityScoreEl.textContent = quality + '%';

    const bestSprint = localStorage.getItem('solutionSprintBest') || '0';
    if (appState.score > parseInt(bestSprint)) {
        localStorage.setItem('solutionSprintBest', appState.score.toString());
        bestSprintEl.textContent = appState.score.toString();
    } else {
        bestSprintEl.textContent = bestSprint;
    }
}

function updateProgress() {
    const progress = (appState.currentChallengeIndex / CHALLENGES.length) * 100;
    progressBar.style.width = progress + '%';
}


// --- Canvas Logic ---

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let isDrawing = false;
let drawColor = '#000000';
let drawWidth = 2;

function setupCanvas() {
    canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    ctx = canvas.getContext('2d')!;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch support
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e: MouseEvent) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e: MouseEvent) {
    if (!isDrawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = drawWidth;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function handleTouch(e: TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function setTool(tool: string) {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    (window.event!.target as HTMLElement).classList.add('active');

    if (tool === 'eraser') {
        drawColor = '#ffffff';
        drawWidth = 20;
    } else {
        drawColor = (document.querySelector('select') as HTMLSelectElement).value;
        drawWidth = 2;
    }
}

function setColor(color: string) {
    drawColor = color;
}

function clearCanvas() {
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCriteriaCheck(index: number) {
    const item = document.getElementById('criteria' + index)!;
    const checkbox = item.querySelector('input')!;
    if (checkbox.checked) {
        item.classList.add('checked');
    } else {
        item.classList.remove('checked');
    }
}

init();
