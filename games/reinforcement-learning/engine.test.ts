
import { describe, it, expect } from 'vitest';
import {
    initializeLevel, updateGridCell, getNextState, getReward
} from './engine.js';

describe('RL Game Engine', () => {
    it('should initialize level', () => {
        const state = initializeLevel(0);
        expect(state).not.toBeNull();
        if (state) {
            expect(state.config.size).toBe(5);
            expect(state.grid.length).toBe(5);
        }
    });

    it('should update grid cell', () => {
        const state = initializeLevel(0);
        if (!state) throw new Error("State init failed");

        const newState = updateGridCell(state, 1, 1, 'reward');
        expect(newState.grid[1][1]).toBe(10);

        const resetState = updateGridCell(newState, 1, 1, 'reward');
        expect(resetState.grid[1][1]).toBe(0);
    });

    it('should calculate next state', () => {
        const state = initializeLevel(0);
        if (!state) throw new Error("State init failed");

        // Move right from 0,0
        const [nr, nc] = getNextState(0, 0, 'right', 5, state.grid);
        expect(nr).toBe(0);
        expect(nc).toBe(1);

        // Hit wall/bounds
        const [nr2, nc2] = getNextState(0, 0, 'up', 5, state.grid);
        expect(nr2).toBe(0);
        expect(nc2).toBe(0);
    });

    it('should calculate reward', () => {
        const state = initializeLevel(0);
        if (!state) throw new Error("State init failed");

        const r1 = getReward(0, 0, state.grid, state.config.goal);
        expect(r1).toBe(-1); // Default step cost

        const r2 = getReward(4, 4, state.grid, state.config.goal);
        expect(r2).toBe(100); // Goal
    });
});
