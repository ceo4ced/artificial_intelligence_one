
import {
    GameState, INITIAL_STATE, EXAMPLE_PROMPTS,
    analyzeCustomText, SensitiveItem
} from './engine.js';

// State
let appState: GameState = { ...INITIAL_STATE };

// DOM Elements
const riskValueEl = document.getElementById('riskValue')!;
const riskLabelEl = document.getElementById('riskLabel')!;
const meterFillEl = document.getElementById('meterFill')!;
const analyzedEl = document.getElementById('analyzed')!;
const sensitiveCountEl = document.getElementById('sensitiveCount')!;
const avgRiskEl = document.getElementById('avgRisk')!;
const progressBarEl = document.getElementById('progressBar')!;
const promptTitleEl = document.getElementById('promptTitle')!;
const promptDisplayEl = document.getElementById('promptDisplay')!;
const inferencesDiv = document.getElementById('inferences')!;
const saferVersionEl = document.getElementById('saferVersion')!;
const whySaferEl = document.getElementById('whySafer')!;
const customInputSectionEl = document.getElementById('customInputSection')!;
const exampleSectionEl = document.getElementById('exampleSection')!;
const customPromptEl = document.getElementById('customPrompt') as HTMLTextAreaElement;

function init() {
    loadPrompt();
    updateStatsUI();
}

function loadPrompt() {
    if (appState.isCustomMode) return;

    const prompt = EXAMPLE_PROMPTS[appState.currentPromptIndex];

    promptTitleEl.textContent = `Example ${appState.currentPromptIndex + 1}: ${prompt.title}`;

    const highlightedText = highlightSensitiveData(prompt.text, prompt.sensitiveData);
    promptDisplayEl.innerHTML = highlightedText;

    // Update inferences
    inferencesDiv.innerHTML = '';
    prompt.inferences.forEach(inference => {
        const inferenceItem = document.createElement('div');
        inferenceItem.className = 'inference-item';
        inferenceItem.innerHTML = `<span style="color: #f57c00;">▸</span> ${inference}`;
        inferencesDiv.appendChild(inferenceItem);
    });

    // Update safer version
    saferVersionEl.textContent = prompt.saferVersion;
    whySaferEl.textContent = prompt.whySafer;

    // Update risk meter
    updateRiskMeter(prompt.riskScore);

    // Update stats logic
    if (appState.totalAnalyzed < appState.currentPromptIndex + 1) {
        appState.totalAnalyzed = appState.currentPromptIndex + 1;
        appState.totalRiskSum += prompt.riskScore;
        appState.totalSensitiveItems += prompt.sensitiveData.length;
    }
    updateStatsUI();
}

function updateRiskMeter(riskScore: number) {
    riskValueEl.textContent = riskScore.toString();
    meterFillEl.style.width = riskScore + '%';

    if (riskScore <= 30) {
        meterFillEl.style.background = '#4CAF50';
        riskLabelEl.textContent = 'LOW RISK';
        riskLabelEl.style.color = '#fff';
    } else if (riskScore <= 70) {
        meterFillEl.style.background = '#FFC107';
        riskLabelEl.textContent = 'MEDIUM RISK';
        riskLabelEl.style.color = '#fff';
    } else {
        meterFillEl.style.background = '#f44336';
        riskLabelEl.textContent = 'HIGH RISK';
        riskLabelEl.style.color = '#fff';
    }
}

function highlightSensitiveData(text: string, sensitiveData: SensitiveItem[]): string {
    let highlightedText = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedData = [...sensitiveData].sort((a, b) => b.text.length - a.text.length);

    sortedData.forEach((item) => {
        const regex = new RegExp(escapeRegExp(item.text), 'g');
        const replacement = `<span class="highlight-sensitive">${item.text}<span class="tooltip">${item.type}: ${item.reason}</span></span>`;
        highlightedText = highlightedText.replace(regex, replacement);
    });

    return highlightedText;
}

function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function updateStatsUI() {
    analyzedEl.textContent = `${appState.totalAnalyzed}/${EXAMPLE_PROMPTS.length}`;
    sensitiveCountEl.textContent = appState.totalSensitiveItems.toString();
    const avgRisk = appState.totalAnalyzed > 0 ? Math.round(appState.totalRiskSum / appState.totalAnalyzed) : 0;
    avgRiskEl.textContent = avgRisk + '%';

    const progress = (appState.totalAnalyzed / EXAMPLE_PROMPTS.length) * 100;
    progressBarEl.style.width = progress + '%';
}

function handleNextPrompt() {
    if (appState.isCustomMode) {
        appState.isCustomMode = false;
        customInputSectionEl.style.display = 'none';
        exampleSectionEl.style.display = 'block';
        loadPrompt();
        return;
    }

    appState.currentPromptIndex++;
    if (appState.currentPromptIndex >= EXAMPLE_PROMPTS.length) {
        showFinalSummary();
        return;
    }

    loadPrompt();
}

function handleShowCustomInput() {
    appState.isCustomMode = true;
    customInputSectionEl.style.display = 'block';
    exampleSectionEl.style.display = 'none';
    promptTitleEl.textContent = 'Analyze Your Own Prompt';
    customPromptEl.value = '';
}

function handleHideCustomInput() {
    appState.isCustomMode = false;
    customInputSectionEl.style.display = 'none';
    exampleSectionEl.style.display = 'block';
    loadPrompt();
}

function handleAnalyzeCustomPrompt() {
    const customText = customPromptEl.value.trim();

    if (!customText) {
        alert('Please enter a prompt to analyze!');
        return;
    }

    // Simple analysis
    const analysis = analyzeCustomText(customText);

    // Switch to analysis view
    customInputSectionEl.style.display = 'none';
    exampleSectionEl.style.display = 'block';
    promptTitleEl.textContent = 'Your Custom Prompt Analysis';

    // Display analyzed prompt
    const highlightedText = highlightSensitiveData(customText, analysis.sensitiveData);
    promptDisplayEl.innerHTML = highlightedText;

    // Update inferences
    inferencesDiv.innerHTML = '';
    analysis.inferences.forEach(inference => {
        const inferenceItem = document.createElement('div');
        inferenceItem.className = 'inference-item';
        inferenceItem.innerHTML = `<span style="color: #f57c00;">▸</span> ${inference}`;
        inferencesDiv.appendChild(inferenceItem);
    });

    // Update safer version
    saferVersionEl.textContent = analysis.saferVersion;
    whySaferEl.textContent = analysis.whySafer;

    // Update risk meter
    updateRiskMeter(analysis.riskScore);

    // Update stats
    appState.totalAnalyzed++;
    appState.totalRiskSum += analysis.riskScore;
    appState.totalSensitiveItems += analysis.sensitiveData.length;
    updateStatsUI();
}

function showFinalSummary() {
    const avgRisk = appState.totalAnalyzed > 0 ? Math.round(appState.totalRiskSum / appState.totalAnalyzed) : 0;
    let message = `Analysis Complete!\n\n`;
    message += `Prompts Analyzed: ${appState.totalAnalyzed}\n`;
    message += `Sensitive Items Found: ${appState.totalSensitiveItems}\n`;
    message += `Average Risk Level: ${avgRisk}%\n\n`;

    if (avgRisk >= 80) {
        message += '🚨 HIGH RISK: Most examples revealed significant private information. Always minimize personal details when using AI!';
    } else if (avgRisk >= 50) {
        message += '⚠️ MEDIUM RISK: Be more cautious about what you share with AI systems.';
    } else {
        message += '✅ You\'re learning good privacy practices! Keep protecting your data.';
    }

    alert(message);
}

function handleResetGame() {
    appState = { ...INITIAL_STATE };
    customInputSectionEl.style.display = 'none';
    exampleSectionEl.style.display = 'block';
    loadPrompt();
    updateStatsUI();
}

// Global exports
(window as any).nextPrompt = handleNextPrompt;
(window as any).showCustomInput = handleShowCustomInput;
(window as any).hideCustomInput = handleHideCustomInput;
(window as any).analyzeCustomPrompt = handleAnalyzeCustomPrompt;
(window as any).resetGame = handleResetGame;

// Start
init();
