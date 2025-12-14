
import { describe, it, expect } from 'vitest';
import {
    generateLevelData, calculateScore, pointToLineDistance, classifyPoint
} from './engine.js';

describe('SVM Game Engine', () => {
    it('should generate level data', () => {
        const data = generateLevelData('linear');
        expect(data.dataPoints.length).toBe(40);
        expect(data.solution.type).toBe('vertical');
    });

    it('should classify points correctly', () => {
        // Line from (0,0) to (10,10)
        // Point (5, 0) is "Right/Below", cross product should be negative? 
        // P1(0,0), P2(10,10). Point(5,0).
        // (10-0)*(0-0) - (10-0)*(5-0) = 0 - 50 = -50 -> -1
        const boundary = [{ x: 0, y: 0 }, { x: 10, y: 10 }];
        const p1 = { x: 5, y: 0, label: -1 as const };
        const c1 = classifyPoint(p1, boundary);
        expect(c1).toBe(-1);

        // Point (0, 5) is "Left/Above"
        // (10-0)*(5-0) - (10-0)*(0-0) = 50 -> 1
        const p2 = { x: 0, y: 5, label: 1 as const };
        const c2 = classifyPoint(p2, boundary);
        expect(c2).toBe(1);
    });

    it('should calculate distance correctly', () => {
        const p = { x: 5, y: 5 };
        const start = { x: 0, y: 0 };
        const end = { x: 10, y: 0 };
        // Distance should be 5
        const dist = pointToLineDistance(p, start, end);
        expect(dist).toBeCloseTo(5);
    });

    it('should calculate score', () => {
        // Mock data points
        const points = [
            { x: 5, y: 10, label: 1 as const },
            { x: 5, y: -10, label: -1 as const }
        ];
        // Boundary y=0
        const boundary = [{ x: 0, y: 0 }, { x: 10, y: 0 }];

        const res = calculateScore(boundary, points);
        // Margin is 10. Score = (10/100)*100 = 10? 
        // Check logic: const marginScore = (margin / maxPossibleMargin) * 100;
        expect(res.score).toBeCloseTo(10);
        expect(res.points).toBe(100);
    });
});
