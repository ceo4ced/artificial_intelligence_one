
import {
    KMeansState, INITIAL_STATE, initializeGame, runKMeans, Color
} from './engine.js';

// 🏠 State
let appState: KMeansState = { ...INITIAL_STATE };
// Initialize first image
appState = initializeGame(appState, 'sunset');

// 🖥️ UI References
const originalCanvas = document.getElementById('originalCanvas') as HTMLCanvasElement;
const originalCtx = originalCanvas.getContext('2d')!;
const compressedCanvas = document.getElementById('compressedCanvas') as HTMLCanvasElement;
const compressedCtx = compressedCanvas.getContext('2d')!;

// 🎨 Rendering
function drawPixels(ctx: CanvasRenderingContext2D, pixels: Color[], width: number, height: number) {
    const imageData = ctx.createImageData(width, height);
    for (let i = 0; i < pixels.length; i++) {
        const [r, g, b] = pixels[i];
        const idx = i * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = 255; // Alpha
    }
    ctx.putImageData(imageData, 0, 0);
}

function updateUI() {
    // Draw Original
    drawPixels(originalCtx, appState.originalPixels, appState.width, appState.height);

    // Draw Compressed
    if (appState.compressedPixels) {
        drawPixels(compressedCtx, appState.compressedPixels, appState.width, appState.height);
        displayPalette();
    } else {
        // Clear compressed
        compressedCtx.fillStyle = '#f0f0f0';
        compressedCtx.fillRect(0, 0, compressedCanvas.width, compressedCanvas.height);
        compressedCtx.fillStyle = '#999';
        compressedCtx.font = '16px Arial';
        compressedCtx.textAlign = 'center';
        compressedCtx.fillText('Click "Compress Colors" to see result', compressedCanvas.width / 2, compressedCanvas.height / 2);

        document.getElementById('paletteDisplay')!.innerHTML = '<p style="color: #999; width: 100%; text-align: center;">Compress an image to see the color palette!</p>';
    }

    // Stats
    document.getElementById('originalColors')!.textContent = appState.stats.originalColorCount.toString();
    document.getElementById('compressedColors')!.textContent = appState.compressedPixels ? appState.k.toString() : '0';
    document.getElementById('compression')!.textContent = appState.stats.compressionRatio;
    document.getElementById('quality')!.textContent = appState.stats.qualityScore;
    document.getElementById('scoreValue')!.textContent = appState.stats.totalScore.toString();

    // K Slider Text
    document.getElementById('kValue')!.textContent = appState.k.toString();
}

function displayPalette() {
    const palette = document.getElementById('paletteDisplay')!;
    let html = '';

    appState.centroids.forEach((color) => {
        const r = Math.round(color[0]);
        const g = Math.round(color[1]);
        const b = Math.round(color[2]);
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        html += `
            <div style="text-align: center;">
                <div class="color-swatch" style="background: rgb(${r},${g},${b});" title="${hex}"></div>
                <div class="color-label">${hex}</div>
            </div>
        `;
    });

    palette.innerHTML = html;
}

// 🌐 Bindings
(window as any).selectImage = (type: string) => {
    appState = initializeGame(appState, type);
    // UI Active Logic
    document.querySelectorAll('.image-btn').forEach(btn => {
        if (btn.textContent?.toLowerCase().includes(type)) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    updateUI();
};

(window as any).updateK = () => {
    const k = parseInt((document.getElementById('kSlider') as HTMLInputElement).value);
    appState = { ...appState, k };
    // Just update text, don't re-render entire game state yet? 
    document.getElementById('kValue')!.textContent = k.toString();
};

(window as any).compress = () => {
    document.body.style.cursor = 'wait';
    // Allow UI to update cursor
    setTimeout(() => {
        appState = runKMeans(appState);
        updateUI();
        document.body.style.cursor = 'default';
    }, 50);
};

(window as any).downloadPalette = () => {
    if (!appState.centroids.length) {
        alert('Compress an image first!');
        return;
    }
    let paletteText = `Color Palette (${appState.k} colors):\n\n`;
    appState.centroids.forEach((color, i) => {
        const r = Math.round(color[0]);
        const g = Math.round(color[1]);
        const b = Math.round(color[2]);
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        paletteText += `Color ${i + 1}: ${hex} - RGB(${r}, ${g}, ${b})\n`;
    });
    alert(paletteText);
};

(window as any).reset = () => {
    appState = initializeGame(appState, appState.currentImage);
    appState.stats = { ...INITIAL_STATE.stats, originalColorCount: appState.stats.originalColorCount };
    updateUI();
};

// Init
updateUI();
