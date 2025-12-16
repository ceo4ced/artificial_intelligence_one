
import {
    GameState, INITIAL_STATE, TEST_CASES,
    toggleIssueSelection, checkAnswers, nextCase, resetGame
} from './engine.js';

let appState: GameState = { ...INITIAL_STATE, selectedIssues: new Set() };

// DOM Elements
const totalScoreEl = document.getElementById('totalScore')!;
const caseNumberEl = document.getElementById('caseNumber')!;
const issuesFoundEl = document.getElementById('issuesFound')!;
const accuracyEl = document.getElementById('accuracy')!;
const bestScoreEl = document.getElementById('bestScore')!;
const progressBar = document.getElementById('progressBar')!;
const gameContent = document.getElementById('gameContent')!;


function init() {
    (window as any).toggleIssue = handleToggleIssue;
    (window as any).checkAnswers = handleCheckAnswers;
    (window as any).showHints = handleShowHints;
    (window as any).nextCase = handleNextCase;
    (window as any).resetGame = handleResetGame;

    renderCase();
    updateStats();
}

function renderCase() {
    if (appState.currentCaseIndex >= TEST_CASES.length) {
        showGameComplete();
        return;
    }

    const testCase = TEST_CASES[appState.currentCaseIndex];

    // Clear selections on render if new case (handled by state, but UI needs sync)
    // Actually render recreates DOM, so UI is cleared naturally.

    gameContent.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h2 style="color: #2d3748; margin-bottom: 10px;">
                Case ${appState.currentCaseIndex + 1}: ${testCase.title}
                <span class="difficulty-badge difficulty-${testCase.difficulty}">${testCase.difficulty.toUpperCase()}</span>
            </h2>
            <p style="color: #666; font-size: 1.1em;">${testCase.description}</p>
        </div>

        <div class="mockup-container">
            <h3 style="color: #667eea; margin-bottom: 15px;">🔍 Examine This Design:</h3>
            <div class="mockup" id="mockupArea">
                ${testCase.mockup}
            </div>
        </div>

        <div style="margin-top: 30px;">
            <h3 style="color: #2d3748; margin-bottom: 15px;">🎯 Select All Usability Issues You Can Find:</h3>
            <div class="issue-list" id="issueList">
                ${testCase.issues.map(issue => `
                    <div class="issue-item ${appState.selectedIssues.has(issue.id) ? 'selected' : ''}" onclick="toggleIssue(${issue.id})" data-issue-id="${issue.id}">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <span class="issue-category">${issue.category}</span>
                                <span>${issue.text}</span>
                            </div>
                            <div style="font-size: 1.5em;">${appState.selectedIssues.has(issue.id) ? '✅' : '⬜'}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="hint-box" id="hintBox" style="display: none;">
            <h4 style="color: #0277bd; margin-bottom: 10px;">💡 Hints:</h4>
            <ul style="margin-left: 20px; line-height: 1.8;">
                ${testCase.hints.map(hint => `<li>${hint}</li>`).join('')}
            </ul>
        </div>

        <div class="feedback-panel" id="feedbackPanel"></div>
        <div class="solution-box" id="solutionBox">
            <h4 style="color: #2e7d32; margin-bottom: 10px;">✅ Correct Issues:</h4>
            <ul style="margin-left: 20px; line-height: 1.8;">
                ${testCase.issues.filter(i => i.correct).map(i => `<li><strong>${i.category}:</strong> ${i.text}</li>`).join('')}
            </ul>
            <p style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #4CAF50;"><strong>Explanation:</strong> ${testCase.explanation}</p>
        </div>
    `;

    updateProgress();
    issuesFoundEl.textContent = `0/${testCase.issues.filter(i => i.correct).length}`;
}

function handleToggleIssue(issueId: number) {
    // If solution is shown (panel visible), disable toggling?
    // Original code didn't strictly disable, but let's see. 
    // Original: checkAnswers can be clicked multiple times? No, usually once.
    // Let's assume toggling is allowed until check.

    // Check if checkAnswers has been called (solutionBox visible).
    if (document.getElementById('solutionBox')?.classList.contains('show')) return;

    appState = toggleIssueSelection(appState, issueId);

    // Update UI for singular item
    const issueEl = document.querySelector(`[data-issue-id="${issueId}"]`);
    if (!issueEl) return;

    const checkbox = issueEl.querySelector('div > div:last-child')!;

    if (appState.selectedIssues.has(issueId)) {
        issueEl.classList.add('selected');
        checkbox.textContent = '✅';
    } else {
        issueEl.classList.remove('selected');
        checkbox.textContent = '⬜';
    }

    const testCase = TEST_CASES[appState.currentCaseIndex];
    const correctTotal = testCase.issues.filter(i => i.correct).length;
    issuesFoundEl.textContent = `${appState.selectedIssues.size}/${correctTotal}`; // Showing selected count vs total correct needed?
    // Original code: `${selectedIssues.size}/${correctTotal}` where correctTotal IS total correct avl.
    // Wait, issuesFound usually implies CORRECT found. But before check, it just shows selected count?
    // Original: `updateFoundCount` uses `selectedIssues.size`. So yes, pre-check it shows count.
}

function handleCheckAnswers() {
    // Prevent multiple checks
    if (document.getElementById('solutionBox')?.classList.contains('show')) return;

    const { newState, caseResults } = checkAnswers(appState);
    appState = newState;

    const testCase = TEST_CASES[appState.currentCaseIndex];

    testCase.issues.forEach(issue => {
        const issueEl = document.querySelector(`[data-issue-id="${issue.id}"]`);
        if (!issueEl) return;

        const wasSelected = appState.selectedIssues.has(issue.id);

        if (issue.correct && wasSelected) {
            issueEl.classList.add('correct');
            issueEl.classList.remove('incorrect');
        } else if (!issue.correct && wasSelected) {
            issueEl.classList.add('incorrect');
            issueEl.classList.remove('correct');
        } else if (issue.correct && !wasSelected) {
            (issueEl as HTMLElement).style.opacity = '0.5';
        }
    });

    showFeedback(caseResults.correct, caseResults.total, caseResults.falsePositives, caseResults.points);
    document.getElementById('solutionBox')?.classList.add('show');
    updateStats();
}

function showFeedback(correct: number, total: number, falsePositives: number, points: number) {
    const percentage = Math.round((correct / total) * 100);
    const feedbackPanel = document.getElementById('feedbackPanel')!;

    let message = '';
    if (percentage === 100 && falsePositives === 0) {
        message = '🎉 Perfect! You found all issues and had no false positives!';
    } else if (percentage >= 80) {
        message = '✨ Excellent detective work! You caught most of the issues.';
    } else if (percentage >= 60) {
        message = '👍 Good job! You found several key issues.';
    } else {
        message = '💪 Keep practicing! Try using the hints next time.';
    }

    feedbackPanel.innerHTML = `
        <h4 style="color: #f57c00; margin-bottom: 10px;">${message}</h4>
        <div style="line-height: 1.8;">
            <p>✅ Found: ${correct}/${total} correct issues</p>
            ${falsePositives > 0 ? `<p>⚠️ False positives: ${falsePositives}</p>` : ''}
            <p style="font-weight: bold; margin-top: 10px;">Points earned: ${points}</p>
        </div>
    `;

    feedbackPanel.classList.add('show');
}

function handleShowHints() {
    const hintBox = document.getElementById('hintBox');
    if (hintBox) hintBox.style.display = 'block';
}

function handleNextCase() {
    appState = nextCase(appState);
    caseNumberEl.textContent = (appState.currentCaseIndex + 1).toString();

    if (appState.currentCaseIndex >= TEST_CASES.length) {
        showGameComplete();
    } else {
        renderCase();
    }
}

function showGameComplete() {
    const accuracy = appState.totalCorrectAvailable > 0 ? Math.round((appState.totalCorrectFound / appState.totalCorrectAvailable) * 100) : 0; // Note: original used totalAttempts accumulator. 
    // In original, totalAttempts += totalCorrectIssues. So it IS avail total.

    // Total Correct Found in state is cumulative correct selections.

    gameContent.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <h2 style="color: #4CAF50; font-size: 2.5em; margin-bottom: 20px;">🎉 All Cases Solved!</h2>

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 30px; border-radius: 15px; margin: 30px 0;">
                <div style="font-size: 4em; font-weight: bold; margin-bottom: 10px;">${appState.score}</div>
                <div style="font-size: 1.5em;">Total Points</div>
                <div style="margin-top: 20px;">
                    <div>accuracy: ${accuracy}%</div>
                </div>
            </div>

            <div style="background: #e3f2fd; padding: 25px; border-radius: 10px; margin: 20px 0; text-align: left;">
                <h3 style="color: #1976d2; margin-bottom: 15px;">🎓 What You've Learned:</h3>
                <ul style="line-height: 1.8; margin-left: 20px;">
                    <li>How to identify common usability issues across different interfaces</li>
                    <li>The importance of user feedback, error prevention, and recovery</li>
                    <li>Accessibility considerations (button sizes, visibility, clarity)</li>
                    <li>User control and freedom (undo, cancel, confirm actions)</li>
                    <li>Consistency and standards in interface design</li>
                    <li>How to think like a user during testing</li>
                </ul>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <p style="line-height: 1.8; color: #4a5568;">
                    These are real issues found in actual products! As a designer, your job is to catch
                    these problems before users do. Keep practicing your usability detective skills!
                </p>
            </div>

            <button class="btn-primary" style="max-width: 300px; margin: 20px auto;" onclick="resetGame()">Play Again</button>
        </div>
    `;
}

function handleResetGame() {
    appState = resetGame();
    caseNumberEl.textContent = '1';
    renderCase();
    updateStats();
}

function updateStats() {
    totalScoreEl.textContent = appState.score.toString();
    const accuracy = appState.totalCorrectAvailable > 0 ? Math.round((appState.totalCorrectFound / appState.totalCorrectAvailable) * 100) : 0;
    accuracyEl.textContent = accuracy + '%';

    const bestScore = localStorage.getItem('usabilityDetectiveBest') || '0';
    if (appState.score > parseInt(bestScore)) {
        localStorage.setItem('usabilityDetectiveBest', appState.score.toString());
        bestScoreEl.textContent = appState.score.toString();
    } else {
        bestScoreEl.textContent = bestScore;
    }
}

function updateProgress() {
    const progress = (appState.currentCaseIndex / TEST_CASES.length) * 100;
    progressBar.style.width = progress + '%';
}

init();
