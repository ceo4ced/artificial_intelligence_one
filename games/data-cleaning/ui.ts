
import {
    GameState, DATASETS, INITIAL_STATE,
    loadDataset, editCell, toggleDeleteRow, checkSubmission, completeLevel
} from './engine.js';

// 🏠 State
let appState: GameState = INITIAL_STATE;

// 🔌 Bindings
function init() {
    renderDatasetSelector();
    updateStats();

    // Bind global functions for HTML access
    (window as any).loadDataset = (id: number) => {
        appState = loadDataset(appState, id);
        renderGame();
    };

    (window as any).editCell = (rowIndex: number, col: string) => {
        if (appState.datasetId === null) return;
        const currentDatasetStr = DATASETS.find(d => d.id === appState.datasetId);
        if (!currentDatasetStr) return;

        // Get current value (edited or original)
        const cellKey = `${rowIndex}-${col}`;
        const currentVal = appState.edits[cellKey] ?? currentDatasetStr.data[rowIndex][col];

        const newValue = prompt(`Edit ${col}:`, currentVal);
        if (newValue !== null && newValue !== currentVal) {
            appState = editCell(appState, rowIndex, col, newValue);
            renderTable();
        }
    };

    (window as any).deleteRow = (rowIndex: number) => {
        if (confirm('Delete this row?')) {
            appState = toggleDeleteRow(appState, rowIndex);
            renderTable();
        }
    };

    (window as any).submitDataset = () => {
        if (appState.datasetId === null) return;
        const dataset = DATASETS.find(d => d.id === appState.datasetId);
        if (!dataset) return;

        const result = checkSubmission(appState, dataset);
        appState = completeLevel(appState, result);

        // Modal
        document.getElementById('modalScore')!.textContent = result.score.toString();
        document.getElementById('modalFound')!.textContent = result.correctFixes.toString();
        document.getElementById('modalTotal')!.textContent = result.totalErrors.toString();
        document.getElementById('modalAccuracy')!.textContent = result.accuracy + '%';
        document.getElementById('modalMessage')!.textContent = result.message;

        document.getElementById('modalOverlay')!.classList.add('show');
        document.getElementById('resultModal')!.classList.add('show');

        updateStats();
        renderDatasetSelector(); // Update badges
    };

    (window as any).showHint = () => {
        if (appState.datasetId === null) return;
        const dataset = DATASETS.find(d => d.id === appState.datasetId);
        if (dataset) {
            document.getElementById('hintText')!.textContent = dataset.hint;
            document.getElementById('hintBox')!.classList.add('show');
        }
    };

    (window as any).resetDataset = () => {
        if (appState.datasetId && confirm('Reset all changes?')) {
            appState = loadDataset(appState, appState.datasetId);
            renderGame();
        }
    };

    (window as any).closeModal = () => {
        document.getElementById('modalOverlay')!.classList.remove('show');
        document.getElementById('resultModal')!.classList.remove('show');
    };

    (window as any).showSolution = () => {
        if (appState.datasetId === null) return;
        const dataset = DATASETS.find(d => d.id === appState.datasetId);
        if (!dataset) return;

        let solution = `Solutions for ${dataset.name}:\n\n`;
        dataset.errors.forEach((error, idx) => {
            if (error.type === 'duplicate') {
                solution += `${idx + 1}. Row ${error.row + 1}: DELETE - ${error.reason}\n`;
            } else {
                solution += `${idx + 1}. Row ${error.row + 1}, ${error.col}: "${error.fix}" - ${error.reason}\n`;
            }
        });

        alert(solution);
    }
}

function renderGame() {
    if (appState.datasetId === null) return;
    const dataset = DATASETS.find(d => d.id === appState.datasetId);
    if (!dataset) return;

    document.getElementById('datasetTitle')!.textContent = dataset.name;
    document.getElementById('currentScore')!.textContent = '0'; // Current level score reset on reload? Logic overlap
    document.getElementById('errorCount')!.textContent = `Errors to find: ${dataset.errors.length}`;

    const problemList = document.getElementById('problemList')!;
    document.getElementById('problemTypes')!.style.display = 'block';
    problemList.innerHTML = dataset.problems.map(p => `<span class="problem-badge">${p}</span>`).join('');

    document.getElementById('hintBox')!.classList.remove('show');

    renderDatasetSelector();
    renderTable();
}

function renderTable() {
    if (appState.datasetId === null) {
        document.getElementById('tableContainer')!.innerHTML = '<p style="text-align: center;">Select a dataset</p>';
        return;
    }
    const dataset = DATASETS.find(d => d.id === appState.datasetId);
    if (!dataset) return;

    // Assuming ID is internal? 
    // Original code showed ID? let's check index.html.
    // Original: `const columns = Object.keys(currentData[0]);` so it implies ALL keys.
    // But `id` is usually hidden in UI or shown. Let's show all for now.
    const allColumns = Object.keys(dataset.data[0]);

    let html = '<table class="data-table"><thead><tr>';
    allColumns.forEach(col => {
        html += `<th>${col}</th>`;
    });
    html += '<th>Actions</th></tr></thead><tbody>';

    dataset.data.forEach((row, rowIndex) => {
        if (appState.deletedRows.includes(rowIndex)) return;

        html += '<tr>';
        allColumns.forEach(col => {
            const cellKey = `${rowIndex}-${col}`;
            const value = appState.edits[cellKey] ?? row[col];
            html += `<td class="editable-cell" onclick="editCell(${rowIndex}, '${col}')">${value || '<em style="color:#999">empty</em>'}</td>`;
        });
        html += `<td class="row-actions">
            <button class="btn-danger" onclick="deleteRow(${rowIndex})">Delete</button>
        </td></tr>`;
    });
    html += '</tbody></table>';
    document.getElementById('tableContainer')!.innerHTML = html;
}

function renderDatasetSelector() {
    const container = document.getElementById('datasetSelector');
    if (!container) return;
    container.innerHTML = '';

    DATASETS.forEach(dataset => {
        const btn = document.createElement('button');
        btn.className = 'dataset-btn';
        if (appState.completedDatasetIds.includes(dataset.id)) {
            btn.classList.add('completed');
        }
        if (appState.datasetId === dataset.id) {
            btn.classList.add('active');
        }
        btn.innerHTML = `
            <div style="font-weight: 700;">${dataset.name}</div>
            <div style="font-size: 0.85em; margin-top: 4px; opacity: 0.8;">${dataset.description}</div>
        `;
        btn.onclick = () => (window as any).loadDataset(dataset.id);
        container.appendChild(btn);
    });
}

function updateStats() {
    const completed = appState.completedDatasetIds.length;
    const total = DATASETS.length;
    const progress = (completed / total * 100).toFixed(0);

    document.getElementById('progressFill')!.style.width = progress + '%';
    document.getElementById('completedCount')!.textContent = `${completed}/${total}`;

    // Scores usually accumulate?
    // In original: `scores` array of numbers. sum them.
    // Let's simplified display:
    document.getElementById('totalScore')!.textContent = Math.round(appState.scores.reduce((a, b) => a + b, 0)).toString();

    // Avg Accuracy
    const avg = appState.scores.length > 0
        ? (appState.scores.reduce((a, b) => a + b, 0) / appState.scores.length).toFixed(1)
        : '0';

    document.getElementById('avgAccuracy')!.textContent = avg + '%';
}

init();
