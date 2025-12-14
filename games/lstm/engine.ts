
export interface Color {
    name: string;
    class: string;
    emoji: string;
}

export interface GameState {
    level: number;
    sequenceLength: number;
    score: number;
    correct: number;
    wrong: number;
    streak: number;
    phase: 'ready' | 'showing' | 'input';
    currentSequence: Color[];
}

export const COLORS: Color[] = [
    { name: 'Red', class: 'color-red', emoji: '🔴' },
    { name: 'Blue', class: 'color-blue', emoji: '🔵' },
    { name: 'Green', class: 'color-green', emoji: '🟢' },
    { name: 'Yellow', class: 'color-yellow', emoji: '🟡' },
    { name: 'Purple', class: 'color-purple', emoji: '🟣' },
    { name: 'Orange', class: 'color-orange', emoji: '🟠' }
];

export const INITIAL_STATE: GameState = {
    level: 1,
    sequenceLength: 3,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    phase: 'ready',
    currentSequence: []
};

export function generateSequence(length: number): Color[] {
    const sequence: Color[] = [];
    for (let i = 0; i < length; i++) {
        sequence.push(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    return sequence;
}

export function startRound(state: GameState): GameState {
    return {
        ...state,
        phase: 'showing',
        currentSequence: generateSequence(state.sequenceLength)
    };
}

export function checkAnswer(state: GameState, selectedColor: Color): { newState: GameState, points: number, isCorrect: boolean } {
    if (state.phase !== 'input') {
        return { newState: state, points: 0, isCorrect: false };
    }

    const correctAnswer = state.currentSequence[state.currentSequence.length - 1];
    const isCorrect = selectedColor.name === correctAnswer.name;
    let points = 0;
    let newStreak = 0;

    let newState = { ...state };

    if (isCorrect) {
        newStreak = state.streak + 1;
        points = 10 + (state.level * 5);
        newState.correct++;
        newState.streak = newStreak;
        newState.score += points;

        if (newState.correct % 3 === 0 && newState.sequenceLength < 8) {
            newState.level++;
            newState.sequenceLength++;
        }
    } else {
        newState.wrong++;
        newState.streak = 0;
    }

    return { newState, points, isCorrect };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
