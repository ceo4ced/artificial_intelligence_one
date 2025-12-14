
import { describe, it, expect } from 'vitest';
import { generateDataset, calculateStats } from './engine.js';

describe('AI Bias Engine (Functional Core)', () => {

    it('should generate balanced dataset correctly', () => {
        const data = generateDataset('balanced');

        expect(data.type).toBe('balanced');
        expect(data.groupA.length).toBe(50);
        expect(data.groupB.length).toBe(50);

        // Sanity check data structure
        expect(data.groupA[0]).toHaveProperty('x');
        expect(data.groupA[0]).toHaveProperty('y');
        expect(data.groupA[0].group).toBe('A');
    });

    it('should generate biased dataset correctly', () => {
        const data = generateDataset('biased');

        expect(data.type).toBe('biased');
        expect(data.groupA.length).toBe(80); // Over-represented
        expect(data.groupB.length).toBe(20); // Under-represented
    });

    it('should calculate stats for balanced data', () => {
        const data = generateDataset('balanced');
        const stats = calculateStats(data);

        expect(stats.groupAAccuracy).toBe(0.92);
        expect(stats.groupBAccuracy).toBe(0.90);
        expect(stats.disparity).toBeLessThan(0.05);
    });

    it('should calculate stats for biased data', () => {
        const data = generateDataset('biased');
        const stats = calculateStats(data);

        expect(stats.groupAAccuracy).toBe(0.93);
        expect(stats.groupBAccuracy).toBe(0.64); // Significant drop
        expect(stats.disparity).toBeGreaterThan(0.20);
    });
});
