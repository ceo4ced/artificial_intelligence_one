
export interface Persona {
    name: string;
    problem: string;
    painPoints: string[];
    goals: string[];
}

export interface Challenge {
    title: string;
    persona: Persona;
    criteria: string[];
}

export interface GameState {
    challenges: Challenge[];
    currentChallengeIndex: number;
    score: number;
    timeRemaining: number;
    sprintStarted: boolean;
    solutions: string[]; // Store solutions for history if needed
}

export const CHALLENGES: Challenge[] = [
    {
        title: "College Student Meal Planning",
        persona: {
            name: "Alex, 20, College Student",
            problem: "Struggles to eat healthy on a tight budget and limited cooking skills",
            painPoints: ["No time to cook", "Limited budget ($50/week)", "Doesn't know healthy recipes", "Buys too much food that goes bad"],
            goals: ["Eat healthier", "Stay within budget", "Reduce food waste", "Learn simple cooking"]
        },
        criteria: [
            "Addresses budget constraints",
            "Helps with meal planning/shopping",
            "Includes simple, quick recipes",
            "Reduces food waste",
            "Easy for beginners to use"
        ]
    },
    {
        title: "Remote Worker Productivity",
        persona: {
            name: "Maya, 32, Remote Software Developer",
            problem: "Struggles to separate work and personal life while working from home",
            painPoints: ["Works too many hours", "Feels guilty taking breaks", "Home distractions", "Zoom fatigue", "Doesn't move enough"],
            goals: ["Set better boundaries", "Take regular breaks", "Stay focused during work hours", "Maintain work-life balance"]
        },
        criteria: [
            "Encourages healthy breaks",
            "Helps with focus/productivity",
            "Addresses work-life boundaries",
            "Reduces screen time fatigue",
            "Easy to integrate into daily routine"
        ]
    },
    {
        title: "Elderly Technology Access",
        persona: {
            name: "Robert, 68, Retired Teacher",
            problem: "Wants to video call grandchildren but finds smartphones confusing",
            painPoints: ["Small text and buttons", "Too many features", "Afraid of breaking things", "Forgets passwords", "Feels frustrated and embarrassed"],
            goals: ["Connect with family easily", "Feel confident using technology", "Not feel overwhelmed", "Get help when stuck"]
        },
        criteria: [
            "Simple, large interface",
            "Minimal steps to complete tasks",
            "Clear error prevention/recovery",
            "Built-in help/tutorials",
            "Addresses accessibility needs"
        ]
    },
    {
        title: "Urban Commuter Transportation",
        persona: {
            name: "Jasmine, 26, Marketing Coordinator",
            problem: "Commute takes 90 minutes each way, involving bus, train, and walking",
            painPoints: ["Multiple tickets/apps", "Unreliable arrival times", "Safety concerns at night", "Wasted commute time", "Expensive ($200/month)"],
            goals: ["Reduce commute time/cost", "Feel safe traveling", "Make commute productive", "Simplify payment/planning"]
        },
        criteria: [
            "Addresses multi-modal transit",
            "Helps with timing/planning",
            "Improves safety/security",
            "Makes commute more valuable",
            "Simplifies payment/ticketing"
        ]
    },
    {
        title: "Small Business Inventory Management",
        persona: {
            name: "Carlos, 45, Coffee Shop Owner",
            problem: "Wastes money on inventory - orders too much of some items, runs out of others",
            painPoints: ["Manual tracking is time-consuming", "Can't predict demand", "Loses money on spoiled goods", "Runs out during rush hours", "Too busy to learn complex software"],
            goals: ["Reduce waste", "Never run out of popular items", "Save time on inventory", "Increase profits", "Simple system that works"]
        },
        criteria: [
            "Predicts inventory needs",
            "Easy to use without training",
            "Reduces waste/spoilage",
            "Alerts for low stock",
            "Affordable for small business"
        ]
    }
];

export const INITIAL_STATE: GameState = {
    challenges: CHALLENGES,
    currentChallengeIndex: 0,
    score: 0,
    timeRemaining: 300,
    sprintStarted: false,
    solutions: []
};


export function startSprint(state: GameState): GameState {
    return {
        ...state,
        sprintStarted: true,
        timeRemaining: 300
    };
}

export function calculateScore(solutionText: string, checkedCriteria: number, totalCriteria: number, timeRemaining: number): { points: number, feedback: string[] } {
    let points = 0;
    const feedback: string[] = [];

    // Text description (0-40 points)
    if (solutionText.length > 100) {
        points += 40;
        feedback.push("Detailed solution description (+40)");
    } else if (solutionText.length > 50) {
        points += 25;
        feedback.push("Good solution description (+25)");
    } else if (solutionText.length > 0) {
        points += 10;
        feedback.push("Basic solution description (+10)");
    }

    // Criteria checklist (0-40 points)
    const criteriaScore = Math.round((checkedCriteria / totalCriteria) * 40);
    points += criteriaScore;
    feedback.push(`Addressed ${checkedCriteria}/${totalCriteria} criteria (+${criteriaScore})`);

    // Time bonus (0-20 points)
    if (timeRemaining > 180) {
        points += 20;
        feedback.push("Fast completion bonus (+20)");
    } else if (timeRemaining > 60) {
        points += 10;
        feedback.push("Time bonus (+10)");
    }

    return { points, feedback };
}

export function submitSolution(state: GameState, points: number): GameState {
    return {
        ...state,
        score: state.score + points,
        sprintStarted: false
    };
}

export function nextSprint(state: GameState): GameState {
    if (state.currentChallengeIndex >= state.challenges.length) return state;

    return {
        ...state,
        currentChallengeIndex: state.currentChallengeIndex + 1,
        sprintStarted: false,
        timeRemaining: 300
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
