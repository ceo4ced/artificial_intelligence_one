
import {
    RLState, LEVELS, initializeLevel, updateGridCell, trainEpisodeStep,
    getNextState, ACTIONS
} from './engine.js';

// Global State
let appState: RLState | null = initializeLevel(0);
let currentTool: 'reward' | 'penalty' | 'obstacle' | 'clear' = 'reward';

// DOM Elements
const totalScoreEl = document.getElementById('totalScore')!;
const levelEl = document.getElementById('level')!;
const episodeDisplayEl = document.getElementById('episodeDisplay')!;
const successesEl = document.getElementById('successes')!;
const avgStepsEl = document.getElementById('avgSteps')!;
const progressBar = document.getElementById('progressBar')!;
const gameGrid = document.getElementById('gameGrid')!;
const trainBtn = document.getElementById('trainBtn') as HTMLButtonElement;
const statsTextEl = document.getElementById('statsText')!;

// UI Renders

function renderGrid() {
    if (!appState) return;

    gameGrid.innerHTML = '';
    const { grid, config, agentPosition } = appState;
    const { start, goal, size } = config;

    gameGrid.style.gridTemplateColumns = `repeat(${size}, 70px)`;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            // cell.onclick... attached later

            // Markers
            if (r === start[0] && c === start[1]) {
                cell.classList.add('start');
                cell.innerHTML = '🚀';
            } else if (r === goal[0] && c === goal[1]) {
                cell.classList.add('goal');
                cell.innerHTML = '🎯';
            } else if (grid[r][c] === -999) {
                cell.classList.add('obstacle');
                cell.innerHTML = '⬛';
            } else if (grid[r][c] === 10) {
                cell.style.background = '#c8e6c9';
                cell.innerHTML = '✅';
            } else if (grid[r][c] === -10) {
                cell.style.background = '#ffcdd2';
                cell.innerHTML = '❌';
            }

            // Agent
            if (agentPosition && agentPosition[0] === r && agentPosition[1] === c) {
                const agent = document.createElement('div');
                agent.className = 'agent-icon';
                agent.innerHTML = '🤖';
                cell.appendChild(agent);
            }

            cell.onclick = () => handleCellClick(r, c);
            gameGrid.appendChild(cell);
        }
    }
}

function updateStats() {
    if (!appState) return;

    totalScoreEl.textContent = appState.score.toString();
    levelEl.textContent = (appState.currentLevelIndex + 1).toString();
    episodeDisplayEl.textContent = `Episode: ${appState.episode} / 50`; // Hardcoded max 50 for now
    successesEl.textContent = appState.successes.toString();

    const avg = appState.successes > 0 ? Math.round(appState.totalSteps / appState.successes) : 0;
    avgStepsEl.textContent = avg.toString();

    const progress = (appState.episode / 50) * 100;
    progressBar.style.width = `${progress}%`;

    if (appState.isTraining) {
        statsTextEl.innerHTML = `Running Episode ${appState.episode}...`;
    }
}


// Actions

function handleCellClick(r: number, c: number) {
    if (!appState || appState.isTraining) return;
    appState = updateGridCell(appState, r, c, currentTool);
    renderGrid();
}

async function handleStartTraining() {
    if (!appState || appState.isTraining) return;

    appState.isTraining = true;
    appState.episode = 0;
    appState.successes = 0;
    appState.totalSteps = 0;
    trainBtn.disabled = true;
    trainBtn.style.opacity = '0.5';

    updateStats();

    const MaxEpisodes = 50;
    const MaxSteps = appState.config.size * appState.config.size * 2;

    // Training Loop (Async for UI responsiveness)
    // We process batches of episodes to keep UI responsive without full lockup

    for (let ep = 1; ep <= MaxEpisodes; ep++) {
        let currentPos: [number, number] = [...appState.config.start];
        let steps = 0;
        let done = false;

        while (!done && steps < MaxSteps) {
            const res = trainEpisodeStep(currentPos, appState.qTable, appState.grid, appState.config);
            appState.qTable = res.nextQTable;
            currentPos = res.nextState;
            done = res.done;
            steps++;

            if (done) {
                appState.successes++;
                appState.totalSteps += steps;
            }
        }

        appState.episode = ep;

        if (ep % 5 === 0) {
            updateStats();
            await new Promise(r => setTimeout(r, 20)); // Yield to UI
        }
    }

    appState.isTraining = false;
    trainBtn.disabled = false;
    trainBtn.style.opacity = '1';

    const points = Math.round((appState.successes / MaxEpisodes) * 100);
    appState.score += points;

    updateStats();
    alert(`Training Complete! Success Rate: ${points}%`);
}

async function handleShowPolicy() {
    if (!appState || appState.isTraining) return;

    let currentPos: [number, number] = [...appState.config.start];
    appState.agentPosition = currentPos;
    renderGrid();

    for (let i = 0; i < 50; i++) {
        await new Promise(r => setTimeout(r, 300));

        const key = `${currentPos[0]},${currentPos[1]}`;
        const qVals = appState.qTable[key];

        // Pure Greedy selection
        let bestAction = ACTIONS[0];
        let maxVal = qVals[bestAction];

        for (const action of ACTIONS) {
            if (qVals[action] > maxVal) {
                maxVal = qVals[action];
                bestAction = action;
            }
        }

        const nextPos = getNextState(currentPos[0], currentPos[1], bestAction, appState.config.size, appState.grid);

        currentPos = nextPos;
        appState.agentPosition = currentPos;
        renderGrid();

        if (currentPos[0] === appState.config.goal[0] && currentPos[1] === appState.config.goal[1]) {
            break; // Reached goal
        }
    }

    appState.agentPosition = null; // Clear agent after run
    setTimeout(renderGrid, 1000);
}

function handleNextLevel() {
    if (!appState) return;
    const nextIdx = appState.currentLevelIndex + 1;
    if (nextIdx >= LEVELS.length) {
        alert("All levels complete!");
        return;
    }
    const nextState = initializeLevel(nextIdx);
    if (nextState) {
        nextState.score = appState.score; // Preserve score
        appState = nextState;
        renderGrid();
        updateStats();

        // Update instruction/challenge text
        refreshLevelUI();
    }
}

function handleResetLevel() {
    if (!appState) return;
    const resetState = initializeLevel(appState.currentLevelIndex);
    if (resetState) {
        resetState.score = appState.score;
        appState = resetState;
        renderGrid();
        updateStats();
    }
}

function refreshLevelUI() {
    if (!appState) return;

    const titleEl = document.getElementById('levelTitle');
    const descEl = document.getElementById('levelDesc');

    if (titleEl) titleEl.textContent = appState.config.title;
    if (descEl) descEl.textContent = appState.config.description;
}

function selectTool(tool: 'reward' | 'penalty' | 'obstacle' | 'clear') {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    // Find button with this tool onclick and add active? 
    // Simpler: just click handler passed from HTML needs to handle styling or we do it here.
    // We can use event.target if triggered from UI.
}

// Window Exports
(window as any).startTraining = handleStartTraining;
(window as any).showPolicy = handleShowPolicy;
(window as any).nextLevel = handleNextLevel;
(window as any).resetLevel = handleResetLevel;
(window as any).selectTool = (tool: any) => {
    selectTool(tool);
    // Visual update
    const btns = document.querySelectorAll('.tool-btn');
    btns.forEach((btn: any) => {
        if (btn.textContent.toLowerCase().includes(tool)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
};

// Init
renderGrid();
updateStats();
