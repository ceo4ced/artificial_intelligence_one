
export interface Sentence {
    text: string;
    answer: string;
    options: string[];
}

export interface GameState {
    sentences: Sentence[];
    currentIndex: number;
    correctCount: number;
    totalCount: number;
    streak: number;
    score: number;
    currentSentence: Sentence | null;
}

export const INITIAL_SENTENCES: Sentence[] = [
    { text: "The cat sat on the", answer: "mat", options: ["mat", "sky", "ocean", "bicycle"] },
    { text: "I love eating ice", answer: "cream", options: ["cream", "rocks", "clouds", "metal"] },
    { text: "The sun rises in the", answer: "east", options: ["west", "east", "north", "ocean"] },
    { text: "She went to the store to buy", answer: "groceries", options: ["groceries", "mountains", "clouds", "planets"] },
    { text: "The dog wagged its", answer: "tail", options: ["tail", "breakfast", "computer", "ocean"] },
    { text: "Birds fly in the", answer: "sky", options: ["ground", "sky", "water", "fire"] },
    { text: "He drinks a glass of", answer: "water", options: ["water", "chairs", "books", "clouds"] },
    { text: "The moon shines at", answer: "night", options: ["noon", "breakfast", "lunch", "night"] },
    { text: "Students go to", answer: "school", options: ["mars", "ocean", "school", "space"] },
    { text: "Fish swim in the", answer: "water", options: ["sky", "desert", "water", "volcano"] },
    { text: "I write with a", answer: "pen", options: ["elephant", "pen", "cloud", "mountain"] },
    { text: "Trees grow in the", answer: "forest", options: ["ocean", "sky", "forest", "moon"] },
    { text: "She plays the", answer: "piano", options: ["sandwich", "piano", "ocean", "cloud"] },
    { text: "Cars drive on the", answer: "road", options: ["ocean", "sky", "road", "moon"] },
    { text: "We sleep in a", answer: "bed", options: ["tree", "ocean", "cloud", "bed"] }
];

export const INITIAL_STATE: GameState = {
    sentences: [],
    currentIndex: 0,
    correctCount: 0,
    totalCount: 0,
    streak: 0,
    score: 0,
    currentSentence: null
};

export function shuffle<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
}

export function initGame(): GameState {
    const sentences = shuffle([...INITIAL_SENTENCES]);
    return {
        ...INITIAL_STATE,
        sentences
    };
}

export function getNextSentence(state: GameState): GameState {
    let nextIndex = state.currentIndex;
    let nextSentences = state.sentences;

    if (nextIndex >= nextSentences.length) {
        nextIndex = 0;
        nextSentences = shuffle([...INITIAL_SENTENCES]);
    }

    return {
        ...state,
        currentIndex: nextIndex + 1,
        sentences: nextSentences,
        currentSentence: nextSentences[nextIndex]
    };
}

export function checkPrediction(state: GameState, selected: string, correct: string): { newState: GameState, points: number, isCorrect: boolean } {
    const isCorrect = selected === correct;
    let newStreak = isCorrect ? state.streak + 1 : 0;
    let points = 0;

    if (isCorrect) {
        points = 10 + (newStreak > 2 ? 5 : 0);
    }

    const newState = {
        ...state,
        totalCount: state.totalCount + 1,
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        streak: newStreak,
        score: state.score + points
    };

    return { newState, points, isCorrect };
}
