
import { generateDataset, calculateStats, Dataset, SimulationStats, DataPoint } from './engine';

// 🏠 State
let currentDataset: Dataset = generateDataset('balanced');

// 🖥️ UI References
const canvas = document.getElementById('biasCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const explanationEl = document.getElementById('demoExplanation')!;

// 🎨 Drawing Logic
function drawDataPoints(dataset: Dataset) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, 350);
    ctx.lineTo(750, 350);
    ctx.moveTo(50, 50);
    ctx.lineTo(50, 350);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.fillText('Qualification Score', 350, 385);
    ctx.save();
    ctx.translate(15, 200);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Selection Rate', 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 16px Arial';
    ctx.fillText(dataset.type === 'balanced' ? 'Balanced Training Data' : 'Biased Training Data', 280, 30);

    // Helper to draw points
    const drawPoint = (p: DataPoint, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    };

    // Draw Group A (Blue)
    dataset.groupA.forEach(p => drawPoint(p, 'rgba(33, 150, 243, 0.7)'));

    // Draw Group B (Red)
    dataset.groupB.forEach(p => drawPoint(p, 'rgba(244, 67, 54, 0.7)'));

    // Legend
    drawLegend();
}

function drawLegend() {
    ctx.fillStyle = 'rgba(33, 150, 243, 0.7)';
    ctx.fillRect(560, 60, 15, 15);
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.fillText('Group A', 580, 72);

    ctx.fillStyle = 'rgba(244, 67, 54, 0.7)';
    ctx.fillRect(560, 85, 15, 15);
    ctx.fillStyle = '#333';
    ctx.fillText('Group B', 580, 97);
}

function drawImpact(type: 'balanced' | 'biased') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Impact on Model Performance', 280, 30);

    const isBalanced = type === 'balanced';

    // We replicate the original visual style but dynamic
    // Let's stick to the "Two Column" comparison look if we want to show difference, 
    // OR just show the current state's impact. 
    // The original showed BOTH side-by-side for "Impact". Let's preserve that "Impact" view shows the comparison.

    // Actually, 'showImpact' in original was a static view comparing both.
    // Let's make it a dedicated view that uses the pure stats function to get the numbers.

    const balancedStats = calculateStats({ groupA: [], groupB: [], type: 'balanced' }); // fast mock for stats
    const biasedStats = calculateStats({ groupA: [], groupB: [], type: 'biased' });

    // Render Balanced Column
    renderStatBar(100, 100, balancedStats.groupAAccuracy, 'Group A', '#4CAF50');
    renderStatBar(100, 160, balancedStats.groupBAccuracy, 'Group B', '#4CAF50');
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('With Balanced Data', 160, 230);

    // Render Biased Column
    renderStatBar(450, 100, biasedStats.groupAAccuracy, 'Group A', '#4CAF50');
    renderStatBar(450, 160, biasedStats.groupBAccuracy, 'Group B', '#f44336');
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('With Biased Data', 510, 230);

    // Warning
    ctx.fillStyle = '#f44336';
    ctx.font = '40px Arial';
    ctx.fillText('⚠', 620, 192);
}

function renderStatBar(x: number, y: number, accuracy: number, label: string, color: string) {
    const width = 250 * accuracy; // Scale bar
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, 40);
    ctx.fillStyle = '#fff';
    ctx.font = '14px Arial';
    ctx.fillText(`${label}: ${(accuracy * 100).toFixed(0)}% Accuracy`, x + 40, y + 25);
}


// 🎮 Event Handlers/Actions
(window as any).showBalancedData = () => {
    currentDataset = generateDataset('balanced');
    drawDataPoints(currentDataset);
    explanationEl.innerHTML =
        '<strong>Balanced Data:</strong> Both Group A (blue) and Group B (red) are equally represented ' +
        'in the training data. This gives the AI a fair chance to learn patterns for both groups.';
};

(window as any).showBiasedData = () => {
    currentDataset = generateDataset('biased');
    drawDataPoints(currentDataset);
    explanationEl.innerHTML =
        '<strong>Biased Data:</strong> Group A (blue) has 80 examples while Group B (red) only has 20. ' +
        'The AI will learn much more about Group A and may perform poorly on Group B, or even ignore them entirely.';
};

(window as any).showImpact = () => {
    // For impact view, we calculate stats to ensure we use our functional core
    // But conceptually the view compares both states.
    // const stats = calculateStats(currentDataset); // Unused for now as we show full comparison
    drawImpact(currentDataset.type);

    explanationEl.innerHTML =
        '<strong>The Impact:</strong> When training data is biased, the AI performs much worse on ' +
        'under-represented groups. This can lead to unfair outcomes. Fair AI requires balanced, representative data.';
};

// Initial Render
(window as any).showBalancedData();
