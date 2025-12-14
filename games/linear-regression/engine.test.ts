
import { describe, it, expect } from 'vitest';
import {
    calculateRegression, generateStockData, startNewRound, checkPrediction,
    INITIAL_STATE, Point
} from './engine.js';

describe('Linear Regression Engine', () => {

    it('should calculate regression correctly for perfect line', () => {
        // y = 2x + 10
        const data: Point[] = [
            { day: 1, price: 12 },
            { day: 2, price: 14 },
            { day: 3, price: 16 }
        ];

        const result = calculateRegression(data);
        expect(result.slope).toBeCloseTo(2);
        expect(result.intercept).toBeCloseTo(10);
        expect(result.day11Price).toBeCloseTo(2 * 11 + 10);
    });

    it('should generate valid stock data', () => {
        const data = generateStockData('TECH', 'easy');
        expect(data.length).toBe(10);
        data.forEach(p => {
            expect(p.day).toBeGreaterThan(0);
            expect(p.price).toBeGreaterThan(0);
        });
    });

    it('should start a new round immutably', () => {
        const state = startNewRound(INITIAL_STATE);
        expect(state.round).toBe(2);
        expect(state.stockData.length).toBe(10);
        expect(state.currentStock).toBe('TECH');

        // Change stock
        const s2 = startNewRound(state, 'ENERGY');
        expect(s2.currentStock).toBe('ENERGY');
        expect(s2.round).toBe(3);
    });

    it('should score predictions correctly', () => {
        const state = startNewRound(INITIAL_STATE);
        const actual = state.lastRegression.day11Price;

        // Perfect shot
        const r1 = checkPrediction(state, actual);
        expect(r1.score).toBe(1000);
        expect(r1.accuracy).toBe(100);

        // Bad shot (50% error)
        const badVal = actual * 1.5;
        const r2 = checkPrediction(state, badVal);
        expect(r2.accuracy).toBeCloseTo(50);
        expect(r2.score).toBeLessThan(1000);
    });
});
