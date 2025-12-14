
import {
    TreeGameState, INITIAL_STATE, SCENARIOS, TreeNode,
    initializeScenario, addChild, toggleNodeExpand, getMaxDepth, calculateBalance,
    getAllFiles, findItemDepth, collapseAllNodes
} from './engine.js';

// Global State
let appState: TreeGameState = { ...INITIAL_STATE };
let selectedPoolItemIndex: number | null = null;
let feedbackTimeout: any;

// DOM Elements
const scoreEl = document.getElementById('score')!;
const efficiencyEl = document.getElementById('efficiency')!;
const currentScenarioEl = document.getElementById('currentScenario')!;
const treeDepthEl = document.getElementById('treeDepth')!;
const balanceScoreEl = document.getElementById('balanceScore')!;
const searchSpeedEl = document.getElementById('searchSpeed')!;
const progressBar = document.getElementById('progressBar')!;
const scenarioTitleEl = document.getElementById('scenarioTitle')!;
const challengeDescriptionEl = document.getElementById('challengeDescription')!;
const itemsPoolEl = document.getElementById('poolItems')!;
const treeDisplayEl = document.getElementById('treeDisplay')!;
const feedbackEl = document.getElementById('feedback')!;
const feedbackTitleEl = document.getElementById('feedbackTitle')!;
const feedbackTextEl = document.getElementById('feedbackText')!;
const searchChallengeEl = document.getElementById('searchChallenge')!;
const searchTargetEl = document.getElementById('searchTarget')!;
const timerEl = document.getElementById('timer')!;

// Init
function init() {
    startScenario(0);
}

function startScenario(index: number) {
    appState = initializeScenario(index);
    updateUI();
}

function updateUI() {
    // Stats
    const scenario = SCENARIOS[appState.currentScenarioIndex];
    scoreEl.textContent = appState.score.toString();
    currentScenarioEl.textContent = `${appState.currentScenarioIndex + 1}/${SCENARIOS.length}`;

    const depth = getMaxDepth(appState.tree);
    treeDepthEl.textContent = depth.toString();

    const balance = calculateBalance(appState.tree);
    balanceScoreEl.textContent = `${balance}%`;

    const fileCount = getAllFiles(appState.tree).length;
    const totalFiles = scenario.items.length + fileCount;
    const efficiency = totalFiles > 0 ? Math.round((fileCount / totalFiles) * 100) : 0;
    efficiencyEl.textContent = `${efficiency}%`;

    const progress = ((appState.currentScenarioIndex) / SCENARIOS.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Scenario Info
    scenarioTitleEl.textContent = `Scenario ${appState.currentScenarioIndex + 1}: ${scenario.title}`;
    challengeDescriptionEl.textContent = scenario.description;

    // Items Pool
    itemsPoolEl.innerHTML = '';
    appState.poolItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        if (selectedPoolItemIndex === index) itemDiv.classList.add('selected');
        itemDiv.textContent = item.name;
        itemDiv.onclick = () => {
            selectedPoolItemIndex = index;
            updateUI();
        };
        itemsPoolEl.appendChild(itemDiv);
    });

    // Tree Helper
    treeDisplayEl.innerHTML = '';
    renderTreeNode(appState.tree, treeDisplayEl, []);

    if (appState.searchActive) {
        searchChallengeEl.classList.add('active');
        searchTargetEl.textContent = appState.searchTarget || '';
        requestAnimationFrame(updateTimer);
    } else {
        searchChallengeEl.classList.remove('active');
    }
}

function renderTreeNode(node: TreeNode, container: HTMLElement, path: number[]) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = 'tree-node' + (path.length === 0 ? ' root' : '');

    const labelDiv = document.createElement('div');

    // Toggle expansion
    const toggle = document.createElement('span');
    toggle.className = 'expand-toggle';
    if (node.type === 'folder') {
        if (node.children && node.children.length > 0) {
            toggle.textContent = node.expanded ? '▼' : '▶';
            toggle.onclick = (e) => {
                e.stopPropagation();
                appState.tree = toggleNodeExpand(appState.tree, path);
                updateUI();
            };
        } else {
            toggle.textContent = '○';
        }
    } else {
        toggle.textContent = '•';
    }
    labelDiv.appendChild(toggle);

    // Label
    const label = document.createElement('span');
    label.className = 'node-label ' + node.type;
    label.textContent = (node.type === 'folder' ? '📁 ' : '📄 ') + node.name;

    // Interactions
    if (node.type === 'folder') {
        label.onclick = () => {
            if (selectedPoolItemIndex !== null) {
                const item = appState.poolItems[selectedPoolItemIndex];
                const newNode: TreeNode = {
                    name: item.name,
                    type: 'file',
                    category: item.category
                };
                appState.tree = addChild(appState.tree, path, newNode);
                appState.poolItems.splice(selectedPoolItemIndex, 1);
                selectedPoolItemIndex = null;
                updateUI();
            }
        };
    } else if (appState.searchActive && appState.searchTarget === node.name) {
        label.classList.add('target');
        label.onclick = () => handleFoundTarget();
    }

    labelDiv.appendChild(label);
    nodeDiv.appendChild(labelDiv);
    container.appendChild(nodeDiv);

    // Children
    if (node.type === 'folder' && node.expanded && node.children) {
        const childContainer = document.createElement('div');
        node.children.forEach((child, index) => {
            renderTreeNode(child, childContainer, [...path, index]);
        });
        nodeDiv.appendChild(childContainer);
    }
}

function updateTimer() {
    if (!appState.searchActive) return;
    const elapsed = ((Date.now() - appState.searchStartTime) / 1000).toFixed(1);
    timerEl.textContent = elapsed + 's';
    requestAnimationFrame(updateTimer);
}

// Actions

function handleAddFolder() {
    const folderName = prompt("Enter folder name:");
    if (!folderName) return;

    // Where to add? Since we don't have a 'selected node' for adding folders in this UI 
    // (original code just added to root via prompt logic or something?),
    // ORIGINAL LOGIC: "tree.children.push(...)". Always added to root.
    // We will preserve that simplicity for now, or maybe improve later.
    const newFolder: TreeNode = {
        name: folderName,
        type: 'folder',
        children: [],
        expanded: true
    };
    appState.tree = addChild(appState.tree, [], newFolder);
    updateUI();
}

function handleNextScenario() {
    if (appState.poolItems.length > 0) {
        if (!confirm("You have unorganized items. Continue anyway?")) return;
    }

    if (appState.currentScenarioIndex + 1 >= SCENARIOS.length) {
        showFinalScore();
        return;
    }

    startScenario(appState.currentScenarioIndex + 1);
}

function handleResetTree() {
    if (confirm("Reset the tree and start over?")) {
        startScenario(appState.currentScenarioIndex);
    }
}


function handleTestSearch() {
    const allFiles = getAllFiles(appState.tree);
    if (allFiles.length === 0) {
        alert("Add some files to your tree first!");
        return;
    }

    appState.searchActive = true;
    appState.searchTarget = allFiles[Math.floor(Math.random() * allFiles.length)];
    appState.searchStartTime = Date.now();

    // Need to collapse all for the "search challenge" aspect
    // We need to mutate appState.tree copy
    const newTree = JSON.parse(JSON.stringify(appState.tree));
    collapseAllNodes(newTree); // helper function modifies in place
    appState.tree = newTree;

    updateUI();
}

function handleFoundTarget() {
    if (!appState.searchActive) return;

    const elapsed = (Date.now() - appState.searchStartTime) / 1000;
    appState.searchActive = false;

    const depth = findItemDepth(appState.tree, appState.searchTarget!);
    let speedRating = '';
    let points = 0;

    if (elapsed < 3) {
        speedRating = 'Excellent!';
        points = 100;
    } else if (elapsed < 5) {
        speedRating = 'Good!';
        points = 75;
    } else if (elapsed < 8) {
        speedRating = 'Fair';
        points = 50;
    } else {
        speedRating = 'Slow';
        points = 25;
    }

    if (depth <= 3) points += 25;
    appState.score += points;

    searchSpeedEl.textContent = elapsed.toFixed(1) + 's';

    showFeedback(`Found in ${elapsed.toFixed(1)}s - ${speedRating}`,
        `You earned <strong>${points} points</strong>!<br>File depth: ${depth} levels`);

    updateUI();
}

function handleCheckOrganization() {
    if (appState.poolItems.length > 0) {
        alert("You still have items to organize!");
        return;
    }

    const depth = getMaxDepth(appState.tree);
    const balance = calculateBalance(appState.tree);
    let feedback = '';
    let points = 0;

    if (depth >= 2 && depth <= 4) { feedback += '✓ Good depth (2-4 levels)<br>'; points += 50; }
    else if (depth === 1) { feedback += '⚠ Too shallow<br>'; points += 20; }
    else { feedback += '⚠ Too deep<br>'; points += 30; }

    if (balance > 70) { feedback += '✓ Well balanced<br>'; points += 50; }
    else if (balance > 50) { feedback += '○ Moderate balance<br>'; points += 30; }
    else { feedback += '⚠ Unbalanced<br>'; points += 20; }

    appState.score += points;
    showFeedback(`Organization Score: ${points}/100`, feedback);
    updateUI();
}

function showFeedback(title: string, html: string) {
    feedbackTitleEl.textContent = title;
    feedbackTextEl.innerHTML = html;
    feedbackEl.classList.add('show');
    clearTimeout(feedbackTimeout);
    // feedbackTimeout = setTimeout(() => feedbackEl.classList.remove('show'), 5000); 
    // Keep it until dismissed or next action maybe?
}


function showFinalScore() {
    alert(`Game Complete! Score: ${appState.score}`);
}

// Global Exports
(window as any).addFolder = handleAddFolder;
(window as any).nextScenario = handleNextScenario;
(window as any).resetTree = handleResetTree;
(window as any).testSearch = handleTestSearch;
(window as any).checkOrganization = handleCheckOrganization;

// Start
init();
