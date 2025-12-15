
export interface Issue {
    id: number;
    text: string;
    category: string;
    correct: boolean;
}

export interface TestCase {
    title: string;
    difficulty: "easy" | "medium" | "hard";
    description: string;
    mockup: string;
    issues: Issue[];
    hints: string[];
    explanation: string;
}

export interface GameState {
    testCases: TestCase[];
    currentCaseIndex: number;
    score: number;
    totalCorrectFound: number; // Cumulative across all cases
    totalCorrectAvailable: number; // Cumulative available correct issues encountered so far
    selectedIssues: Set<number>; // IDs of issues selected for CURRENT case
}

export const TEST_CASES: TestCase[] = [
    {
        title: "E-commerce Checkout",
        difficulty: "easy",
        description: "Online store checkout page for buying shoes",
        mockup: `
            <div style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">CHECKOUT</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                <div style="padding: 15px; background: #e3f2fd; border-radius: 6px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">1</div>
                    <div style="font-size: 12px;">Cart</div>
                </div>
                <div style="padding: 15px; background: #667eea; color: #fff; border-radius: 6px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">2</div>
                    <div style="font-size: 12px;">Shipping</div>
                </div>
                <div style="padding: 15px; background: #e0e0e0; border-radius: 6px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">3</div>
                    <div style="font-size: 12px;">Payment</div>
                </div>
                <div style="padding: 15px; background: #e0e0e0; border-radius: 6px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">4</div>
                    <div style="font-size: 12px;">Confirm</div>
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 11px; color: #999; margin-bottom: 3px;">Full Name</label>
                <input type="text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 11px; color: #999; margin-bottom: 3px;">Address Line 1</label>
                <input type="text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div>
                    <label style="display: block; font-size: 11px; color: #999; margin-bottom: 3px;">City</label>
                    <input type="text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                </div>
                <div>
                    <label style="display: block; font-size: 11px; color: #999; margin-bottom: 3px;">ZIP</label>
                    <input type="text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
                </div>
            </div>
            <div style="margin-bottom: 15px;">
                <label style="display: block; font-size: 11px; color: #999; margin-bottom: 3px;">Phone Number</label>
                <input type="text" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
            </div>
            <button style="width: 100%; padding: 15px; background: #4CAF50; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">CONTINUE</button>
        `,
        issues: [
            { id: 1, text: "No indication of required vs optional fields", category: "Clarity", correct: true },
            { id: 2, text: "Missing state/province field", category: "Functionality", correct: true },
            { id: 3, text: "No validation feedback (real-time or on error)", category: "Feedback", correct: true },
            { id: 4, text: "Phone number format unclear (international users?)", category: "Accessibility", correct: true },
            { id: 5, text: "Button is too colorful", category: "Visual", correct: false },
            { id: 6, text: "Form is too long", category: "Cognitive Load", correct: false }
        ],
        hints: [
            "Look at the form fields - what information is missing for users?",
            "Consider international users - what fields might need clarification?",
            "What happens if a user enters invalid data?"
        ],
        explanation: "This checkout has several usability issues: no required field indicators, missing state field, no validation, and unclear phone format. Good forms provide clear guidance and real-time feedback."
    },
    {
        title: "Mobile Banking App",
        difficulty: "medium",
        description: "Transfer money screen in a banking app",
        mockup: `
            <div style="background: #667eea; color: #fff; padding: 15px; margin: -20px -20px 20px -20px; border-radius: 10px 10px 0 0;">
                <div style="font-size: 14px;">← Account</div>
                <div style="font-size: 20px; font-weight: bold; margin-top: 10px;">Transfer Money</div>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 5px;">From Account</div>
                <select style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
                    <option>Checking ****1234 - $5,234.19</option>
                    <option>Savings ****5678 - $12,450.00</option>
                </select>
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 5px;">To Account Number</div>
                <input type="text" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" placeholder="Enter account number">
            </div>
            <div style="margin-bottom: 20px;">
                <div style="font-size: 12px; color: #999; margin-bottom: 5px;">Amount</div>
                <input type="text" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;" placeholder="0.00">
            </div>
            <button style="width: 100%; padding: 15px; background: #f44336; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; cursor: pointer;">Transfer Now</button>
            <div style="margin-top: 15px; font-size: 11px; color: #999; text-align: center;">Transfers are processed immediately and cannot be reversed</div>
        `,
        issues: [
            { id: 1, text: "No confirmation step before transfer", category: "Safety", correct: true },
            { id: 2, text: "Destructive action (transfer) uses alarming red button", category: "Design", correct: true },
            { id: 3, text: "No way to save/add frequent recipients", category: "Efficiency", correct: true },
            { id: 4, text: "Warning text is too small and easy to miss", category: "Visibility", correct: true },
            { id: 5, text: "No maximum transfer limit shown", category: "Guidance", correct: true },
            { id: 6, text: "The app should use biometric authentication", category: "Security", correct: false }
        ],
        hints: [
            "Financial transactions should have safety measures - what's missing?",
            "Look at the button color - does it match the action's importance?",
            "Consider users who transfer money regularly"
        ],
        explanation: "Banking apps need extra safety measures. This design lacks a confirmation step, uses an alarming button color for a normal action, has tiny warning text, and doesn't show transfer limits."
    },
    {
        title: "Restaurant Website",
        difficulty: "easy",
        description: "Homepage of a local restaurant website",
        mockup: `
            <div style="position: relative; height: 200px; background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><rect fill="%23333" width="100%" height="100%"/></svg>'); background-size: cover; display: flex; align-items: center; justify-content: center; margin: -20px -20px 20px -20px;">
                <h1 style="color: #fff; font-size: 48px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">Mario's Italian Kitchen</h1>
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="font-size: 18px; line-height: 1.8; color: #333;">
                    Welcome to Mario's! We serve the finest Italian cuisine in town.
                    Visit us for lunch or dinner. We use only the freshest ingredients.
                    Family owned since 1985. Come experience authentic Italian food!
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🍝</div>
                    <div style="font-weight: bold;">Pasta</div>
                </div>
                <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🍕</div>
                    <div style="font-weight: bold;">Pizza</div>
                </div>
                <div style="padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 10px;">🥗</div>
                    <div style="font-weight: bold;">Salads</div>
                </div>
            </div>
            <div style="text-align: center; font-size: 14px; color: #666;">
                123 Main Street | info@marios.com
            </div>
        `,
        issues: [
            { id: 1, text: "No clear call-to-action (menu, order, reserve)", category: "Navigation", correct: true },
            { id: 2, text: "Missing critical information: hours, phone number", category: "Information", correct: true },
            { id: 3, text: "No visible navigation menu", category: "Navigation", correct: true },
            { id: 4, text: "Location/map not prominent (hard to find)", category: "Findability", correct: true },
            { id: 5, text: "Too much text in the description", category: "Content", correct: false },
            { id: 6, text: "Colors are too plain", category: "Visual", correct: false }
        ],
        hints: [
            "What would a hungry customer want to do first?",
            "What essential information is missing?",
            "How would someone contact or find the restaurant?"
        ],
        explanation: "Restaurant websites need clear actions (view menu, order, reserve) and essential info (hours, phone, location). This design buries important information and lacks clear navigation."
    },
    {
        title: "Email Newsletter Signup",
        difficulty: "medium",
        description: "Pop-up modal for newsletter subscription",
        mockup: `
            <div style="position: relative; background: #fff; border: 3px solid #667eea; border-radius: 10px; padding: 30px; max-width: 400px; margin: 50px auto;">
                <div style="position: absolute; top: 10px; right: 10px; font-size: 10px; color: #999; cursor: pointer;">✕</div>
                <div style="text-align: center;">
                    <div style="font-size: 28px; font-weight: bold; margin-bottom: 15px;">Don't Miss Out!</div>
                    <div style="font-size: 14px; margin-bottom: 20px; line-height: 1.6;">
                        Subscribe to our newsletter to get exclusive deals, tips, and updates delivered to your inbox!
                    </div>
                    <input type="email" placeholder="Enter your email" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; margin-bottom: 15px; font-size: 14px;">
                    <button style="width: 100%; padding: 15px; background: #667eea; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 16px; cursor: pointer;">Subscribe Now</button>
                    <div style="margin-top: 20px; font-size: 10px; color: #999;">
                        By subscribing you agree to receive marketing emails. We send 2-3 emails per week.
                    </div>
                </div>
            </div>
        `,
        issues: [
            { id: 1, text: "Close button (✕) is tiny and hard to click", category: "Accessibility", correct: true },
            { id: 2, text: "No clear way to decline/dismiss ('No thanks' option)", category: "User Control", correct: true },
            { id: 3, text: "Appears immediately on page load (interrupts user)", category: "Timing", correct: true },
            { id: 4, text: "Terms/privacy link missing despite collecting email", category: "Trust", correct: true },
            { id: 5, text: "Email frequency mentioned in tiny text after signup", category: "Transparency", correct: true },
            { id: 6, text: "The modal should be bigger", category: "Size", correct: false }
        ],
        hints: [
            "When should a popup appear to be least disruptive?",
            "What's missing for users who don't want to subscribe?",
            "What information should be clear BEFORE signing up?"
        ],
        explanation: "Pop-ups should respect users: provide easy dismissal, appear at appropriate times, be transparent about email frequency, and always link to privacy policies. This design is intrusive and lacks transparency."
    },
    {
        title: "Password Reset Flow",
        difficulty: "hard",
        description: "Screen shown after requesting password reset",
        mockup: `
            <div style="max-width: 500px; margin: 50px auto; padding: 40px; background: #f8f9fa; border-radius: 10px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 15px;">Check Your Email!</div>
                <div style="font-size: 14px; line-height: 1.8; color: #666; margin-bottom: 30px;">
                    We've sent a password reset link to your email address.
                    Click the link in the email to reset your password.
                </div>
                <button style="padding: 12px 30px; background: #667eea; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Back to Login</button>
            </div>
        `,
        issues: [
            { id: 1, text: "Doesn't show which email address was used", category: "Confirmation", correct: true },
            { id: 2, text: "No 'didn't receive email' help option", category: "Error Recovery", correct: true },
            { id: 3, text: "No indication of how long email might take", category: "Expectation", correct: true },
            { id: 4, text: "Doesn't mention checking spam folder", category: "Guidance", correct: true },
            { id: 5, text: "No option to resend email", category: "Recovery", correct: true },
            { id: 6, text: "Success icon should be animated", category: "Visual", correct: false }
        ],
        hints: [
            "What if the user entered the wrong email?",
            "What if the email doesn't arrive?",
            "What context helps users know what to do next?"
        ],
        explanation: "Password reset flows should show the email address used, set time expectations, provide resend options, and guide users to check spam. This design assumes everything works perfectly."
    },
    {
        title: "Social Media Comment Section",
        difficulty: "medium",
        description: "Comments area under a social media post",
        mockup: `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <div style="font-weight: bold; margin-bottom: 15px;">Comments (127)</div>
                <div style="margin-bottom: 20px;">
                    <textarea placeholder="Add a comment..." style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; min-height: 60px; resize: vertical;"></textarea>
                    <div style="text-align: right; margin-top: 10px;">
                        <button style="padding: 10px 24px; background: #667eea; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Post</button>
                    </div>
                </div>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">User123</div>
                    <div style="font-size: 14px; color: #333; margin-bottom: 10px;">Great post! Thanks for sharing this information with us all.</div>
                    <div style="font-size: 12px; color: #999;">2h ago</div>
                </div>
                <div style="background: #fff; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <div style="font-weight: bold; margin-bottom: 5px;">JaneDoe</div>
                    <div style="font-size: 14px; color: #333; margin-bottom: 10px;">I disagree with this completely.</div>
                    <div style="font-size: 12px; color: #999;">5h ago</div>
                </div>
            </div>
        `,
        issues: [
            { id: 1, text: "No sort/filter options (newest, oldest, top)", category: "Organization", correct: true },
            { id: 2, text: "Missing like/react functionality on comments", category: "Engagement", correct: true },
            { id: 3, text: "No way to reply to specific comments (threading)", category: "Conversation", correct: true },
            { id: 4, text: "No report/block options for inappropriate content", category: "Safety", correct: true },
            { id: 5, text: "Can't edit or delete own comments", category: "Control", correct: true },
            { id: 6, text: "Comments should have profile pictures", category: "Visual", correct: false }
        ],
        hints: [
            "How would users navigate through 127 comments?",
            "What if someone wants to respond to a specific person?",
            "What if a user posts something inappropriate?"
        ],
        explanation: "Comment sections need organization (sorting), engagement (likes/replies), and moderation (reporting). This basic implementation lacks features users expect from social platforms."
    }
];

export const INITIAL_STATE: GameState = {
    testCases: TEST_CASES,
    currentCaseIndex: 0,
    score: 0,
    totalCorrectFound: 0,
    totalCorrectAvailable: 0,
    selectedIssues: new Set()
};

export function toggleIssueSelection(state: GameState, issueId: number): GameState {
    const newSelected = new Set(state.selectedIssues);
    if (newSelected.has(issueId)) {
        newSelected.delete(issueId);
    } else {
        newSelected.add(issueId);
    }
    return { ...state, selectedIssues: newSelected };
}

export function checkAnswers(state: GameState): { newState: GameState, caseResults: any } {
    const currentCase = state.testCases[state.currentCaseIndex];
    let correct = 0;
    let falsePositives = 0;

    currentCase.issues.forEach(issue => {
        const wasSelected = state.selectedIssues.has(issue.id);
        if (issue.correct && wasSelected) {
            correct++;
        } else if (!issue.correct && wasSelected) {
            falsePositives++;
        }
    });

    const totalCorrectInCase = currentCase.issues.filter(i => i.correct).length;
    const points = Math.max(0, (correct * 20) - (falsePositives * 10));

    const newState = {
        ...state,
        score: state.score + points,
        totalCorrectFound: state.totalCorrectFound + correct,
        totalCorrectAvailable: state.totalCorrectAvailable + totalCorrectInCase
    };

    return {
        newState,
        caseResults: {
            correct,
            total: totalCorrectInCase,
            falsePositives,
            points
        }
    };
}

export function nextCase(state: GameState): GameState {
    if (state.currentCaseIndex >= state.testCases.length) return state;

    return {
        ...state,
        currentCaseIndex: state.currentCaseIndex + 1,
        selectedIssues: new Set()
    };
}

export function resetGame(): GameState {
    return { ...INITIAL_STATE, selectedIssues: new Set() };
}
