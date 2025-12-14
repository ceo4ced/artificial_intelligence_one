
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface ReviewData {
    text: string;
    sentiment: Sentiment;
}

export interface NLPGameState {
    currentReview: ReviewData | null;
    totalReviews: number;
    correctAnswers: number;
    streak: number;
    score: number;
    trainingProgress: number;
    yourWins: number;
    aiWins: number;
    learnedWords: {
        positive: string[];
        negative: string[];
    };
    isTraining: boolean;
    gameMode: 'training' | 'challenge';
}

export const REVIEWS: Record<Sentiment, string[]> = {
    positive: [
        "This movie was absolutely amazing! Best film I've seen all year!",
        "Excellent service, highly recommend! Will definitely come back.",
        "Love this product! It exceeded all my expectations!",
        "Fantastic experience from start to finish. Couldn't be happier!",
        "Outstanding quality and great value. Five stars!",
        "This is hands down the best purchase I've ever made!",
        "Incredible! Way better than I expected.",
        "Wonderful service, friendly staff, and great atmosphere!",
        "I'm blown away by how good this is!",
        "Perfect! Exactly what I was looking for."
    ],
    negative: [
        "Terrible experience. Would not recommend to anyone.",
        "Awful quality, complete waste of money. Very disappointed.",
        "Worst service ever! Never coming back here again.",
        "Horrible! This is completely unacceptable.",
        "Very poor quality. Broke after one use.",
        "Disappointed and frustrated. Expected much better.",
        "Do not buy this! Total ripoff and terrible product.",
        "Extremely bad experience. Save your money.",
        "Absolutely terrible. Regret this purchase completely.",
        "Horrible customer service and poor quality product."
    ],
    neutral: [
        "The package arrived on Tuesday afternoon.",
        "It's okay. Nothing special but does the job.",
        "Average quality for the price. Not bad, not great.",
        "Received the order as described. Standard shipping.",
        "It works as intended. No complaints, no praise.",
        "Decent product. Met my basic expectations.",
        "The food was alright. Service was standard.",
        "Product arrived in good condition. As advertised.",
        "It's fine. Does what it says on the box.",
        "Acceptable quality. Would consider other options next time."
    ]
};

export const POSITIVE_WORDS = ['amazing', 'excellent', 'love', 'fantastic', 'outstanding', 'best', 'incredible', 'wonderful', 'perfect', 'great', 'highly'];
export const NEGATIVE_WORDS = ['terrible', 'awful', 'worst', 'horrible', 'poor', 'disappointed', 'bad', 'waste', 'unacceptable', 'regret'];

export const INITIAL_STATE: NLPGameState = {
    currentReview: null,
    totalReviews: 0,
    correctAnswers: 0,
    streak: 0,
    score: 0,
    trainingProgress: 0,
    yourWins: 0,
    aiWins: 0,
    learnedWords: { positive: [], negative: [] },
    isTraining: false,
    gameMode: 'training'
};

// Pure Functions

export function getRandomReview(): ReviewData {
    const sentiments: Sentiment[] = ['positive', 'negative', 'neutral'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const list = REVIEWS[randomSentiment];
    const text = list[Math.floor(Math.random() * list.length)];
    return { text, sentiment: randomSentiment };
}

export function processClassification(state: NLPGameState, userChoice: Sentiment): { newState: NLPGameState, correct: boolean } {
    if (!state.currentReview) return { newState: state, correct: false };

    const correct = userChoice === state.currentReview.sentiment;
    let newStreak = correct ? state.streak + 1 : 0;
    let newScore = state.score + (correct ? (10 + newStreak * 2) : 0);
    let newCorrectAnswers = state.correctAnswers + (correct ? 1 : 0);

    // Update Learned Words
    const newLearnedWords = { ...state.learnedWords, positive: [...state.learnedWords.positive], negative: [...state.learnedWords.negative] };
    if (correct) {
        const words = state.currentReview.text.toLowerCase().match(/\b\w+\b/g) || [];
        words.forEach(word => {
            if (POSITIVE_WORDS.includes(word) && !newLearnedWords.positive.includes(word)) {
                newLearnedWords.positive.push(word);
            }
            if (NEGATIVE_WORDS.includes(word) && !newLearnedWords.negative.includes(word)) {
                newLearnedWords.negative.push(word);
            }
        });
    }

    return {
        newState: {
            ...state,
            totalReviews: state.totalReviews + 1,
            trainingProgress: state.trainingProgress + 1,
            score: newScore,
            streak: newStreak,
            correctAnswers: newCorrectAnswers,
            learnedWords: newLearnedWords
        },
        correct
    };
}

export function processChallengeRound(state: NLPGameState, userChoice: Sentiment, aiCorrect: boolean): { newState: NLPGameState, result: 'win' | 'loss' | 'tie' | 'both_wrong' } {
    if (!state.currentReview) return { newState: state, result: 'both_wrong' };

    const userCorrect = userChoice === state.currentReview.sentiment;

    let result: 'win' | 'loss' | 'tie' | 'both_wrong' = 'both_wrong';
    let scoreAdd = 0;
    let yourWinsAdd = 0;
    let aiWinsAdd = 0;

    if (userCorrect && !aiCorrect) {
        result = 'win';
        scoreAdd = 20;
        yourWinsAdd = 1;
    } else if (!userCorrect && aiCorrect) {
        result = 'loss';
        aiWinsAdd = 1;
    } else if (userCorrect && aiCorrect) {
        result = 'tie';
        scoreAdd = 10;
    }

    let newStreak = userCorrect ? state.streak + 1 : 0;

    return {
        newState: {
            ...state,
            totalReviews: state.totalReviews + 1,
            score: state.score + scoreAdd,
            streak: newStreak,
            correctAnswers: state.correctAnswers + (userCorrect ? 1 : 0),
            yourWins: state.yourWins + yourWinsAdd,
            aiWins: state.aiWins + aiWinsAdd
        },
        result
    };
}

export function getAiPrediction(actualSentiment: Sentiment, accuracy = 0.85): { choice: Sentiment, correct: boolean } {
    const correct = Math.random() < accuracy;
    if (correct) return { choice: actualSentiment, correct: true };

    const sentiments: Sentiment[] = ['positive', 'negative', 'neutral'];
    const wrong = sentiments.filter(s => s !== actualSentiment);
    return { choice: wrong[Math.floor(Math.random() * wrong.length)], correct: false };
}
