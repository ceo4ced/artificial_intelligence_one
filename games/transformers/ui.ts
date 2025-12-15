
import {
    GameState, INITIAL_STATE, SENTENCES,
    startGame, checkAnswer, nextQuestion, resetGame
} from './engine.js';

let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const questionCountEl = document.getElementById('question')!;
const correctCountEl = document.getElementById('correct')!;
const wrongCountEl = document.getElementById('wrong')!;
const streakEl = document.getElementById('streak')!;
const scoreEl = document.getElementById('score')!;
const displayArea = document.getElementById('displayArea')!;

function init() {
    (window as any).startGame = handleStartGame;
    (window as any).nextQuestion = handleNextQuestion;
    (window as any).reset = handleReset;
    (window as any).selectWord = handleSelectWord; // Important to expose this

    updateStats();
}

function handleStartGame() {
    if (appState.gameActive) return;
    appState = startGame();
    handleNextQuestion(); // Start immediately with first question
}

function handleNextQuestion() {
    if (!appState.gameActive) {
        alert('Please start the game first!');
        return;
    }

    // Check global limit
    if (appState.currentQuestionIndex >= SENTENCES.length * 2) {
        showEndGame();
        return;
    }

    // Logic in engine doesn't auto-increment on start, so we might need to handle "initially 0" vs "next".
    // Actually, in the original game, `startGame` sets index to 0, then calls `nextQuestion` effectively to render.
    // But `nextQuestion` increments. Let's align with engine: engine assumes state holds CURRENT index to answer.
    // So if we just answered, we call nextQuestion to increment.

    // If we haven't answered the *current* question yet (and it's not the start), do nothing or warn?
    // The original checks `gameActive`.

    // Ref: Original logic: 
    // `startGame` -> `currentQuestion = 0; nextQuestion()`
    // `nextQuestion` -> `currentQuestion++` at the END.
    // My engine logic: `nextQuestion` increments index.

    // So:
    // 1. If start: index 0 (done in startGame). Render.
    // 2. If 'Next Question' button: call nextQuestion() -> increments. Then Render.

    // Wait, the button "Next Question" calls `nextQuestion()`

    if (appState.answered) {
        appState = nextQuestion(appState);

        if (!appState.gameActive || appState.currentQuestionIndex >= SENTENCES.length * 2) {
            showEndGame();
            return;
        }
    }

    renderSentence();
    updateStats();
}

function renderSentence() {
    const totalQuestions = SENTENCES.length * 2;
    if (appState.currentQuestionIndex >= totalQuestions) {
        showEndGame();
        return;
    }

    const sentenceIdx = Math.floor(appState.currentQuestionIndex / 2);
    const questionIdx = appState.currentQuestionIndex % 2;
    const currentSentence = SENTENCES[sentenceIdx];
    const question = currentSentence.questions[questionIdx];

    let html = '<div class="question">Which word should the highlighted word attend to?</div>';
    html += '<div class="sentence-text">';

    currentSentence.text.forEach((word, idx) => {
        let className = 'word';
        if (idx === question.target) {
            className += ' target';
        }

        // We use window.selectWord to bridge back to this module
        html += `<span class="${className}" onclick="selectWord(${idx})">${word}</span>`;
    });

    html += '</div>';
    displayArea.innerHTML = html;

    // +1 for display 1-based index
    questionCountEl.textContent = (appState.currentQuestionIndex + 1).toString();
}

function handleSelectWord(selectedIdx: number) {
    if (appState.answered || !appState.gameActive) return;

    const { newState, isCorrect, points, explanation } = checkAnswer(appState, selectedIdx);
    appState = newState;

    // Update word colors
    const words = document.querySelectorAll('.word') as NodeListOf<HTMLElement>;
    const sentenceIdx = Math.floor((appState.currentQuestionIndex) / 2); // Use current index
    const questionIdx = (appState.currentQuestionIndex) % 2;
    const correctIdx = SENTENCES[sentenceIdx].questions[questionIdx].answer;

    words.forEach((word, idx) => {
        word.onclick = null;
        if (idx === correctIdx) {
            word.classList.add('correct');
        } else if (idx === selectedIdx && !isCorrect) {
            word.classList.add('wrong');
        }
    });

    if (isCorrect) {
        setTimeout(() => {
            alert(`✅ Correct! +${points} points\n\n${explanation}`);
            // Auto advance logic is in original, let's keep it?
            // Original: setTimeout(() => nextQuestion or endGame, 2000)
            setTimeout(() => handleNextQuestion(), 1000);
        }, 300);
    } else {
        setTimeout(() => {
            alert(`❌ Wrong!\n\n${explanation}`);
            setTimeout(() => handleNextQuestion(), 1000);
        }, 300);
    }

    updateStats();
}

function updateStats() {
    correctCountEl.textContent = appState.correctCount.toString();
    wrongCountEl.textContent = appState.wrongCount.toString();
    streakEl.textContent = appState.streak.toString();
    scoreEl.textContent = appState.score.toString();
    questionCountEl.textContent = (appState.currentQuestionIndex + 1).toString();
}

function showEndGame() {
    appState.gameActive = false;
    const accuracy = Math.round((appState.correctCount / (appState.correctCount + appState.wrongCount)) * 100) || 0;

    let message = `🎮 Game Complete!\n\n`;
    message += `Final Score: ${appState.score}\n`;
    message += `Correct: ${appState.correctCount}\n`;
    message += `Wrong: ${appState.wrongCount}\n`;
    message += `Accuracy: ${accuracy}%\n\n`;

    if (accuracy >= 90) {
        message += '🏆 Outstanding! You understand attention like a Transformer!';
    } else if (accuracy >= 75) {
        message += '🌟 Great job! You have strong attention skills!';
    } else if (accuracy >= 60) {
        message += '👍 Good effort! Keep practicing attention mechanisms!';
    } else {
        message += '💪 Keep learning! Attention takes practice!';
    }

    alert(message);
    displayArea.innerHTML = '<p style="color: #999; margin-top: 80px;">Click "Start Game" to play again!</p>';
}

function handleReset() {
    appState = resetGame();
    questionCountEl.textContent = '0';
    updateStats();
    displayArea.innerHTML = '<p style="color: #999; margin-top: 80px;">Click "Start Game" to begin!</p>';
}

init();
