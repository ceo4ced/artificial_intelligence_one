
export interface TreeNode {
    id: string;
    level: number;
    index: number;
    children: TreeNode[];
    value: number | null;
    evaluated: boolean; // For visualization state
    isMax: boolean;
    bestChild: boolean; // If this node is the best child of its parent
    selectedChildId: string | null; // ID of the child selected by this node
}

export interface GameState {
    depth: number;
    branchingFactor: number;
    tree: TreeNode | null;
    evaluatedCount: number;
    evaluationSteps: { nodeId: string, value: number }[];
}

export const INITIAL_STATE: GameState = {
    depth: 3,
    branchingFactor: 2,
    tree: null,
    evaluatedCount: 0,
    evaluationSteps: []
};

export function createTree(depth: number, branchingFactor: number): TreeNode {
    return buildTreeNode(0, 0, depth, branchingFactor);
}

function buildTreeNode(level: number, index: number, maxDepth: number, branchingFactor: number): TreeNode {
    const node: TreeNode = {
        id: `${level}-${index}`,
        level,
        index,
        children: [],
        value: null,
        evaluated: false,
        isMax: level % 2 === 0,
        bestChild: false,
        selectedChildId: null
    };

    if (level < maxDepth) {
        for (let i = 0; i < branchingFactor; i++) {
            const child = buildTreeNode(level + 1, i, maxDepth, branchingFactor);
            node.children.push(child);
        }
    } else {
        // Leaf node
        node.value = Math.floor(Math.random() * 20) - 10;
        node.evaluated = false; // Initially false, evaluated during minimax
    }

    return node;
}

export function runMinimax(root: TreeNode): {
    evaluatedCount: number,
    steps: { nodeId: string, value: number }[],
    finalValue: number
} {
    let count = 0;
    const steps: { nodeId: string, value: number }[] = [];

    function traverse(node: TreeNode): number {
        count++;

        if (node.children.length === 0) {
            node.evaluated = true;
            steps.push({ nodeId: node.id, value: node.value! });
            return node.value!;
        }

        if (node.isMax) {
            let maxValue = -Infinity;
            let bestChildId = null;

            for (const child of node.children) {
                const value = traverse(child);
                if (value > maxValue) {
                    maxValue = value;
                    bestChildId = child.id;
                }
            }

            node.value = maxValue;
            node.evaluated = true;
            node.selectedChildId = bestChildId;

            // Mark best child property
            if (bestChildId) {
                const bestChild = node.children.find(c => c.id === bestChildId);
                if (bestChild) bestChild.bestChild = true;
            }

            steps.push({ nodeId: node.id, value: maxValue });
            return maxValue;
        } else {
            let minValue = Infinity;
            let bestChildId = null;

            for (const child of node.children) {
                const value = traverse(child);
                if (value < minValue) {
                    minValue = value;
                    bestChildId = child.id;
                }
            }

            node.value = minValue;
            node.evaluated = true;
            node.selectedChildId = bestChildId;

            if (bestChildId) {
                const bestChild = node.children.find(c => c.id === bestChildId);
                if (bestChild) bestChild.bestChild = true;
            }

            steps.push({ nodeId: node.id, value: minValue });
            return minValue;
        }
    }

    const finalValue = traverse(root);
    return { evaluatedCount: count, steps, finalValue };
}

export function countNodes(node: TreeNode | null): number {
    if (!node) return 0;
    return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}

// Reset evaluation state for re-running
export function resetEvaluation(node: TreeNode) {
    if (!node) return;
    node.evaluated = false;
    node.bestChild = false;
    node.selectedChildId = null;
    if (node.children.length > 0) {
        node.value = null;
        node.children.forEach(resetEvaluation);
    }
}
