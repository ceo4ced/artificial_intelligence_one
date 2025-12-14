
export type Difficulty = 'easy' | 'medium' | 'hard';
export type PatternType = 'circle' | 'grid' | 'wave' | 'dots';

export interface GameState {
    gameActive: boolean;
    difficulty: Difficulty;
    currentAnswer: 'real' | 'fake' | null;
    score: number;
    correct: number;
    wrong: number;
    round: number;
    timeLeft: number;
    answered: boolean;
    currentPatternParams: PatternParams | null;
}

export type Artifacts = {
    x?: number;
    y?: number;
    radius?: number;
};

export interface PatternParams {
    type: PatternType;
    isReal: boolean;
    artifacts: Artifacts[]; // Array of artifact values for elements
    seed: number; // For consistency if needed
}

export const INITIAL_STATE: GameState = {
    gameActive: false,
    difficulty: 'medium',
    currentAnswer: null,
    score: 0,
    correct: 0,
    wrong: 0,
    round: 0,
    timeLeft: 60,
    answered: false,
    currentPatternParams: null
};

// Pure Functions

export function startGameState(difficulty: Difficulty = 'medium'): GameState {
    return {
        ...INITIAL_STATE,
        gameActive: true,
        difficulty,
        timeLeft: 60
    };
}

export function generatePatternParams(isReal: boolean, difficulty: Difficulty): PatternParams {
    const types: PatternType[] = ['circle', 'grid', 'wave', 'dots'];
    const type = types[Math.floor(Math.random() * types.length)];

    // Generate artifact values based on difficulty
    // We generate a large enough pool of artifacts for any pattern type
    // e.g. Grid uses up to 60 (10x6), Dots uses 112 (14x8), etc.
    // Let's generate 200 artifacts to be safe and generic.
    const artifacts: Artifacts[] = [];

    for (let i = 0; i < 200; i++) {
        let ax = 0, ay = 0, ar = 0;

        if (!isReal) {
            if (difficulty === 'easy') {
                // Large deviations
                // Circle/Grid/Dots logic combined approximately
                ax = Math.random() * 40 - 20;
                ay = Math.random() * 40 - 20;
                ar = Math.random() * 6 - 3;
            } else if (difficulty === 'medium') {
                ax = Math.random() * 15 - 7.5;
                ay = Math.random() * 15 - 7.5;
                ar = Math.random() * 3 - 1.5;
            } else { // Hard
                ax = Math.random() * 5 - 2.5;
                ay = Math.random() * 5 - 2.5;
                ar = Math.random() * 1 - 0.5;
            }

            // Grid logic had specific probability checks (0.7, 0.8, 0.9)
            // We can bake likelihood into the values or store "shouldApply" boolean
            // Let's zero them out if they fail the probability check, to make rendering pure.
            // But 'type' isn't known inside the loop properly if we want specific logic per type.
            // Refinement: We know the type outside.

            if (type === 'grid') {
                let threshold = 0;
                if (difficulty === 'easy') threshold = 0.7;
                else if (difficulty === 'medium') threshold = 0.8;
                else threshold = 0.9;

                if (Math.random() <= threshold) {
                    ax = 0; ay = 0; ar = 0;
                }
            }
        }

        artifacts.push({ x: ax, y: ay, radius: ar });
    }

    return {
        type,
        isReal,
        artifacts,
        seed: Math.random()
    };
}

export function nextRoundState(currentState: GameState): GameState {
    if (!currentState.gameActive) return currentState;

    const isReal = Math.random() > 0.5;
    const params = generatePatternParams(isReal, currentState.difficulty);

    return {
        ...currentState,
        round: currentState.round + 1,
        answered: false,
        currentAnswer: isReal ? 'real' : 'fake',
        currentPatternParams: params
    };
}

export function processChoice(state: GameState, choice: 'real' | 'fake'): GameState {
    if (!state.gameActive || state.answered) return state;

    const isCorrect = choice === state.currentAnswer;

    return {
        ...state,
        answered: true,
        score: state.score + (isCorrect ? 10 : 0),
        correct: state.correct + (isCorrect ? 1 : 0),
        wrong: state.wrong + (isCorrect ? 0 : 1)
    };
}

export function tickTimer(state: GameState): GameState {
    if (!state.gameActive) return state;

    const newTime = state.timeLeft - 1;
    const active = newTime > 0;

    return {
        ...state,
        timeLeft: newTime,
        gameActive: active
    };
}
