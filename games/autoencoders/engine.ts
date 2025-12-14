
export const GRID_SIZE = 35;

export interface AutoencoderGameState {
    originalPattern: number[][];
    noisyPattern: number[][];
    denoisedPattern: number[][] | null;
    compressionLevel: number;
    processedCount: number;
    totalQuality: number;
    bestScore: number;
    lastScore: number;
}

export interface CompressionBlock {
    x: number;
    y: number;
    value: number;
    size: number;
}

export const INITIAL_STATE: AutoencoderGameState = {
    originalPattern: [],
    noisyPattern: [],
    denoisedPattern: null,
    compressionLevel: 5,
    processedCount: 0,
    totalQuality: 0,
    bestScore: 0,
    lastScore: 0
};

// Pure Functions

export function generatePattern(): number[][] {
    const pattern: number[][] = [];
    const type = Math.floor(Math.random() * 4);

    for (let y = 0; y < GRID_SIZE; y++) {
        pattern[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            let value = 0;

            switch (type) {
                case 0: // Circles
                    const dist = Math.sqrt(Math.pow(x - 17.5, 2) + Math.pow(y - 17.5, 2));
                    value = Math.sin(dist / 2) * 0.5 + 0.5;
                    break;
                case 1: // Waves
                    value = Math.sin(x / 3) * Math.cos(y / 3) * 0.5 + 0.5;
                    break;
                case 2: // Gradient
                    value = (x + y) / 70;
                    break;
                case 3: // Checkerboard
                    value = (Math.floor(x / 5) + Math.floor(y / 5)) % 2;
                    break;
            }

            pattern[y][x] = value;
        }
    }

    return pattern;
}

export function addNoise(pattern: number[][], noiseLevel = 0.3): number[][] {
    const noisy: number[][] = [];
    for (let y = 0; y < pattern.length; y++) {
        noisy[y] = [];
        for (let x = 0; x < pattern[y].length; x++) {
            const noise = (Math.random() - 0.5) * noiseLevel;
            noisy[y][x] = Math.max(0, Math.min(1, pattern[y][x] + noise));
        }
    }
    return noisy;
}

export function compressDecompress(pattern: number[][], compressionLevel: number): number[][] {
    // Simulate autoencoder compression
    const blockSize = 11 - compressionLevel; // Higher compression = larger blocks
    const compressed: CompressionBlock[] = [];

    // Compression (encoding)
    for (let y = 0; y < pattern.length; y += blockSize) {
        for (let x = 0; x < pattern[0].length; x += blockSize) {
            let sum = 0;
            let count = 0;

            for (let dy = 0; dy < blockSize && y + dy < pattern.length; dy++) {
                for (let dx = 0; dx < blockSize && x + dx < pattern[0].length; dx++) {
                    sum += pattern[y + dy][x + dx];
                    count++;
                }
            }

            compressed.push({ x, y, value: sum / count, size: blockSize });
        }
    }

    // Decompression (decoding)
    const decompressed: number[][] = [];
    for (let y = 0; y < pattern.length; y++) {
        decompressed[y] = [];
        for (let x = 0; x < pattern[0].length; x++) {
            decompressed[y][x] = 0;
        }
    }

    compressed.forEach(block => {
        // Safe check logic to avoid out of bounds if block size logic changes
        // though logic above protects it basically.
        for (let dy = 0; dy < block.size; dy++) {
            for (let dx = 0; dx < block.size; dx++) {
                const ny = block.y + dy;
                const nx = block.x + dx;
                if (ny < pattern.length && nx < pattern[0].length) {
                    decompressed[ny][nx] = block.value;
                }
            }
        }
    });

    return decompressed;
}

export function calculateQuality(original: number[][], denoised: number[][]): number {
    let totalError = 0;
    let count = 0;

    for (let y = 0; y < original.length; y++) {
        for (let x = 0; x < original[y].length; x++) {
            totalError += Math.abs(original[y][x] - denoised[y][x]);
            count++;
        }
    }

    const avgError = totalError / count;
    // Heuristic scoring from original code
    const quality = Math.max(0, 100 - (avgError * 200));
    return Math.round(quality);
}

// State Transitions

export function startNewImage(state: AutoencoderGameState): AutoencoderGameState {
    const original = generatePattern();
    const noisy = addNoise(original);

    return {
        ...state,
        originalPattern: original,
        noisyPattern: noisy,
        denoisedPattern: null,
        lastScore: 0
    };
}

export function applyDenoising(state: AutoencoderGameState): AutoencoderGameState {
    if (state.noisyPattern.length === 0) return state;

    const denoised = compressDecompress(state.noisyPattern, state.compressionLevel);
    const quality = calculateQuality(state.originalPattern, denoised);

    const newBest = Math.max(state.bestScore, quality);
    const newCount = state.processedCount + 1;
    const newTotal = state.totalQuality + quality;

    return {
        ...state,
        denoisedPattern: denoised,
        lastScore: quality,
        processedCount: newCount,
        totalQuality: newTotal,
        bestScore: newBest
    };
}

export function setCompression(state: AutoencoderGameState, level: number): AutoencoderGameState {
    return {
        ...state,
        compressionLevel: level
    };
}
