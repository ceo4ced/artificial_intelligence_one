
export interface Pattern {
    type: string;
    name: string;
    filter: string;
}

export interface GameState {
    score: number;
    correct: number;
    wrong: number;
    streak: number;
    timeLeft: number;
    isActive: boolean;
    currentPattern: Pattern | null;
}

export const INITIAL_STATE: GameState = {
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    timeLeft: 60,
    isActive: false,
    currentPattern: null
};

export const PATTERNS: Pattern[] = [
    { type: 'vertical', name: 'Vertical Lines', filter: 'vertical' },
    { type: 'horizontal', name: 'Horizontal Lines', filter: 'horizontal' },
    { type: 'diagonal', name: 'Diagonal Lines', filter: 'vertical' },
    { type: 'checkerboard', name: 'Checkerboard', filter: 'sharpen' },
    { type: 'noise', name: 'Noisy Image', filter: 'blur' },
    { type: 'grid', name: 'Grid Pattern', filter: 'sharpen' }
];

export function checkAnswer(
    state: GameState,
    selectedFilter: string
): { newState: GameState; isCorrect: boolean; points: number } {
    if (!state.currentPattern) {
        return { newState: state, isCorrect: false, points: 0 };
    }

    const isCorrect = selectedFilter === state.currentPattern.filter;
    let points = 0;

    let newScore = state.score;
    let newCorrect = state.correct;
    let newWrong = state.wrong;
    let newStreak = state.streak;

    if (isCorrect) {
        newCorrect++;
        newStreak++;
        points = 10 + (newStreak >= 3 ? 5 : 0);
        newScore += points;
    } else {
        newWrong++;
        newStreak = 0;
    }

    return {
        newState: {
            ...state,
            score: newScore,
            correct: newCorrect,
            wrong: newWrong,
            streak: newStreak
        },
        isCorrect,
        points
    };
}

export function getRandomPattern(): Pattern {
    return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
}

export function calculateAccuracy(correct: number, wrong: number): number {
    const total = correct + wrong;
    return total > 0 ? Math.round((correct / total) * 100) : 0;
}
