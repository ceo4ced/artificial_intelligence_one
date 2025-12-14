
export interface BiasOption {
    type: string;
    description: string;
}

export interface Scenario {
    title: string;
    text: string;
    correctAnswer: string;
    explanation: string;
    options: BiasOption[];
}

export interface GameState {
    currentScenarioIndex: number;
    score: number;
    streak: number;
    bestStreak: number;
    correctCount: number;
    isGameComplete: boolean;
}

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    isGameComplete: false
};

export const SCENARIOS: Scenario[] = [
    {
        title: "The Hiring Algorithm",
        text: "A tech company builds an AI hiring tool trained on resumes from the past 10 years. During that time, 85% of hires were men. The AI now automatically ranks resumes with women's colleges or women's sports teams lower than others.",
        correctAnswer: "Historical Bias",
        explanation: "This is Historical Bias. The AI learned from past hiring patterns that reflected gender discrimination. Even though the historical data was accurate, it contained societal biases from the past that the AI replicated.",
        options: [
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Label Bias", description: "Human labelers add their own biases" }
        ]
    },
    {
        title: "The Facial Recognition System",
        text: "A facial recognition system was trained on a dataset containing 100,000 images. Of these, 70,000 were light-skinned faces and 30,000 were dark-skinned faces. The system now has a 2% error rate for light skin but a 28% error rate for dark skin.",
        correctAnswer: "Data Bias",
        explanation: "This is Data Bias. The training dataset didn't represent all skin tones equally. With more than twice as many light-skinned examples, the AI had much more opportunity to learn features for that group, leading to unequal performance.",
        options: [
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" }
        ]
    },
    {
        title: "The Medical Risk Predictor",
        text: "A healthcare AI was trained only on data from patients who regularly visited doctors and had health insurance. When deployed across the whole population, it performs poorly for people without regular healthcare access.",
        correctAnswer: "Selection Bias",
        explanation: "This is Selection Bias. The training data came only from patients with healthcare access, which doesn't represent the full population. People without insurance or regular doctor visits have different health patterns that the AI never learned.",
        options: [
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" }
        ]
    },
    {
        title: "The Content Moderation Bot",
        text: "Human moderators trained an AI to flag 'threatening' content by labeling thousands of posts. The moderators unconsciously labeled posts in African American Vernacular English (AAVE) as more threatening than similar posts in Standard American English.",
        correctAnswer: "Label Bias",
        explanation: "This is Label Bias. The human labelers unknowingly added their own cultural biases when tagging the training data. Their subjective judgments about what seems 'threatening' were influenced by stereotypes about different language styles.",
        options: [
            { type: "Label Bias", description: "Human labelers add their own biases" },
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" }
        ]
    },
    {
        title: "The Credit Score Model",
        text: "A bank's AI credit model uses zip code as a feature to predict loan defaults. Even though race isn't directly used, zip codes correlate strongly with race due to historical housing segregation. The AI effectively discriminates by race through this proxy.",
        correctAnswer: "Algorithmic Bias",
        explanation: "This is Algorithmic Bias. Even with complete data, the way the algorithm uses zip code creates unfair outcomes. Using features that correlate with protected characteristics (like race) creates indirect discrimination, even when those characteristics aren't directly included.",
        options: [
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" }
        ]
    },
    {
        title: "The Voice Assistant",
        text: "Developers building a voice assistant believed that users would prefer a female voice for helpful tasks and a male voice for authoritative tasks. They designed the system to use a female voice by default, reinforcing gender stereotypes.",
        correctAnswer: "Confirmation Bias",
        explanation: "This is Confirmation Bias. The developers designed the system based on their existing beliefs about gender roles rather than objective evidence. They built their assumptions into the product, which then reinforces those stereotypes for users.",
        options: [
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" },
            { type: "Label Bias", description: "Human labelers add their own biases" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" }
        ]
    },
    {
        title: "The Job Ad Targeting System",
        text: "An AI advertising system was trained on past ad performance data. It learned that historically, men clicked more often on engineering job ads and women clicked more on nursing job ads. Now it mainly shows engineering ads to men and nursing ads to women.",
        correctAnswer: "Historical Bias",
        explanation: "This is Historical Bias. The AI learned from historical patterns that reflected existing gender stereotypes in career choices. By optimizing based on past behavior, it perpetuates those stereotypes instead of giving everyone equal access to all opportunities.",
        options: [
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" }
        ]
    },
    {
        title: "The Sentiment Analysis Tool",
        text: "A sentiment analysis AI was trained on social media posts, where younger users are more active. When analyzing customer feedback, it performs well on casual language and emojis but struggles with formal language used by older customers.",
        correctAnswer: "Data Bias",
        explanation: "This is Data Bias. The training data over-represented younger users' communication styles and under-represented older users' styles. The AI had more examples to learn from for one demographic, leading to unequal performance across age groups.",
        options: [
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Label Bias", description: "Human labelers add their own biases" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" }
        ]
    },
    {
        title: "The Recidivism Predictor",
        text: "A criminal justice AI was trained on arrest and conviction records. In areas with heavier policing of certain neighborhoods, arrest rates were higher regardless of actual crime rates. The AI learned to associate living in these areas with higher risk.",
        correctAnswer: "Selection Bias",
        explanation: "This is Selection Bias. The training data (arrest records) doesn't reflect actual crime rates—it reflects policing patterns. Areas with more police presence have more arrests, but that doesn't mean more crime occurs there. The data collection method biased the training set.",
        options: [
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" }
        ]
    },
    {
        title: "The Image Search Engine",
        text: "Developers trained an image recognition system to detect 'professional' vs. 'unprofessional' photos. The labeling team consistently rated business suits as professional and casual wear as unprofessional, even for jobs where casual dress is standard.",
        correctAnswer: "Label Bias",
        explanation: "This is Label Bias. The human labelers brought their own cultural assumptions about professionalism when tagging the images. Their subjective judgments about dress codes were influenced by their personal backgrounds and experiences, creating biased labels.",
        options: [
            { type: "Label Bias", description: "Human labelers add their own biases" },
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" }
        ]
    },
    {
        title: "The Scholarship Predictor",
        text: "A university built an AI to predict scholarship success using GPA, test scores, and extracurricular activities. The algorithm weighted expensive activities (like travel abroad and private music lessons) heavily, disadvantaging students from low-income families.",
        correctAnswer: "Algorithmic Bias",
        explanation: "This is Algorithmic Bias. Even if the data was complete, the way the algorithm weighs features creates unfair outcomes. By heavily weighting activities that require financial resources, the system discriminates against qualified students who couldn't afford those experiences.",
        options: [
            { type: "Algorithmic Bias", description: "The algorithm itself creates unfair outcomes" },
            { type: "Selection Bias", description: "Training data doesn't reflect the real world" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" }
        ]
    },
    {
        title: "The Translation System",
        text: "An AI translation system was trained on historical texts and literature. When translating gender-neutral languages to English, it consistently translated doctor as 'he' and nurse as 'she' because those patterns appeared frequently in older texts.",
        correctAnswer: "Historical Bias",
        explanation: "This is Historical Bias. The training data (historical texts) reflected outdated gender stereotypes about professions. The AI learned these patterns from accurate historical data, but applying them today perpetuates discrimination that society has been working to overcome.",
        options: [
            { type: "Historical Bias", description: "Learning from past data that reflects discrimination" },
            { type: "Data Bias", description: "Training data doesn't represent all groups equally" },
            { type: "Confirmation Bias", description: "Designers confirm their existing beliefs" },
            { type: "Label Bias", description: "Human labelers add their own biases" }
        ]
    }
];

// Pure functions

export function processAnswer(
    state: GameState,
    selectedType: string,
    scenario: Scenario
): { newState: GameState; isCorrect: boolean } {
    const isCorrect = selectedType === scenario.correctAnswer;

    let newScore = state.score;
    let newStreak = state.streak;
    let newBestStreak = state.bestStreak;
    let newCorrectCount = state.correctCount;

    if (isCorrect) {
        newStreak++;
        newBestStreak = Math.max(newBestStreak, newStreak);
        newScore += 100 + (newStreak * 10);
        newCorrectCount++;
    } else {
        newStreak = 0;
    }

    return {
        newState: {
            ...state,
            score: newScore,
            streak: newStreak,
            bestStreak: newBestStreak,
            correctCount: newCorrectCount
        },
        isCorrect
    };
}

export function advanceScenario(state: GameState, totalScenarios: number): GameState {
    const nextIndex = state.currentScenarioIndex + 1;
    const isComplete = nextIndex >= totalScenarios;

    return {
        ...state,
        currentScenarioIndex: nextIndex,
        isGameComplete: isComplete
    };
}

export function calculateAccuracy(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
}
