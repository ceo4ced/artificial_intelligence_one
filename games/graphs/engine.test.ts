
import { describe, it, expect } from 'vitest';
import {
    computeAnswer, GraphNode, GraphEdge
} from './engine.js';

describe('Graph Algorithms', () => {
    // Mock data
    const nodes: GraphNode[] = [
        { id: 0, x: 0, y: 0, label: 'A', radius: 10 },
        { id: 1, x: 0, y: 0, label: 'B', radius: 10 },
        { id: 2, x: 0, y: 0, label: 'C', radius: 10 }
    ];

    it('should count nodes', () => {
        const q = { type: 'count-nodes', text: '', answer: '' };
        expect(computeAnswer(q, nodes, [])).toBe('3');
    });

    it('should count edges', () => {
        const edges: GraphEdge[] = [
            { from: 0, to: 1, weight: null, directed: false },
            { from: 1, to: 2, weight: null, directed: false }
        ];
        const q = { type: 'count-edges', text: '', answer: '' };
        expect(computeAnswer(q, nodes, edges)).toBe('2');
    });

    it('should sum weights', () => {
        const edges: GraphEdge[] = [
            { from: 0, to: 1, weight: 5, directed: false },
            { from: 1, to: 2, weight: 10, directed: false }
        ];
        const q = { type: 'sum-weights', text: '', answer: '' };
        expect(computeAnswer(q, nodes, edges)).toBe('15');
    });

    it('should find most connected node (max degree)', () => {
        // A-B, B-C. B has degree 2. A:1, C:1.
        const edges: GraphEdge[] = [
            { from: 0, to: 1, weight: null, directed: false },
            { from: 1, to: 2, weight: null, directed: false }
        ];
        const q = { type: 'most-connected', text: '', answer: '' };
        expect(computeAnswer(q, nodes, edges)).toBe('b');
    });

    it('should detect cycles in directed graph', () => {
        // A -> B -> C -> A (cycle)
        const edges: GraphEdge[] = [
            { from: 0, to: 1, weight: null, directed: true },
            { from: 1, to: 2, weight: null, directed: true },
            { from: 2, to: 0, weight: null, directed: true }
        ];
        const q = { type: 'has-cycle', text: '', answer: '' };
        expect(computeAnswer(q, nodes, edges)).toBe('yes');
    });

    it('should NOT detect cycles in directed acyclic graph', () => {
        // A -> B -> C
        const edges: GraphEdge[] = [
            { from: 0, to: 1, weight: null, directed: true },
            { from: 1, to: 2, weight: null, directed: true }
        ];
        const q = { type: 'has-cycle', text: '', answer: '' };
        expect(computeAnswer(q, nodes, edges)).toBe('no');
    });
});
