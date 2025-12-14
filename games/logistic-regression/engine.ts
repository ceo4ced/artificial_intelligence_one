
export interface Email {
    from: string;
    subject: string;
    body: string;
    type: 'spam' | 'ham'; // True label
}

export interface TrainingExample {
    email: Email;
    userLabel: 'spam' | 'ham';
}

export interface ClassifierMetrics {
    totalEmails: number;
    correctCount: number;
    spamCount: number;
    hamCount: number;
    precision: number;
    recall: number;
    accuracy: number;
}

export interface LogisticState {
    trainingData: TrainingExample[];
    weights: Record<string, number>;
    bias: number;
    metrics: ClassifierMetrics;
    trainingPhase: boolean;
}

export const SPAM_INDICATORS = ['win', 'free', 'click', 'urgent', 'million', 'prize', 'offer', 'limited', 'now', 'hurry', 'fast'];

export const INITIAL_STATE: LogisticState = {
    trainingData: [],
    weights: {},
    bias: 0,
    metrics: {
        totalEmails: 0,
        correctCount: 0,
        spamCount: 0,
        hamCount: 0,
        precision: 0,
        recall: 0,
        accuracy: 0
    },
    trainingPhase: true
};

export const EMAILS: { spam: Email[], ham: Email[] } = {
    spam: [
        { from: 'winner@lottery.com', subject: '🎉 You won $1,000,000!!!', body: 'Congratulations! You have won our grand prize! Click here NOW to claim your prize! Act fast, offer expires today! Send your bank details immediately!', type: 'spam' },
        { from: 'prince@nigeria.ng', subject: 'Urgent Business Proposal', body: 'Dear Friend, I am a prince and need your help transferring $50 million. I will give you 20% commission! Please send your account details urgently!', type: 'spam' },
        { from: 'deals@cheapmeds.com', subject: 'Buy Cheap Medications NOW!', body: 'Get 90% OFF on all medications! No prescription needed! Click here for HUGE savings! Limited time offer! Order now!!!', type: 'spam' },
        { from: 'noreply@bank-verify.com', subject: 'URGENT: Verify your account', body: 'Your account has been suspended! Click this link immediately to verify your identity or your account will be permanently deleted!', type: 'spam' },
        { from: 'marketing@getrichfast.com', subject: 'Make $5000 per week from home!', body: 'Work from home and earn HUGE income! No experience needed! Click here to start making money TODAY! Limited spots available!', type: 'spam' },
        { from: 'offers@discount99.com', subject: 'SPECIAL OFFER: 99% OFF Everything!', body: 'CLICK NOW for massive discounts! Everything must go! Buy now! Limited time! Hurry! Dont miss out!!!', type: 'spam' },
        { from: 'admin@your-bank.com', subject: 'Account Security Alert', body: 'We detected suspicious activity. Click here immediately to secure your account or it will be locked forever! Urgent action required!', type: 'spam' },
        { from: 'winner@sweepstakes.com', subject: 'Claim Your Free Gift Card Now!', body: 'You have been selected to receive a $500 gift card! Click here to claim it now! Offer valid for 24 hours only!', type: 'spam' },
        { from: 'health@miracle-cure.com', subject: 'Lose 50 pounds in 2 weeks!', body: 'Amazing new discovery! Doctors hate this one trick! Lose weight fast without diet or exercise! Order now!', type: 'spam' },
        { from: 'tech@upgrade-now.com', subject: 'Your computer is infected!', body: 'WARNING: We detected 37 viruses on your computer! Click here NOW to download our FREE antivirus! Your data is at risk!', type: 'spam' }
    ],
    ham: [
        { from: 'boss@company.com', subject: 'Meeting tomorrow at 2pm', body: 'Hi team, just a reminder that we have our quarterly review meeting tomorrow at 2pm in conference room B. Please bring your progress reports.', type: 'ham' },
        { from: 'friend@email.com', subject: 'Coffee next week?', body: 'Hey! Hope you are doing well. Would you like to grab coffee next Tuesday? Let me know what works for you.', type: 'ham' },
        { from: 'support@github.com', subject: 'Your pull request was merged', body: 'Your pull request #247 has been successfully merged into the main branch. Thank you for your contribution!', type: 'ham' },
        { from: 'newsletter@nytimes.com', subject: 'Your Daily Briefing', body: 'Good morning. Here are today top stories: World leaders meet for climate summit, new research on renewable energy, and local election updates.', type: 'ham' },
        { from: 'mom@family.com', subject: 'Dinner this Sunday', body: 'Hi honey! Would you like to come over for dinner this Sunday? Dad is grilling. Let me know if you can make it. Love, Mom', type: 'ham' },
        { from: 'hr@company.com', subject: 'Updated PTO policy', body: 'Dear employees, please review the updated PTO policy attached. Changes are effective from next month. Contact HR with any questions.', type: 'ham' },
        { from: 'orders@amazon.com', subject: 'Your order has shipped', body: 'Your order #12345 has been shipped and will arrive on Thursday. Track your package using the link below.', type: 'ham' },
        { from: 'professor@university.edu', subject: 'Assignment deadline extension', body: 'Hi class, due to the holiday this week, I am extending the assignment deadline to next Friday. Let me know if you have questions.', type: 'ham' },
        { from: 'fitness@gym.com', subject: 'New class schedule', body: 'We have added new yoga and spin classes to our schedule! Check out the updated timetable on our website. See you at the gym!', type: 'ham' },
        { from: 'bank@chase.com', subject: 'Your monthly statement is ready', body: 'Your statement for March 2024 is now available. Log in to your account to view transactions and download your statement.', type: 'ham' }
    ]
};

export function extractFeatures(email: Email): Record<string, number> {
    const text = (email.subject + " " + email.body).toLowerCase();
    const words = text.match(/\b\w+\b/g) || [];
    const features: Record<string, number> = {};

    words.forEach(w => {
        features[w] = (features[w] || 0) + 1;
    });
    return features;
}

export function sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
}

// Predict probability (0-1) that email is SPAM
export function predict(email: Email, state: LogisticState): number {
    const features = extractFeatures(email);
    let z = state.bias;

    for (const [word, count] of Object.entries(features)) {
        if (state.weights[word]) {
            z += state.weights[word] * count;
        }
    }
    return sigmoid(z);
}

export function updateClassifier(
    state: LogisticState,
    email: Email,
    userLabel: 'spam' | 'ham'
): LogisticState {
    const metrics = { ...state.metrics };
    metrics.totalEmails++;

    if (userLabel === email.type) metrics.correctCount++;
    if (email.type === 'spam') metrics.spamCount++; else metrics.hamCount++;

    // Update accuracy
    metrics.accuracy = Math.round((metrics.correctCount / metrics.totalEmails) * 100);

    // Update precision/recall (simulated or simplified)
    metrics.precision = metrics.totalEmails > 0 ? Math.min(100, 60 + (metrics.correctCount / metrics.totalEmails) * 40) : 0;
    metrics.recall = metrics.totalEmails > 0 ? Math.min(100, 55 + (metrics.correctCount / metrics.totalEmails) * 45) : 0;

    // "Train" the model simple perceptron-style for visualization
    // If it's spam, boost weights of present words. If ham, decrease.
    const newWeights = { ...state.weights };
    const features = extractFeatures(email);
    const learningRate = 0.5;
    const target = userLabel === 'spam' ? 1 : -1;

    for (const [word, count] of Object.entries(features)) {
        const currentW = newWeights[word] || 0;
        // Simple update: emphasize words found in labeled examples, weighted by frequency
        // Note: Real logistic regression uses error gradients.
        // Here we just want "spam words" to have positive weights.
        newWeights[word] = currentW + (target * learningRate * count);
    }

    return {
        ...state,
        weights: newWeights,
        metrics,
        trainingData: [...state.trainingData, { email, userLabel }]
    };
}

export function pickRandomEmail(): Email {
    const type = Math.random() < 0.5 ? 'spam' : 'ham';
    const list = EMAILS[type];
    return list[Math.floor(Math.random() * list.length)];
}
