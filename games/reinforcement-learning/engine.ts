
export type CellType = 0 | 10 | -10 | -999; // Empty, Reward, Penalty, Obstacle
export type Action = 'up' | 'down' | 'left' | 'right';
export const ACTIONS: Action[] = ['up', 'down', 'left', 'right'];

export interface LevelConfig {
    title: string;
    size: number;
    start: [number, number];
    goal: [number, number];
    obstacles: [number, number][];
    description: string;
}

export interface QValues {
    up: number;
    down: number;
    left: number;
    right: number;
}

export interface QTable {
    [key: string]: QValues;
}

export interface RLState {
    currentLevelIndex: number;
    grid: CellType[][];
    qTable: QTable;
    agentPosition: [number, number] | null;
    score: number;
    episode: number;
    successes: number;
    totalSteps: number;
    isTraining: boolean;
    config: LevelConfig;
}

export const LEVELS: LevelConfig[] = [
    {
        title: "Level 1: Simple Path",
        size: 5,
        start: [0, 0],
        goal: [4, 4],
        obstacles: [[2, 2]],
        description: "Learn to navigate to the goal while avoiding an obstacle."
    },
    {
        title: "Level 2: The Choice",
        size: 5,
        start: [0, 2],
        goal: [4, 2],
        obstacles: [[2, 1], [2, 3]],
        description: "Two paths available - which will the agent prefer?"
    },
    {
        title: "Level 3: Risky Reward",
        size: 6,
        start: [0, 0],
        goal: [5, 5],
        obstacles: [[2, 1], [2, 2], [2, 3], [3, 3]],
        description: "Place rewards to guide the agent around obstacles."
    },
    {
        title: "Level 4: Complex Maze",
        size: 7,
        start: [0, 0],
        goal: [6, 6],
        obstacles: [[1, 2], [2, 2], [3, 2], [4, 4], [5, 4]],
        description: "A more complex environment - careful reward placement matters!"
    }
];

export const HYPERPARAMS = {
    LEARNING_RATE: 0.1,
    DISCOUNT_FACTOR: 0.9,
    EPSILON: 0.1
};

// Pure Functions

export function initializeLevel(levelIndex: number): RLState | null {
    if (levelIndex >= LEVELS.length) return null;

    const config = LEVELS[levelIndex];
    const size = config.size;

    // Grid Setup
    const grid: CellType[][] = Array(size).fill(0).map(() => Array(size).fill(0));
    config.obstacles.forEach(([r, c]) => {
        grid[r][c] = -999;
    });

    // QTable Setup
    const qTable: QTable = {};
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            qTable[`${r},${c}`] = { up: 0, down: 0, left: 0, right: 0 };
        }
    }

    return {
        currentLevelIndex: levelIndex,
        grid,
        qTable,
        agentPosition: null, // Agent doesn't exist on grid until episode starts/visualization
        score: 0,
        episode: 0,
        successes: 0,
        totalSteps: 0,
        isTraining: false,
        config
    };
}

export function updateGridCell(state: RLState, r: number, c: number, tool: 'reward' | 'penalty' | 'obstacle' | 'clear'): RLState {
    // Check immutable bounds (start/goal)
    const { start, goal } = state.config;
    if ((r === start[0] && c === start[1]) || (r === goal[0] && c === goal[1])) {
        return state;
    }

    const newGrid = state.grid.map(row => [...row]);

    if (tool === 'reward') {
        newGrid[r][c] = (newGrid[r][c] === 10) ? 0 : 10;
    } else if (tool === 'penalty') {
        newGrid[r][c] = (newGrid[r][c] === -10) ? 0 : -10;
    } else if (tool === 'obstacle') {
        newGrid[r][c] = (newGrid[r][c] === -999) ? 0 : -999;
    } else if (tool === 'clear') {
        // Only clear if it's not a verified level obstacle (or allow user to clear those? original code allows clearing any -999 unless it checked bounds strictly)
        // Original logic: "if (grid[r][c] !== -999 || !level.obstacles.some...)"
        // Let's allow clearing user placed items.
        // If it's a default obstacle, we generally shouldn't allow clearing it if we want to preserve level design, but original code allowed it if conditions met.
        // Simplifying: Clear sets to 0.
        newGrid[r][c] = 0;
    }

    return { ...state, grid: newGrid };
}

export function getNextState(r: number, c: number, action: Action, size: number, grid: CellType[][]): [number, number] {
    let nr = r;
    let nc = c;

    if (action === 'up') nr--;
    else if (action === 'down') nr++;
    else if (action === 'left') nc--;
    else if (action === 'right') nc++;

    // Bounds and Obstacle Check
    if (nr < 0 || nr >= size || nc < 0 || nc >= size || grid[nr][nc] === -999) {
        return [r, c];
    }
    return [nr, nc];
}

export function getReward(r: number, c: number, grid: CellType[][], goal: [number, number]): number {
    if (r === goal[0] && c === goal[1]) return 100;
    return grid[r][c] || -1; // -1 step penalty
}

export function selectAction(r: number, c: number, qTable: QTable, epsilon: number): Action {
    if (Math.random() < epsilon) {
        return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    } else {
        const key = `${r},${c}`;
        const values = qTable[key];
        // Argmax
        let bestActions: Action[] = [];
        let maxVal = -Infinity;

        for (const action of ACTIONS) {
            if (values[action] > maxVal) {
                maxVal = values[action];
                bestActions = [action];
            } else if (values[action] === maxVal) {
                bestActions.push(action);
            }
        }
        return bestActions[Math.floor(Math.random() * bestActions.length)];
    }
}

export function trainEpisodeStep(
    currentState: [number, number],
    qTable: QTable,
    grid: CellType[][],
    config: LevelConfig
): { nextState: [number, number], reward: number, action: Action, done: boolean, nextQTable: QTable } {

    const [r, c] = currentState;
    const action = selectAction(r, c, qTable, HYPERPARAMS.EPSILON);
    const nextPos = getNextState(r, c, action, config.size, grid);
    const [nr, nc] = nextPos;

    const reward = getReward(nr, nc, grid, config.goal);

    const done = (nr === config.goal[0] && nc === config.goal[1]);

    // Q Update
    const key = `${r},${c}`;
    const nextKey = `${nr},${nc}`;

    const currentQ = qTable[key][action];
    const nextValues = qTable[nextKey];
    const maxNextQ = Math.max(nextValues.up, nextValues.down, nextValues.left, nextValues.right);

    const newQ = currentQ + HYPERPARAMS.LEARNING_RATE * (reward + HYPERPARAMS.DISCOUNT_FACTOR * maxNextQ - currentQ);

    // Immutable update of QTable
    // Ideally we clone the whole table, but for performance in a tight loop we often mutate a draft. 
    // Here we will clone the specific node object to be somewhat safe.
    const newQTable = { ...qTable, [key]: { ...qTable[key], [action]: newQ } };

    return {
        nextState: nextPos,
        reward,
        action,
        done,
        nextQTable: newQTable
    };
}
