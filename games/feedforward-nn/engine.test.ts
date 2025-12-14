
import { describe, it, expect } from 'vitest';
import {
    generateData, predictClass, calculateSimulationResult, calculateTestScore,
    DATASET_CONFIG
} from './engine.js';

describe('Feedforward NN Engine', () => {
    it('should generate data points', () => {
        const { training, test } = generateData('xor', 100);
        expect(training).toHaveLength(75);
        expect(test).toHaveLength(25);
        expect(training[0]).toHaveProperty('x');
        expect(training[0]).toHaveProperty('y');
        expect(training[0]).toHaveProperty('label');
    });

    it('should predict correct classes for XOR', () => {
        // XOR: (1,1)->0, (-1,-1)->0, (-1,1)->1, (1,-1)->1
        // Note: engine logic: (x>0) !== (y>0) ? 1 : 0
        // (1,1) -> T !== T -> F -> 0
        // (-1,1) -> F !== T -> T -> 1
        expect(predictClass('xor', 0.5, 0.5)).toBe(0);
        expect(predictClass('xor', -0.5, 0.5)).toBe(1);
    });

    it('should calculate simulation accuracy', () => {
        // Sufficient neurons
        const result = calculateSimulationResult('xor', [2, 10, 2]);
        expect(result.accuracy).toBeGreaterThan(50);
        expect(result.epochs).toBeGreaterThan(0);
    });

    it('should calculate test score success', () => {
        const target = DATASET_CONFIG['xor'].target; // 95
        const result = calculateTestScore('xor', [2, 4, 2], 98); // High training acc
        // test acc = 98 - random(0-5) -> 93-98.
        // If it falls below 95, success is false.
        // We can't guarantee true because of random, but we can check logic structure.

        if (result.testAccuracy >= target) {
            expect(result.success).toBe(true);
            expect(result.scoreIncrement).toBeGreaterThan(0);
        } else {
            expect(result.success).toBe(false);
            expect(result.scoreIncrement).toBe(0);
        }
    });
});
