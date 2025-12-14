
export interface Scenario {
    title: string;
    text: string;
    correctAnswer: string;
    explanation: string;
}

export interface GameState {
    scenarios: Scenario[];
    currentScenarioIndex: number;
    score: number;
    streak: number;
    bestStreak: number;
    correctCount: number;
    answered: boolean;
}

export const SCENARIOS: Scenario[] = [
    {
        title: "Math Homework Help",
        text: "Sarah has been working on her calculus homework for 30 minutes and is stuck on one problem. She asks ChatGPT to explain the concept of derivatives and show her the general approach, then tries the problem herself with that understanding.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Sarah made genuine effort first, used AI to understand the concept (not solve the specific problem), and then applied that knowledge herself. She's using AI as a learning tool, not a shortcut.",
    },
    {
        title: "Essay Writing Shortcut",
        text: "Marcus has an essay due tomorrow that he hasn't started. He types the prompt into Claude and asks it to write a 5-paragraph essay on the causes of World War I. He copies the output, changes a few words, and submits it as his own work.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. Marcus is submitting AI-generated work as his own without doing any actual thinking or writing. He's not learning, violating academic integrity, and misrepresenting his work. This is plagiarism.",
    },
    {
        title: "Code Debugging Session",
        text: "Aisha's Python program keeps crashing with an error she doesn't understand. She pastes her code and the error message into ChatGPT and asks, 'Why is this happening and what concept do I need to understand to fix it?' She then fixes the bug based on the explanation.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Aisha is using AI like a tutor to understand what went wrong. She's learning about the error and fixing it herself rather than having AI rewrite her code. This builds her debugging skills.",
    },
    {
        title: "Reading Summary Substitute",
        text: "Tyler has a quiz tomorrow on chapters 5-7 of his history textbook. Instead of reading, he asks AI to summarize each chapter. He memorizes the summaries and uses that for the quiz.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. Tyler is using AI to completely bypass the assigned reading. He's avoiding the learning objective (reading comprehension and historical analysis) and will miss important details and critical thinking that comes from reading the actual text.",
    },
    {
        title: "Brainstorming Research Topics",
        text: "Emma needs to pick a topic for her research paper on environmental science. She asks Claude, 'What are some interesting and current topics in climate science that would work for a high school research paper?' She reviews the suggestions and picks one that interests her.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Emma is using AI to generate ideas and explore possibilities, not to do the research or writing. Brainstorming is an appropriate use of AI that can help students find engaging topics. The actual research and analysis will still be her work.",
    },
    {
        title: "Entire Coding Project",
        text: "Jake has a computer science project to build a simple calculator app. He gives the full assignment requirements to ChatGPT and asks it to write the complete program. He submits it after checking that it runs.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. Jake is having AI complete his entire assignment. He's not learning programming skills, problem-solving, or code architecture. When exams come or when he needs to explain his code, he'll be unable to do so because he didn't actually write it.",
    },
    {
        title: "Grammar and Style Feedback",
        text: "After writing her college application essay through multiple drafts, Sofia pastes it into Claude and asks, 'Can you identify grammatical errors and suggest where my writing could be clearer?' She reviews the feedback and decides which suggestions to incorporate.",
        correctAnswer: "Gray Area",
        explanation: "This is a Gray Area. Using AI for grammar checking is generally acceptable, but for something as personal and important as a college essay, admissions officers want to see your authentic voice. If the AI significantly changes your writing style, it crosses a line. Light editing is okay; having AI polish your essay extensively is questionable. When in doubt, ask your counselor.",
    },
    {
        title: "Vocabulary Practice",
        text: "Nina is studying for the SAT and asks ChatGPT to quiz her on vocabulary words, provide example sentences, and explain the etymology of words she's struggling with. She practices until she can use the words correctly on her own.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Nina is using AI as a study tool and practice partner. She's actively learning and testing her knowledge, not having AI take the test for her. This is an excellent example of using AI to enhance learning through practice and explanation.",
    },
    {
        title: "Lab Report Data Analysis",
        text: "Alex conducted a chemistry experiment but doesn't understand how to interpret the data. He gives his raw experimental results to AI and asks it to analyze the data, draw conclusions, and write the analysis section of his lab report, which he then submits.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. The entire point of a lab report is to learn how to analyze data and draw conclusions. By having AI do this critical thinking step, Alex is bypassing the main learning objective. He should ask AI to explain how to analyze data, then do the analysis himself.",
    },
    {
        title: "Foreign Language Translation",
        text: "Kenji has Spanish homework to write a paragraph about his summer vacation. He writes it in English first, then uses ChatGPT to translate it to Spanish. He doesn't verify the grammar or try to understand the Spanish version before submitting.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. Using AI as a direct translator defeats the purpose of language learning. Kenji isn't practicing Spanish composition, grammar, or vocabulary. He should write in Spanish (using a dictionary for unknown words) or use AI to check his Spanish after he writes it, not to translate from English.",
    },
    {
        title: "Concept Explanation Request",
        text: "During homework, Lily encounters the concept of photosynthesis and finds the textbook explanation confusing. She asks Claude, 'Can you explain photosynthesis in simpler terms and give me an analogy?' After understanding it, she closes the AI and completes her homework questions on her own.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Lily is using AI to understand a concept that confuses her - exactly like asking a teacher for clarification. She's building understanding, not getting answers to her homework. Once she understands, she does the work herself. This is ideal AI use for learning.",
    },
    {
        title: "Essay Outline Assistance",
        text: "Jordan has a thesis and main ideas for his essay but is struggling with organization. He tells ChatGPT his thesis and asks, 'What's a logical way to structure these ideas?' He uses the suggested outline structure but writes all the content himself.",
        correctAnswer: "Gray Area",
        explanation: "This is a Gray Area. Getting help with essay structure is less problematic than having AI write content, but organization is part of the writing process you're supposed to learn. This might be acceptable for early drafts or if you're struggling with writing skills, but you should develop the ability to organize ideas on your own. If your teacher allows it, disclose it.",
    },
    {
        title: "Practice Test Generation",
        text: "Before her biology exam, Maya asks ChatGPT to create practice questions about cellular respiration based on her study guide. She answers them without AI help, then uses AI to check if her answers are correct and explain what she got wrong.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Maya is using AI to create study materials and check her understanding - both excellent uses. She's doing the actual learning work herself (answering questions) and using AI to verify and explain. This is active learning enhanced by technology.",
    },
    {
        title: "Avoiding Cited Research",
        text: "Instead of finding and reading 5 scholarly sources for her research paper as required, Zoe asks ChatGPT to provide information about her topic and includes it in her paper without citing any actual sources. She formats it to look like she did research.",
        correctAnswer: "Unsafe/Cheating",
        explanation: "This is Unsafe/Cheating. Zoe is fabricating sources and bypassing the research process. Research assignments teach you to find, evaluate, and synthesize credible sources - critical academic skills. She's also potentially including inaccurate information since AI can make errors. This violates academic integrity on multiple levels.",
    },
    {
        title: "Understanding Teacher Feedback",
        text: "After getting his essay back with comments like 'thesis too broad' and 'needs stronger evidence,' Carlos doesn't understand what his teacher means. He asks Claude to explain what these comments mean and how to address them, then revises his essay based on his new understanding.",
        correctAnswer: "Responsible Use",
        explanation: "This is Responsible Use. Carlos is using AI to understand feedback - similar to going to office hours. He's learning what good writing looks like and applying that knowledge to improve his own work. The actual revision is his work, based on understanding the feedback better. This is excellent use of AI for learning.",
    }
];

export const INITIAL_STATE: GameState = {
    scenarios: SCENARIOS,
    currentScenarioIndex: 0,
    score: 0,
    streak: 0,
    bestStreak: 0,
    correctCount: 0,
    answered: false
};

export function checkJudgment(state: GameState, judgment: string): { newState: GameState, isCorrect: boolean, explanation: string, pointsEarned: number } {
    if (state.answered) {
        return { newState: state, isCorrect: false, explanation: "", pointsEarned: 0 };
    }

    const currentScenario = state.scenarios[state.currentScenarioIndex];
    const isCorrect = judgment === currentScenario.correctAnswer;
    let pointsEarned = 0;

    const newState = { ...state, answered: true };

    if (isCorrect) {
        newState.correctCount++;
        newState.streak++;
        newState.bestStreak = Math.max(newState.bestStreak, newState.streak);
        pointsEarned = 100 + (newState.streak * 10);
        newState.score += pointsEarned;
    } else {
        newState.streak = 0;
    }

    return { newState, isCorrect, explanation: currentScenario.explanation, pointsEarned };
}

export function nextScenario(state: GameState): GameState {
    if (state.currentScenarioIndex >= state.scenarios.length) return state;

    return {
        ...state,
        currentScenarioIndex: state.currentScenarioIndex + 1,
        answered: false
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE };
}
