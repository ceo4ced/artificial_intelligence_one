
export interface Question {
    target: number;
    answer: number;
    explanation: string;
}

export interface Sentence {
    text: string[];
    questions: Question[];
}

export interface GameState {
    sentences: Sentence[];
    currentQuestionIndex: number; // Global index across all questions
    score: number;
    correctCount: number;
    wrongCount: number;
    streak: number;
    gameActive: boolean;
    answered: boolean;
}

export const SENTENCES: Sentence[] = [
    {
        text: ['The', 'cat', 'sat', 'on', 'the', 'mat'],
        questions: [
            { target: 1, answer: 2, explanation: '"cat" should attend to "sat" (what did the cat do?)' },
            { target: 2, answer: 5, explanation: '"sat" should attend to "mat" (where did it sit?)' }
        ]
    },
    {
        text: ['She', 'loves', 'her', 'beautiful', 'garden'],
        questions: [
            { target: 2, answer: 0, explanation: '"her" should attend to "She" (whose garden?)' },
            { target: 3, answer: 4, explanation: '"beautiful" should attend to "garden" (what is beautiful?)' }
        ]
    },
    {
        text: ['The', 'dog', 'chased', 'its', 'tail'],
        questions: [
            { target: 2, answer: 1, explanation: '"chased" should attend to "dog" (who chased?)' },
            { target: 3, answer: 1, explanation: '"its" should attend to "dog" (whose tail?)' }
        ]
    },
    {
        text: ['John', 'gave', 'Mary', 'his', 'book'],
        questions: [
            { target: 3, answer: 0, explanation: '"his" should attend to "John" (whose book?)' },
            { target: 1, answer: 2, explanation: '"gave" should attend to "Mary" (gave to whom?)' }
        ]
    },
    {
        text: ['The', 'teacher', 'explained', 'the', 'complex', 'topic'],
        questions: [
            { target: 2, answer: 5, explanation: '"explained" should attend to "topic" (explained what?)' },
            { target: 4, answer: 5, explanation: '"complex" should attend to "topic" (what is complex?)' }
        ]
    },
    {
        text: ['She', 'quickly', 'solved', 'the', 'difficult', 'puzzle'],
        questions: [
            { target: 1, answer: 2, explanation: '"quickly" should attend to "solved" (how did she solve?)' },
            { target: 4, answer: 5, explanation: '"difficult" should attend to "puzzle" (what is difficult?)' }
        ]
    },
    {
        text: ['The', 'red', 'car', 'stopped', 'at', 'the', 'light'],
        questions: [
            { target: 1, answer: 2, explanation: '"red" should attend to "car" (what is red?)' },
            { target: 3, answer: 6, explanation: '"stopped" should attend to "light" (stopped where?)' }
        ]
    },
    {
        text: ['Birds', 'fly', 'south', 'during', 'winter'],
        questions: [
            { target: 1, answer: 0, explanation: '"fly" should attend to "Birds" (who flies?)' },
            { target: 2, answer: 1, explanation: '"south" should attend to "fly" (fly where?)' }
        ]
    }
];

export const INITIAL_STATE: GameState = {
    sentences: SENTENCES,
    currentQuestionIndex: 0,
    score: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    gameActive: false,
    answered: false
};


export function startGame(): GameState {
    return {
        ...INITIAL_STATE,
        gameActive: true
    };
}

export function checkAnswer(state: GameState, selectedIdx: number): { newState: GameState, isCorrect: boolean, points: number, explanation: string } {
    if (state.answered || !state.gameActive) {
        return { newState: state, isCorrect: false, points: 0, explanation: "" };
    }

    const totalQuestions = state.sentences.length * 2;
    if (state.currentQuestionIndex >= totalQuestions) {
        return { newState: state, isCorrect: false, points: 0, explanation: "" };
    }

    const sentenceIdx = Math.floor(state.currentQuestionIndex / 2);
    const questionIdx = state.currentQuestionIndex % 2;
    const currentSentence = state.sentences[sentenceIdx];
    const currentQuestion = currentSentence.questions[questionIdx];

    const isCorrect = selectedIdx === currentQuestion.answer;
    let points = 0;

    let newState = { ...state, answered: true };

    if (isCorrect) {
        newState.correctCount++;
        newState.streak++;
        points = 10 + (newState.streak >= 3 ? 5 : 0);
        newState.score += points;
    } else {
        newState.wrongCount++;
        newState.streak = 0;
    }

    return { newState, isCorrect, points, explanation: currentQuestion.explanation };
}

export function nextQuestion(state: GameState): GameState {
    const totalQuestions = state.sentences.length * 2;
    if (state.currentQuestionIndex >= totalQuestions) {
        return { ...state, gameActive: false };
    }

    return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        answered: false
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
