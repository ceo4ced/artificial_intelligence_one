
export interface Scenario {
    title: string;
    text: string;
    expertRating: number;
    explanation: string;
    principles: string;
}

export interface GameState {
    currentScenarioIndex: number;
    totalScore: number;
    accuracySum: number;
    bestRating: number;
    isGameComplete: boolean;
}

export interface RatingResult {
    userRating: number;
    expertRating: number;
    difference: number;
    accuracy: number;
    points: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    totalScore: 0,
    accuracySum: 0,
    bestRating: 0,
    isGameComplete: false
};

export const SCENARIOS: Scenario[] = [
    {
        title: "AI-Powered Crop Disease Detection",
        text: "A free mobile app uses AI to help small-scale farmers identify crop diseases by taking photos of their plants. The app works offline, doesn't collect user data, and was trained on images from the regions where it's deployed. It provides treatment recommendations in local languages.",
        expertRating: 15,
        explanation: "This is LOW RISK and ethically sound. It solves a real problem, benefits vulnerable populations, respects privacy, was developed inclusively, and has minimal downsides.",
        principles: "Social benefit, privacy protection, accessibility, informed design"
    },
    {
        title: "Mass Facial Recognition Surveillance",
        text: "A city installs AI cameras that identify every person in public spaces, tracking their movements throughout the day. The data is stored indefinitely and accessible to law enforcement without warrants. Citizens are not informed about the surveillance and cannot opt out.",
        expertRating: 95,
        explanation: "This is HIGH RISK and highly problematic. It violates privacy, lacks consent and transparency, enables mass surveillance, and can be abused. The chilling effect on freedom outweighs potential safety benefits.",
        principles: "Privacy violation, lack of consent, potential for abuse, surveillance state concerns"
    },
    {
        title: "Medical Diagnosis Assistant",
        text: "An AI helps doctors detect cancer in medical scans. It highlights suspicious areas for doctor review but doesn't make final decisions. The system was tested on diverse populations, shows its confidence levels, and doctors can override it. Hospitals inform patients when AI assists their diagnosis.",
        expertRating: 25,
        explanation: "This is LOW-MEDIUM RISK. Human doctors remain in control, it's transparent, assists rather than replaces, and was tested fairly. The risk is appropriately managed through human oversight.",
        principles: "Human oversight, transparency, augmentation not replacement, informed patients"
    },
    {
        title: "Hiring Algorithm (Trained on Biased Data)",
        text: "A company uses AI to screen resumes, trained on their past 15 years of hiring data. During that period, the company hired 80% men for technical roles. The AI now ranks candidates, and hiring managers typically accept its top recommendations without review.",
        expertRating: 85,
        explanation: "This is HIGH RISK. The system learned historical discrimination, lacks oversight, and perpetuates bias. It fails on fairness, accountability, and transparency. Human rubber-stamping doesn't constitute meaningful oversight.",
        principles: "Historical bias, lack of oversight, discrimination, insufficient testing for fairness"
    },
    {
        title: "Personalized Learning Platform",
        text: "An educational AI adapts lessons to each student's pace and learning style. It identifies struggling students for teacher intervention, keeps data private and secure, requires parental consent, and allows students to opt out. Teachers can view the AI's reasoning for recommendations.",
        expertRating: 20,
        explanation: "This is LOW RISK. It benefits students, respects privacy, includes consent, maintains teacher oversight, and is transparent. The AI supports human teachers rather than replacing them.",
        principles: "Educational benefit, privacy protection, consent, transparency, human oversight"
    },
    {
        title: "Predictive Policing Algorithm",
        text: "Police use AI trained on arrest records to predict where crimes will occur. This directs more officers to predicted areas, leading to more arrests there, which the AI then uses to predict future crime in the same areas, creating a feedback loop. Communities are not consulted.",
        expertRating: 90,
        explanation: "This is HIGH RISK. It creates a biased feedback loop, uses data reflecting over-policing rather than actual crime, lacks community input, and perpetuates systemic discrimination without addressing root causes.",
        principles: "Feedback loop bias, lack of community consent, perpetuating discrimination"
    },
    {
        title: "Social Media Content Moderation",
        text: "An AI flags potentially harmful content (violence, hate speech, child exploitation) for human review. It has known error rates and biases which are publicly disclosed. Human moderators make final decisions on removal. Users can appeal decisions.",
        expertRating: 35,
        explanation: "This is MEDIUM RISK. The task (safety) is important, humans make final calls, and there's an appeal process. However, known biases exist, and content moderation involves complex judgment calls. The risk is managed but not eliminated.",
        principles: "Important safety goal, human oversight, transparency about limitations, appeals process"
    },
    {
        title: "Insurance Risk Pricing AI",
        text: "A health insurance company uses AI to predict individual customers' future medical costs and prices premiums accordingly. People predicted to get expensive conditions pay much more, potentially making insurance unaffordable for those who need it most.",
        expertRating: 80,
        explanation: "This is HIGH RISK. While actuarially 'fair,' it violates social fairness by making healthcare unaffordable for sick people. It prioritizes profit over human welfare and could deny care to vulnerable populations.",
        principles: "Social harm, prioritizing profit over welfare, discriminating against sick people"
    },
    {
        title: "AI Writing Assistant",
        text: "An AI helps students brainstorm ideas, check grammar, and improve writing clarity. It's transparent about being AI, teachers know students use it, and it's positioned as a learning tool to develop skills, not complete work. Students still write and think for themselves.",
        expertRating: 30,
        explanation: "This is LOW-MEDIUM RISK. When used transparently as a learning aid with teacher knowledge, it can benefit education. The risk is low if it supports learning rather than replacing it, though there are concerns about over-reliance.",
        principles: "Educational benefit, transparency, skill development focus, appropriate use context"
    },
    {
        title: "Autonomous Weapons System",
        text: "An AI-powered weapons system can identify and engage targets without human approval. It makes kill decisions faster than humans can intervene. The system is designed to 'reduce civilian casualties' but operates independently in complex combat situations.",
        expertRating: 98,
        explanation: "This is EXTREMELY HIGH RISK. Autonomous weapons that make kill decisions without human oversight raise fundamental ethical concerns. Delegating life-and-death decisions to AI, especially in complex situations, violates human autonomy and accountability principles.",
        principles: "Life-and-death decisions without human control, accountability vacuum, existential risk"
    }
];

// Pure Functions

export function calculateRatingResult(userRating: number, expertRating: number): RatingResult {
    const difference = Math.abs(userRating - expertRating);
    const accuracy = Math.max(0, 100 - difference);
    const points = Math.round(accuracy * 10);

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (userRating < 33) riskLevel = 'LOW';
    else if (userRating < 67) riskLevel = 'MEDIUM';
    else riskLevel = 'HIGH';

    return {
        userRating,
        expertRating,
        difference,
        accuracy,
        points,
        riskLevel
    };
}

export function updateGameState(state: GameState, result: RatingResult): GameState {
    const newAccuracySum = state.accuracySum + result.accuracy;
    const newBestRating = Math.max(state.bestRating, result.accuracy);
    const newTotalScore = state.totalScore + result.points;

    return {
        ...state,
        accuracySum: newAccuracySum,
        bestRating: newBestRating,
        totalScore: newTotalScore
    };
}

export function advanceScenario(state: GameState): GameState {
    const nextIndex = state.currentScenarioIndex + 1;
    const isComplete = nextIndex >= SCENARIOS.length;

    return {
        ...state,
        currentScenarioIndex: nextIndex,
        isGameComplete: isComplete
    };
}

export function getRiskLabelColor(value: number): { text: string, color: string } {
    if (value < 33) {
        return { text: 'LOW RISK', color: '#4CAF50' };
    } else if (value < 67) {
        return { text: 'MEDIUM RISK', color: '#FFC107' };
    } else {
        return { text: 'HIGH RISK', color: '#f44336' };
    }
}
