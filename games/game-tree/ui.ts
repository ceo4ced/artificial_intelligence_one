
import {
    TreeNode, GameState, INITIAL_STATE,
    createTree, runMinimax, countNodes, resetEvaluation
} from './engine.js';

// Visual Node Extension
interface VisualTreeNode extends TreeNode {
    x: number;
    y: number;
    parent?: VisualTreeNode;
    children: VisualTreeNode[];
}

// State
let appState: GameState = { ...INITIAL_STATE };
let visualTree: VisualTreeNode | null = null;
let currentStep = 0;
let animationSteps: { nodeId: string, value: number }[] = [];

// DOM Elements
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const depthValEl = document.getElementById('depthVal')!;
const branchValEl = document.getElementById('branchVal')!;
const nodesCountEl = document.getElementById('nodes')!;
const evaluatedCountEl = document.getElementById('evaluated')!;
const bestMoveEl = document.getElementById('bestMove')!;
const bestValueEl = document.getElementById('bestValue')!;
const depthInput = document.getElementById('depth') as HTMLInputElement;
const branchInput = document.getElementById('branch') as HTMLInputElement;

function init() {
    (window as any).generateTree = handleGenerateTree;
    (window as any).runMinimax = handleRunMinimax;
    (window as any).step = handleStep;
    (window as any).reset = handleReset;
    (window as any).updateDepth = handleUpdateDepth;
    (window as any).updateBranch = handleUpdateBranch;

    handleGenerateTree();
}

function handleGenerateTree() {
    cancelAnimation();
    appState.tree = createTree(appState.depth, appState.branchingFactor);
    visualTree = mapToVisualTree(appState.tree);

    // Layout
    assignPositions(visualTree, canvas.width / 2, 50, canvas.width - 100);

    resetStats();
    updateStatsDisplay();
    draw();
}

// Map logical tree to visual tree (adds x, y, parent references)
function mapToVisualTree(node: TreeNode, parent?: VisualTreeNode): VisualTreeNode {
    const visualNode: VisualTreeNode = {
        ...node,
        x: 0,
        y: 0,
        parent,
        children: [] // Will populate
    };
    visualNode.children = node.children.map(child => mapToVisualTree(child, visualNode));
    return visualNode;
}

function assignPositions(node: VisualTreeNode, x: number, y: number, availableWidth: number) {
    node.x = x;
    node.y = y;

    if (node.children.length > 0) {
        const totalWidth = availableWidth;
        // Divide space among children
        // Visual spacing:
        // Use a simpler recursive layout based on leaf counting or fixed width?
        // Original code used: `horizontalSpacing / (node.children.length + 1)` and recursive division

        // Let's simple divide the available width by children count
        const sliceWidth = totalWidth / node.children.length;
        const startX = x - totalWidth / 2 + sliceWidth / 2;

        node.children.forEach((child, i) => {
            assignPositions(
                child,
                startX + i * sliceWidth,
                y + 120,
                sliceWidth // reduce width for next level
            );
        });
    }
}

function handleUpdateDepth() {
    appState.depth = parseInt(depthInput.value);
    depthValEl.textContent = appState.depth.toString();
}

function handleUpdateBranch() {
    appState.branchingFactor = parseInt(branchInput.value);
    branchValEl.textContent = appState.branchingFactor.toString();
}

function handleRunMinimax() {
    if (!appState.tree) return;

    // Reset visual state
    resetEvaluation(appState.tree);
    // Re-map visual state from logical state (dirty fix or verify referencing?)
    // The visual tree holds references to `evaluated` etc properties if it copied them?
    // Wait, `mapToVisualTree` uses spread `{...node}`. So it creates a shallow copy. 
    // Mutating `appState.tree` (logical) won't update `visualTree` if they are disconnected.
    // Solution: Re-map visual tree OR create visual tree wraps logical node?
    // Better: logical node object is shared.
    // In `mapToVisualTree`: `...node` creates a COPY of properties.
    // I should instead make VisualTreeNode contain `data: TreeNode`.
    // OR just rebuild visual tree on update.
    // Let's rebuild visual tree since layout is cheap.

    const result = runMinimax(appState.tree);
    appState.evaluatedCount = result.evaluatedCount;
    animationSteps = result.steps;
    currentStep = 0;

    // Reset visual representation to reflect "unevaluated" start state
    // But `runMinimax` modifies the tree in-place immediately in `engine`.
    // We want to animate strictly.
    // So we need to "undo" the evaluation in the visual tree, or rather, the engine runs fully, 
    // but visualize steps.
    // The engine `runMinimax` returns the final state.
    // To animate, we need to artificially hide the results until the step matches.

    // Actually, `runMinimax` in engine modifies the node properties `evaluated`, `value`.
    // So after `runMinimax`, the tree assumes final state.
    // For animation, we should reset the visual tree's flags, then reveal them based on `animationSteps`.

    // 1. Run minimax logic (modifies appState.tree)
    // 2. Re-create Visual Tree (now has final values)
    visualTree = mapToVisualTree(appState.tree);
    assignPositions(visualTree, canvas.width / 2, 50, canvas.width - 100);

    // 3. Set all visual nodes to unevaluated/hidden
    resetVisualState(visualTree);

    draw();

    // Auto-play or wait for step?
    // Original had "Step" button.
}

function resetVisualState(node: VisualTreeNode) {
    // Keep leaf values if we want? Original assigned random leaf values initially.
    // Minimax computes internal values.
    // We hide internal values and evaluated flag.
    if (node.children.length > 0) {
        node.evaluated = false;
        node.value = null; // Hide computed value
        node.bestChild = false;
        node.children.forEach(resetVisualState);
    } else {
        // Leaf
        node.evaluated = false; // Initially false in animation until visited?
        // Original: leaf nodes show value but strictly `evaluated` flag might be used for color.
        // Let's assume leaves are visible but "active" when visited.
    }
}

function handleStep() {
    if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep];
        const visualNode = findVisualNode(visualTree, step.nodeId);

        if (visualNode) {
            visualNode.evaluated = true;
            visualNode.value = step.value;

            // If it's a parent, also highlight the edge to best child?
            // The engine sets `bestChild` on the child node.
            // We need to sync that from the logical tree or step data?
            // `step` only has id and value.
            // But we already ran minimax on `appState.tree`, so the logical nodes have `bestChild` set correctly for the final state.
            // We can copy that property when we reveal.
            if (visualNode.children.length > 0) {
                // Find logical node
                const logicalNode = findLogicalNode(appState.tree!, step.nodeId);
                if (logicalNode && logicalNode.selectedChildId) {
                    const child = visualNode.children.find(c => c.id === logicalNode.selectedChildId);
                    if (child) child.bestChild = true;
                }
            }
        }

        currentStep++;
        draw();

        // Stats
        evaluatedCountEl.textContent = currentStep.toString();

        // Check if root finished
        if (visualTree && visualTree.evaluated) {
            updateStatsDisplay();
        }
    }
}

function findVisualNode(root: VisualTreeNode | null, id: string): VisualTreeNode | null {
    if (!root) return null;
    if (root.id === id) return root;
    for (const child of root.children) {
        const found = findVisualNode(child, id);
        if (found) return found;
    }
    return null;
}

function findLogicalNode(root: TreeNode, id: string): TreeNode | null {
    if (root.id === id) return root;
    for (const child of root.children) {
        const found = findLogicalNode(child, id);
        if (found) return found;
    }
    return null;
}

function cancelAnimation() {
    currentStep = 0;
    animationSteps = [];
}

function handleReset() {
    cancelAnimation();
    appState.tree = null;
    visualTree = null;
    resetStats();
    draw();
}

function resetStats() {
    evaluatedCountEl.textContent = '0';
    appState.evaluatedCount = 0;
    bestMoveEl.textContent = '-';
    bestValueEl.textContent = '-';
    nodesCountEl.textContent = appState.tree ? countNodes(appState.tree).toString() : '0';
}

function updateStatsDisplay() {
    nodesCountEl.textContent = appState.tree ? countNodes(appState.tree).toString() : '0';

    if (visualTree && visualTree.evaluated && visualTree.children.length > 0) {
        const bestChild = visualTree.children.find(c => c.bestChild);
        if (bestChild) {
            const index = visualTree.children.indexOf(bestChild);
            bestMoveEl.textContent = `Child ${index + 1}`;
            bestValueEl.textContent = visualTree.value?.toString() || '-';
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!visualTree) return;
    drawNode(visualTree);
}

function drawNode(node: VisualTreeNode) {
    // Draw edges
    node.children.forEach(child => {
        ctx.strokeStyle = child.bestChild ? '#4CAF50' : '#ccc';
        ctx.lineWidth = child.bestChild ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(child.x, child.y);
        ctx.stroke();

        drawNode(child);
    });

    // Draw node circle
    const radius = 25;
    ctx.fillStyle = node.isMax ? '#2196F3' : '#f44336';
    ctx.globalAlpha = node.evaluated || (node.children.length === 0) ? 1 : 0.3;
    // Note: leaves (children=0) should be visible always? 
    // Or only when evaluated? minimax hits leaves first.
    // Original: "Leaf node - assign random value... node.evaluated = false"
    // "minimax... if leaf... node.evaluated = true"
    // So leaves should be dim until visited?
    // Original `drawNode`: `ctx.globalAlpha = node.evaluated ? 1 : 0.3;`

    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw value
    if (node.value !== null && node.evaluated) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.value.toString(), node.x, node.y);
    } else if (node.children.length === 0 && !node.evaluated) {
        // Show leaf values even if not "evaluated" (processing wise) 
        // OR wait until step?
        // Original: `if (node.value !== null)` -- leaves always have value.
        // So leaves show value always in original.
        // Let's mimic original:
        if (node.children.length === 0 && node.value !== null) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.value.toString(), node.x, node.y);
        }
    }

    // Label
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText(node.isMax ? 'MAX' : 'MIN', node.x, node.y + radius + 15);
}

init();
