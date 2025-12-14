
import {
    NLPGameState, INITIAL_STATE, Sentiment, getRandomReview, processClassification,
    processChallengeRound, getAiPrediction
} from './engine.js';

// Global State
let appState: NLPGameState = { ...INITIAL_STATE };

// DOM Elements
const trainingModeDiv = document.getElementById('trainingMode')!;
const challengeModeDiv = document.getElementById('challengeMode')!;
const totalReviewsEl = document.getElementById('totalReviews')!;
const accuracyEl = document.getElementById('accuracy')!;
const streakEl = document.getElementById('streak')!;
const scoreEl = document.getElementById('score')!;
const progressFill = document.getElementById('progressFill')!;
const reviewTextEl = document.getElementById('reviewText')!;
const sentimentButtons = document.getElementById('sentimentButtons')!;
const wordCloud = document.getElementById('wordCloud')!;
const challengeReviewTextEl = document.getElementById('challengeReviewText')!;
const challengeButtons = document.getElementById('challengeButtons')!;
const aiPredictionDiv = document.getElementById('aiPrediction')!;
const aiGuessEl = document.getElementById('aiGuess')!;
const yourWinsEl = document.getElementById('yourWins')!;
const aiWinsEl = document.getElementById('aiWins')!;
const feedbackOverlay = document.getElementById('feedback')!;

// UI Updates

function updateStatsUI() {
    totalReviewsEl.textContent = appState.totalReviews.toString();
    const acc = appState.totalReviews > 0 ? Math.round((appState.correctAnswers / appState.totalReviews) * 100) : 0;
    accuracyEl.textContent = `${acc}%`;
    streakEl.textContent = appState.streak.toString();
    scoreEl.textContent = appState.score.toString();
    yourWinsEl.textContent = `${appState.yourWins} wins`;
    aiWinsEl.textContent = `${appState.aiWins} wins`;

    const pct = (appState.trainingProgress / 10) * 100;
    progressFill.style.width = `${pct}%`;
    progressFill.textContent = `${appState.trainingProgress} / 10`;
}

function showFeedback(message: string, correct: boolean) {
    feedbackOverlay.textContent = message;
    feedbackOverlay.className = 'feedback-overlay show ' + (correct ? 'correct' : 'incorrect');
    setTimeout(() => feedbackOverlay.classList.remove('show'), 1200);
}

// Actions

function handleSetMode(mode: 'training' | 'challenge') {
    appState.gameMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        if (btn.textContent?.toLowerCase().includes(mode)) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    if (mode === 'training') {
        trainingModeDiv.style.display = 'block';
        challengeModeDiv.style.display = 'none';
    } else {
        trainingModeDiv.style.display = 'none';
        challengeModeDiv.style.display = 'block';
    }
}

function handleStartTraining() {
    // Reset training specific progress if needed, or just continue
    appState.trainingProgress = 0;
    updateStatsUI();

    appState.currentReview = getRandomReview();
    reviewTextEl.textContent = appState.currentReview.text;
    sentimentButtons.style.display = 'flex';
}

function handleClassify(choice: Sentiment) {
    const { newState, correct } = processClassification(appState, choice);
    appState = newState;

    if (correct) {
        showFeedback('✓ Correct!', true);
    } else {
        showFeedback(`✗ Wrong! It was ${appState.currentReview?.sentiment}`, false);
    }

    updateStatsUI();

    if (appState.trainingProgress >= 10 && appState.gameMode === 'training') {
        showFeedback('Training Complete! 🎉', true);
        sentimentButtons.style.display = 'none';
        return;
    }

    setTimeout(() => {
        appState.currentReview = getRandomReview();
        reviewTextEl.textContent = appState.currentReview.text;
    }, 1500);
}

function handleStartChallenge() {
    appState.currentReview = getRandomReview();
    challengeReviewTextEl.textContent = appState.currentReview.text;
    challengeButtons.style.display = 'flex';
    aiPredictionDiv.style.display = 'none';
}

function handleChallengeClassify(choice: Sentiment) {
    if (!appState.currentReview) return;

    // AI Generate
    const { choice: aiChoice, correct: aiCorrect } = getAiPrediction(appState.currentReview.sentiment);

    const { newState, result } = processChallengeRound(appState, choice, aiCorrect);
    appState = newState;

    // UI Feedback
    aiPredictionDiv.style.display = 'block';
    aiGuessEl.textContent = `${aiChoice} ${aiCorrect ? '✓' : '✗'}`;

    let msg = '';
    let isPositive = false;

    switch (result) {
        case 'win': msg = 'You Win! 🏆'; isPositive = true; break;
        case 'loss': msg = 'AI Wins! 🤖'; isPositive = false; break;
        case 'tie': msg = 'Tie! Both Correct ⚖️'; isPositive = true; break;
        case 'both_wrong': msg = `Both Wrong! It was ${appState.currentReview?.sentiment}`; isPositive = false; break;
    }

    showFeedback(msg, isPositive);
    updateStatsUI();
    challengeButtons.style.display = 'none';

    setTimeout(() => {
        handleStartChallenge();
    }, 2500);
}

function handleShowWordCloud() {
    if (wordCloud.style.display === 'none') {
        wordCloud.style.display = 'flex';

        let html = '<h3 style="width: 100%; text-align: center; margin-bottom: 15px;">Word Importance Cloud</h3>';

        appState.learnedWords.positive.forEach(word => {
            const size = 12 + Math.random() * 20;
            html += `<div class="word" style="background: rgba(76, 175, 80, 0.3); font-size: ${size}px;">${word}</div>`;
        });

        appState.learnedWords.negative.forEach(word => {
            const size = 12 + Math.random() * 20;
            html += `<div class="word" style="background: rgba(244, 67, 54, 0.3); font-size: ${size}px;">${word}</div>`;
        });

        if (appState.learnedWords.positive.length === 0 && appState.learnedWords.negative.length === 0) {
            html += '<p style="color: #999;">Classify some reviews to see important words!</p>';
        }
        wordCloud.innerHTML = html;
    } else {
        wordCloud.style.display = 'none';
    }
}

// Global Exports
(window as any).setMode = handleSetMode;
(window as any).startTraining = handleStartTraining;
(window as any).classify = handleClassify;
(window as any).startChallenge = handleStartChallenge;
(window as any).challengeClassify = handleChallengeClassify;
(window as any).showWordCloud = handleShowWordCloud;

// Init
updateStatsUI();
