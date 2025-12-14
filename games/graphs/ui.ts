import {
    GameState, GraphNode, INITIAL_STATE, SCENARIOS,
    computeAnswer, distanceToLine
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };
let mode: 'node' | 'edge' | 'delete' = 'node';
let selectedNode: GraphNode | null = null;

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const scenarioDescriptionEl = document.getElementById('scenarioDescription')!;
const nodeCountEl = document.getElementById('nodeCount')!;
const edgeCountEl = document.getElementById('edgeCount')!;
const scenariosCompletedEl = document.getElementById('scenariosCompleted')!;
const totalScoreEl = document.getElementById('totalScore')!;
const scenarioScoreEl = document.getElementById('scenarioScore')!;
const questionsContainerEl = document.getElementById('questionsContainer')!;
const completionBannerEl = document.getElementById('completionBanner')!;
const finalScoreEl = document.getElementById('finalScore')!;

function init() {
    (window as any).loadScenario = handleLoadScenario;
    (window as any).setMode = handleSetMode;
    (window as any).clearGraph = handleClearGraph;
    (window as any).checkAnswers = handleCheckAnswers;
    (window as any).nextScenario = handleNextScenario;

    canvas.addEventListener('click', handleCanvasClick);

    handleLoadScenario(0);
}

function handleLoadScenario(index: number) {
    appState.currentScenarioIndex = index;

    document.querySelectorAll('.scenario-btn').forEach((btn, i) => {
        btn.classList.remove('active');
        if (i === index) btn.classList.add('active');
    });

    const scenario = SCENARIOS[index];
    scenarioDescriptionEl.innerHTML = `< h4 > ${scenario.title} </h4><p>${scenario.description}</p > `;

    handleClearGraph();
    renderQuestions();
    updateScenarioScore();
}

function handleSetMode(newMode: 'node' | 'edge' | 'delete') {
    mode = newMode;
    selectedNode = null;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    // Finding button by iterating text content is messy or assume event target passed?
    // In index.html it's onclick="setMode(...)". event is available?
    // Let's iterate.
    const buttons = document.querySelectorAll('.mode-btn');
    buttons.forEach(btn => {
        if (btn.textContent?.toLowerCase().includes(newMode === 'node' ? 'add node' : (newMode === 'edge' ? 'add edge' : 'delete'))) {
            btn.classList.add('active');
        }
    });

    draw();
}

function handleClearGraph() {
    appState.nodes = [];
    appState.edges = [];
    selectedNode = null;
    appState.nodeIdCounter = 0;
    draw();
    updateStats();
}

function handleNextScenario() {
    const next = (appState.currentScenarioIndex + 1) % SCENARIOS.length;
    handleLoadScenario(next);
}

function renderQuestions() {
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    let html = '';
    scenario.questions.forEach((q, i) => {
        html += `
    < div class="question" >
        <div class="question-text" > ${i + 1}. ${q.text} </div>
            < input type = "text" class="answer-input" id = "answer${i}" placeholder = "Enter your answer" >
                <div class="answer-feedback" id = "feedback${i}" style = "display: none;" > </div>
                    </div>
                        `;
    });
    questionsContainerEl.innerHTML = html;
}

function handleCheckAnswers() {
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    let correctAnswers = 0;
    let totalQuestions = scenario.questions.length;

    scenario.questions.forEach((q, i) => {
        const input = document.getElementById(`answer${i} `) as HTMLInputElement;
        const userAnswer = input.value.trim().toLowerCase();
        const feedback = document.getElementById(`feedback${i} `)!;

        let correctAnswer = computeAnswer(q, appState.nodes, appState.edges);

        // Allow some flexibility? Exact match for now.
        const isCorrect = userAnswer === correctAnswer.toLowerCase();

        if (isCorrect) {
            correctAnswers++;
            feedback.className = 'answer-feedback correct';
            feedback.textContent = 'Correct!';
        } else {
            feedback.className = 'answer-feedback incorrect';
            feedback.textContent = `Incorrect.Expected: ${correctAnswer} `;
        }

        feedback.style.display = 'block';
    });

    // Calculate score
    const graphScore = Math.min(50, appState.nodes.length * 10);
    const answerScore = (correctAnswers / totalQuestions) * 50;
    const totalScore = Math.round(graphScore + answerScore);

    appState.scenarioScores[appState.currentScenarioIndex] = totalScore;
    updateScenarioScore();
    updateStats();

    if (totalScore >= 70) {
        const btns = document.querySelectorAll('.scenario-btn');
        if (btns[appState.currentScenarioIndex]) {
            if (!btns[appState.currentScenarioIndex].classList.contains('completed')) {
                btns[appState.currentScenarioIndex].classList.add('completed');
                appState.scenariosCompleted++;
            }
        }

        if (appState.scenariosCompleted === SCENARIOS.length) {
            showCompletionBanner();
        }
    }
}

function updateScenarioScore() {
    scenarioScoreEl.textContent = `${appState.scenarioScores[appState.currentScenarioIndex]} / 100`;
}

function updateStats() {
    nodeCountEl.textContent = appState.nodes.length.toString();
    edgeCountEl.textContent = appState.edges.length.toString();
    scenariosCompletedEl.textContent = `${appState.scenariosCompleted}/6`;

    const total = appState.scenarioScores.reduce((sum, s) => sum + s, 0);
    totalScoreEl.textContent = total.toString();
}

function showCompletionBanner() {
    const total = appState.scenarioScores.reduce((sum, s) => sum + s, 0);
    finalScoreEl.textContent = total.toString();
    completionBannerEl.classList.add('show');
}

function handleCanvasClick(e: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked node
    const clickedNode = appState.nodes.find(n =>
        Math.sqrt((x - n.x) ** 2 + (y - n.y) ** 2) <= n.radius
    );

    if (mode === 'node') {
        if (!clickedNode) {
            const scenario = SCENARIOS[appState.currentScenarioIndex];
            if (appState.nodes.length < scenario.nodeLabels.length) {
                const label = scenario.nodeLabels[appState.nodes.length];
                appState.nodes.push({
                    x, y,
                    id: appState.nodeIdCounter++,
                    label,
                    radius: 30
                });
                draw();
                updateStats();
            }
        }
    } else if (mode === 'edge') {
        if (clickedNode) {
            if (!selectedNode) {
                selectedNode = clickedNode;
                draw();
            } else if (selectedNode !== clickedNode) {
                // Check edge existence
                const scenario = SCENARIOS[appState.currentScenarioIndex];
                const exists = appState.edges.some(e =>
                    (e.from === selectedNode!.id && e.to === clickedNode.id) ||
                    (!scenario.directed && e.from === clickedNode.id && e.to === selectedNode!.id)
                );

                if (!exists) {
                    let weight = null;
                    if (scenario.weighted) {
                        const val = prompt('Enter edge weight (distance, time, etc.):') || '1';
                        weight = parseInt(val);
                        if (isNaN(weight) || weight <= 0) weight = 1;
                    }

                    appState.edges.push({
                        from: selectedNode!.id,
                        to: clickedNode.id,
                        weight,
                        directed: scenario.directed
                    });
                }
                selectedNode = null;
                draw();
                updateStats();
            }
        }
    } else if (mode === 'delete') {
        if (clickedNode) {
            appState.edges = appState.edges.filter(e => e.from !== clickedNode.id && e.to !== clickedNode.id);
            appState.nodes = appState.nodes.filter(n => n !== clickedNode);
            draw();
            updateStats();
        } else {
            // Check edge click
            const oldLen = appState.edges.length;
            appState.edges = appState.edges.filter(edge => {
                const fromNode = appState.nodes.find(n => n.id === edge.from);
                const toNode = appState.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return false;

                const dist = distanceToLine(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y);
                return dist > 10;
            });
            if (appState.edges.length < oldLen) {
                draw();
                updateStats();
            }
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    appState.edges.forEach(edge => {
        const fromNode = appState.nodes.find(n => n.id === edge.from);
        const toNode = appState.nodes.find(n => n.id === edge.to);
        if (!fromNode || !toNode) return;

        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        if (edge.directed) {
            const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
            const arrowX = toNode.x - 35 * Math.cos(angle);
            const arrowY = toNode.y - 35 * Math.sin(angle);

            ctx.fillStyle = '#2d3748';
            ctx.beginPath();
            ctx.moveTo(arrowX, arrowY);
            ctx.lineTo(arrowX - 12 * Math.cos(angle - Math.PI / 6), arrowY - 12 * Math.sin(angle - Math.PI / 6));
            ctx.lineTo(arrowX - 12 * Math.cos(angle + Math.PI / 6), arrowY - 12 * Math.sin(angle + Math.PI / 6));
            ctx.closePath();
            ctx.fill();
        }

        if (edge.weight !== null) {
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;

            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#2d3748';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(midX, midY, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(edge.weight.toString(), midX, midY);
        }
    });

    // Draw nodes
    appState.nodes.forEach(node => {
        if (node === selectedNode) {
            ctx.strokeStyle = '#4CAF50';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.fillStyle = '#667eea';
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
    });
}

init();
