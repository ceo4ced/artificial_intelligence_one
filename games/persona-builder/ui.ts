
import {
    GameState, INITIAL_STATE, SCENARIOS,
    submitAnalysis, submitQuoteMatches, submitFinalInsights, nextPhase, resetGame
} from './engine.js';

let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const content = document.getElementById('gameContent')!;
const phaseIndicator = document.getElementById('phaseIndicator')!;
const progressBar = document.getElementById('progressBar')!;
const currentPhaseEl = document.getElementById('currentPhase')!;
const totalScoreEl = document.getElementById('totalScore')!;
const accuracyEl = document.getElementById('accuracy')!;
const bestScoreEl = document.getElementById('bestScore')!;
const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;

function init() {
    (window as any).submitAnswer = handleSubmit;
    (window as any).skipPhase = handleSkip;
    (window as any).resetGame = handleReset;
    (window as any).closeModal = closeModal;

    loadPhase();
    updateStats();
}

function loadPhase() {
    const scenario = SCENARIOS[appState.currentScenario];
    updateProgress();

    // Phase 0-2: Interviews
    if (appState.currentPhase < 3) {
        const interview = scenario.interviews[appState.currentPhase];
        phaseIndicator.textContent = `Phase ${appState.currentPhase + 1}: Interview with ${interview.name}`;

        content.innerHTML = `
            <div class="challenge-card">
                <h3>📋 User Interview: ${interview.name}, ${interview.age}, ${interview.occupation}</h3>
                <p style="margin-bottom: 15px; color: #666;">Read the interview below and identify key insights:</p>
                ${interview.quotes.map(q => `<div class="interview-quote">"${q}"</div>`).join('')}
                
                <div style="margin-top: 25px; background: #fff; padding: 20px; border-radius: 8px;">
                    <h4 style="color: #667eea; margin-bottom: 15px;">What are ${interview.name}'s main pain points? (Identify 2-3)</h4>
                    <textarea class="input-field" id="painPointsInput" placeholder="Example: Slow delivery times, expensive fees, confusing interface..."></textarea>
                    
                    <h4 style="color: #667eea; margin: 15px 0;">What are ${interview.name}'s primary goals?</h4>
                    <textarea class="input-field" id="goalsInput" placeholder="Example: Save money, order quickly, feed family..."></textarea>
                    
                    <h4 style="color: #667eea; margin: 15px 0;">Describe ${interview.name}'s behavior patterns:</h4>
                    <textarea class="input-field" id="behaviorsInput" placeholder="Example: Orders frequently, price-conscious, reads reviews..."></textarea>
                </div>
            </div>
        `;

        submitBtn.textContent = 'Submit Analysis';
        submitBtn.onclick = handleAnalysisSubmit;
    }
    // Phase 3: Quote Matching
    else if (appState.currentPhase === 3) {
        phaseIndicator.textContent = 'Phase 4: Match Quotes to Personas';

        const personasHTML = scenario.interviews.map((p, i) => `
            <div class="persona-card" style="margin: 15px 0;">
                <h4>${p.name}, ${p.age} - ${p.occupation}</h4>
                <div class="persona-details">
                    <strong>Pain Points:</strong> ${p.painPoints.join(', ')}<br>
                    <strong>Goals:</strong> ${p.goals.join(', ')}<br>
                    <strong>Behaviors:</strong> ${p.behaviors.join(', ')}
                </div>
                <div class="drop-zone" id="dropZone${i}" data-persona="${i}">
                    <p style="color: #999; text-align: center;">Drop quotes here for ${p.name}</p>
                </div>
            </div>
        `).join('');

        const quotesHTML = scenario.matchingQuotes.map((q, i) => `
            <div class="draggable-quote" draggable="true" id="quote${i}" data-quote="${i}">
                "${q.text}"
            </div>
        `).join('');

        content.innerHTML = `
            <div class="challenge-card">
                <h3>🎯 Match These Quotes to the Correct Persona</h3>
                <p style="margin-bottom: 20px; color: #666;">Drag each quote to the persona who would most likely say it:</p>
                
                <div style="background: #fff9c4; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="color: #f57c00; margin-bottom: 10px;">Quotes to Match:</h4>
                    ${quotesHTML}
                </div>
                
                <h4 style="margin: 20px 0;">Personas:</h4>
                ${personasHTML}
            </div>
        `;

        setupDragAndDrop();
        submitBtn.textContent = 'Check Matches';
        submitBtn.onclick = handleMatchSubmit;
    }
    // Phase 4: Final Insights
    else {
        phaseIndicator.textContent = 'Phase 5: Key Insights';

        content.innerHTML = `
            <div class="challenge-card">
                <h3>🎯 Final Challenge: Identify Design Opportunities</h3>
                <p style="margin-bottom: 20px; color: #666;">Based on all three personas, what are the biggest design opportunities?</p>
                
                <h4 style="color: #667eea; margin: 15px 0;">What problem should the design prioritize?</h4>
                <textarea class="input-field" id="priorityInput" placeholder="Which pain point affects multiple users and has the biggest impact?"></textarea>
                
                <h4 style="color: #667eea; margin: 15px 0;">Write a "How Might We" question:</h4>
                <input type="text" class="input-field" id="hmwInput" placeholder="How might we...">
                
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <h4 style="color: #2e7d32;">💡 Tip:</h4>
                    <p style="color: #4a5568; line-height: 1.6;">Think about patterns across all three users. What would benefit Sarah, Mike, AND Lisa?</p>
                </div>
            </div>
        `;

        submitBtn.textContent = 'Complete Game';
        submitBtn.onclick = handleFinalSubmit;
    }
}

function handleAnalysisSubmit() {
    const painPoints = (document.getElementById('painPointsInput') as HTMLTextAreaElement).value.trim();
    const goals = (document.getElementById('goalsInput') as HTMLTextAreaElement).value.trim();
    const behaviors = (document.getElementById('behaviorsInput') as HTMLTextAreaElement).value.trim();

    const { newState, points, valid } = submitAnalysis(appState, painPoints, goals, behaviors);

    if (!valid) {
        showFeedback(false, 'Please fill in all fields before submitting!', 'Incomplete Analysis');
        return;
    }

    appState = newState;
    const interview = SCENARIOS[appState.currentScenario].interviews[appState.currentPhase];

    showFeedback(true,
        `Great analysis! You've identified key insights about ${interview.name}. ` +
        `Understanding these patterns is crucial for building accurate personas. +${points} points!`,
        'Good Work!'
    );

    setTimeout(() => {
        appState = nextPhase(appState);
        loadPhase();
        updateStats();
        closeModal();
    }, 2000);
}

function handleMatchSubmit() {
    const dropZones = document.querySelectorAll('.drop-zone');
    const matches: { quoteIndex: number, personaIndex: number }[] = [];

    dropZones.forEach((zone: any) => {
        const personaIndex = parseInt(zone.getAttribute('data-persona'));
        const quotesInZone = zone.querySelectorAll('.draggable-quote');
        quotesInZone.forEach((quoteEl: any) => {
            const quoteIndex = parseInt(quoteEl.getAttribute('data-quote'));
            matches.push({ quoteIndex, personaIndex });
        });
    });

    const { newState, points, correctCount, matchesResults } = submitQuoteMatches(appState, matches);
    appState = newState;

    // Visual feedback
    // Re-scanning DOM to apply styles, this is a bit coupled but fine for UI layer
    let matchIdx = 0;
    dropZones.forEach((zone: any) => {
        const quotesInZone = zone.querySelectorAll('.draggable-quote');
        quotesInZone.forEach((quoteEl: any) => {
            const isCorrect = matchesResults[matchIdx];
            if (isCorrect) {
                quoteEl.style.borderColor = '#4CAF50';
                quoteEl.style.background = '#c8e6c9';
            } else {
                quoteEl.style.borderColor = '#f44336';
                quoteEl.style.background = '#ffcdd2';
            }
            matchIdx++;
        });
    });

    const total = SCENARIOS[appState.currentScenario].matchingQuotes.length;
    const percentage = Math.round((correctCount / total) * 100);

    showFeedback(
        percentage >= 70,
        `You matched ${correctCount} out of ${total} quotes correctly (${percentage}%)! ` +
        (percentage >= 70 ?
            `Excellent empathy skills! You understand these personas well. +${points} points!` :
            `Keep practicing! Try to match behaviors and pain points to the quotes. +${points} points.`
        ),
        percentage >= 70 ? 'Great Job!' : 'Keep Learning!'
    );

    setTimeout(() => {
        appState = nextPhase(appState);
        loadPhase();
        updateStats();
        closeModal();
    }, 3000);
}

function handleFinalSubmit() {
    const priority = (document.getElementById('priorityInput') as HTMLTextAreaElement).value.trim();
    const hmw = (document.getElementById('hmwInput') as HTMLInputElement).value.trim();

    const { newState, valid } = submitFinalInsights(appState, priority, hmw);

    if (!valid) {
        showFeedback(false, 'Please complete both fields!', 'Incomplete');
        return;
    }

    appState = newState;

    showFeedback(true,
        `Excellent work completing the Persona Builder! You've developed strong empathy skills and learned ` +
        `how to synthesize user research into actionable insights. Your "How Might We" question will guide ` +
        `the ideation phase. Final Score: ${appState.score} points!`,
        '🎉 Game Complete!'
    );

    setTimeout(() => {
        handleReset();
        closeModal();
    }, 4000);
}


function setupDragAndDrop() {
    const quotes = document.querySelectorAll('.draggable-quote');
    const dropZones = document.querySelectorAll('.drop-zone');

    quotes.forEach(quote => {
        quote.addEventListener('dragstart', (e: any) => {
            e.dataTransfer.setData('text/plain', e.target.id);
            e.target.classList.add('dragging');
        });

        quote.addEventListener('dragend', (e: any) => {
            e.target.classList.remove('dragging');
        });

        quote.addEventListener('click', (e: any) => {
            // Allow clicking to remove from drop zone
            if (e.target.parentElement.classList.contains('drop-zone')) {
                document.querySelector('[style*="padding: 15px"]')?.appendChild(e.target);
            }
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e: any) => {
            e.preventDefault();
            zone.classList.add('drag-over');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('drag-over');
        });

        zone.addEventListener('drop', (e: any) => {
            e.preventDefault();
            zone.classList.remove('drag-over');
            const quoteId = e.dataTransfer.getData('text/plain');
            const quote = document.getElementById(quoteId);

            if (quote) {
                // Remove placeholder text if present
                const placeholder = zone.querySelector('p');
                if (placeholder) placeholder.remove();

                zone.appendChild(quote);
            }
        });
    });
}

function handleSkip() {
    if (confirm('Skip this phase? You won\'t earn points.')) {
        appState = nextPhase(appState);
        if (appState.currentPhase >= 5) {
            handleReset();
        } else {
            loadPhase();
            updateStats();
        }
    }
}

function handleReset() {
    appState = resetGame();
    loadPhase();
    updateStats();
}

// Helper functions for UI updates
function updateProgress() {
    const progress = (appState.currentPhase / 5) * 100;
    progressBar.style.width = progress + '%';
    currentPhaseEl.textContent = `${appState.currentPhase + 1}/5`;
}

function updateStats() {
    totalScoreEl.textContent = appState.score.toString();
    const accuracy = appState.totalAttempts > 0 ? Math.round((appState.totalCorrect / appState.totalAttempts) * 100) : 0;
    accuracyEl.textContent = accuracy + '%';

    const savedBest = localStorage.getItem('personaBuilderBest') || '0';
    let bestScore = parseInt(savedBest);
    if (appState.score > bestScore) {
        localStorage.setItem('personaBuilderBest', appState.score.toString());
        bestScore = appState.score;
    }
    bestScoreEl.textContent = bestScore.toString();
}

function showFeedback(isCorrect: boolean, message: string, title: string) {
    const modal = document.getElementById('feedbackModal')!;
    const overlay = document.getElementById('modalOverlay')!;

    modal.className = 'feedback-modal show ' + (isCorrect ? 'correct' : 'incorrect');
    overlay.className = 'modal-overlay show';

    document.getElementById('feedbackTitle')!.textContent = title;
    document.getElementById('feedbackText')!.textContent = message;
}

function closeModal() {
    document.getElementById('feedbackModal')!.classList.remove('show');
    document.getElementById('modalOverlay')!.classList.remove('show');
}

// Handle generic submit (this is just a placeholder if needed, but we assign specific handlers above)
function handleSubmit() {
    // This function is dynamically assigned/overridden in loadPhase
}

init();
