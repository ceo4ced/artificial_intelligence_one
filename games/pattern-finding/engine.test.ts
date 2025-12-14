
import { describe, it, expect } from 'vitest';
import {
    generatePoints, computeKMeans, calculateSimilarityScore
} from './engine.js';

describe('Pattern Finding Engine', () => {
    it('should generate points', () => {
        const points = generatePoints(3, 500, 500);
        expect(points.length).toBeGreaterThan(0);
        expect(points[0].x).toBeDefined();
    });

    it('should compute k-means', () => {
        const points = generatePoints(3, 500, 500);
        const result = computeKMeans(points, 3);

        expect(result.assignments.length).toBe(points.length);
        expect(result.centroids.length).toBe(3);

        // Assert every point is assigned to a cluster 0..2
        result.assignments.forEach(a => {
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThan(3);
        });
    });

    it('should calculate similarity score', () => {
        // If identical
        const score1 = calculateSimilarityScore([0, 0, 1, 1], [0, 0, 1, 1]);
        expect(score1).toBe(100);

        // If completely different groupings (though indices match)
        // [0,0,1,1] means {0,1} are together, {2,3} are together.
        // [1,1,0,0] means {0,1} are together, {2,3} are together.
        // Similarity should be 100 actually because grouping structure is same even if labels swapped.
        const score2 = calculateSimilarityScore([0, 0, 1, 1], [1, 1, 0, 0]);
        // Pairs: (0,1) same=true/true. (0,2) diff=true/true. (2,3) same=true/true.
        // Indeed, pure pairwise comparisons ignore label values.
        expect(score2).toBe(100);

        // Different structure
        // [0,0,1,1] pairs: (0,1) same. 
        // [0,1,0,1] pairs: (0,1) diff. 
        const score3 = calculateSimilarityScore([0, 0, 1, 1], [0, 1, 0, 1]);
        expect(score3).toBeLessThan(100);
    });
});
