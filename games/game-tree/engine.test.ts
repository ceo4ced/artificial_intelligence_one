
import { describe, it, expect } from 'vitest';
import { createTree, runMinimax, countNodes, resetEvaluation } from './engine.js';

describe('Game Tree Engine', () => {
    it('should create a tree of correct depth and branching', () => {
        const depth = 2;
        const branchResult = 2;
        const tree = createTree(depth, branchResult);

        // Root (L0) -> 2 children (L1) -> 2 children each (L2) -> 4 leaves
        // Total = 1 + 2 + 4 = 7
        expect(countNodes(tree)).toBe(7);
        expect(tree.children).toHaveLength(2);
        expect(tree.children[0].children).toHaveLength(2);
        expect(tree.children[0].children[0].children).toHaveLength(0);
    });

    it('should run minimax correctly', () => {
        // Create simple tree: Root (MAX) -> [Child1 (MIN), Child2 (MIN)]
        // Child1 -> [Leaf A (5), Leaf B (10)] -> Min is 5
        // Child2 -> [Leaf C (2), Leaf D (8)] -> Min is 2
        // Root -> Max(5, 2) -> 5

        const tree = createTree(2, 2);

        // Force values
        // Level 2 (Leaves)
        const child1 = tree.children[0]; // MIN
        child1.children[0].value = 5;
        child1.children[1].value = 10;

        const child2 = tree.children[1]; // MIN
        child2.children[0].value = 2;
        child2.children[1].value = 8;

        const result = runMinimax(tree);

        expect(result.finalValue).toBe(5);
        expect(tree.evaluated).toBe(true);
        expect(tree.value).toBe(5);

        // Check best child selected
        // Child 1 (value 5) > Child 2 (value 2) for Root (MAX)
        expect(tree.children[0].bestChild).toBe(true);
        expect(tree.children[1].bestChild).toBe(false);
    });

    it('should reset evaluation', () => {
        const tree = createTree(2, 2);
        runMinimax(tree);
        expect(tree.evaluated).toBe(true);

        resetEvaluation(tree);
        expect(tree.evaluated).toBe(false);
        expect(tree.children[0].evaluated).toBe(false);
    });
});
