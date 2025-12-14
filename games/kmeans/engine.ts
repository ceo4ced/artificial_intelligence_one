
export type Color = [number, number, number];

export interface KMeansState {
    currentImage: string;
    k: number;
    width: number;
    height: number;
    originalPixels: Color[]; // Length = width * height
    centroids: Color[];
    compressedPixels: Color[] | null;
    stats: {
        originalColorCount: number;
        compressedColorCount: number;
        compressionRatio: string;
        qualityScore: string;
        totalScore: number;
    }
}

export const IMAGE_COLORS: Record<string, Color[]> = {
    sunset: [
        [255, 120, 50], [255, 150, 80], [255, 180, 100], [255, 200, 150],
        [100, 50, 150], [150, 80, 200], [200, 150, 255], [50, 30, 100]
    ],
    forest: [
        [34, 139, 34], [0, 100, 0], [46, 125, 50], [76, 175, 80],
        [139, 69, 19], [101, 67, 33], [160, 82, 45], [205, 133, 63]
    ],
    ocean: [
        [0, 119, 190], [30, 144, 255], [135, 206, 250], [173, 216, 230],
        [0, 191, 255], [25, 25, 112], [70, 130, 180], [176, 224, 230]
    ],
    flower: [
        [255, 105, 180], [255, 20, 147], [255, 192, 203], [255, 182, 193],
        [34, 139, 34], [50, 205, 50], [255, 255, 0], [255, 215, 0]
    ]
};

export const INITIAL_STATE: KMeansState = {
    currentImage: 'sunset',
    k: 8,
    width: 400,
    height: 300,
    originalPixels: [],
    centroids: [],
    compressedPixels: null,
    stats: {
        originalColorCount: 0,
        compressedColorCount: 0,
        compressionRatio: '0%',
        qualityScore: '0%',
        totalScore: 0
    }
};

// Purely math-based image generation
export function generateSyntheticImage(type: string, width: number, height: number): Color[] {
    const pixels: Color[] = [];
    const colors = IMAGE_COLORS[type] || IMAGE_COLORS.sunset;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const colorIndex = Math.floor((x / width) * colors.length);
            const baseColor = colors[colorIndex];

            const gradientFactor = y / height;
            // Deterministic noise for reproducibility? Or Math.random?
            // Engine can be impure regarding randomness if we accept it.
            // For testing, we might want seed, but random is fine for "game".
            const noise = (Math.random() - 0.5) * 30;

            const r = Math.max(0, Math.min(255, baseColor[0] * (1 - gradientFactor * 0.3) + noise));
            const g = Math.max(0, Math.min(255, baseColor[1] * (1 - gradientFactor * 0.3) + noise));
            const b = Math.max(0, Math.min(255, baseColor[2] * (1 - gradientFactor * 0.3) + noise));

            pixels.push([r, g, b]);
        }
    }
    return pixels;
}

export function countUniqueColors(pixels: Color[]): number {
    const set = new Set<string>();
    // Sampling for performance? Or exact? 400x300 = 120,000 pixels. 
    // Set operations are fast enough.
    for (const p of pixels) {
        // Rounding to int integers for key
        set.add(`${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])}`);
    }
    return set.size;
}

export function initializeGame(state: KMeansState, imageType: string): KMeansState {
    const pixels = generateSyntheticImage(imageType, state.width, state.height);
    const uniqueCount = countUniqueColors(pixels);

    return {
        ...state,
        currentImage: imageType,
        originalPixels: pixels,
        compressedPixels: null,
        centroids: [],
        stats: {
            ...INITIAL_STATE.stats,
            originalColorCount: uniqueCount
        }
    };
}

export function runKMeans(state: KMeansState): KMeansState {
    if (state.originalPixels.length === 0) return state;

    const k = state.k;
    let centroids: Color[] = [];

    // 1. Initialize Centroids (Randomly from pixels or completely random space?)
    // Original: Math.random() * 255.
    for (let i = 0; i < k; i++) {
        centroids.push([
            Math.random() * 255,
            Math.random() * 255,
            Math.random() * 255
        ]);
    }

    // 2. Iterate
    const iterations = 10;
    for (let iter = 0; iter < iterations; iter++) {
        const clusters: Color[][] = Array(k).fill(0).map(() => []);

        // Assign
        for (const p of state.originalPixels) {
            let minDist = Infinity;
            let closestIndex = 0;

            centroids.forEach((c, idx) => {
                const dist = Math.sqrt(
                    (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2
                );
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = idx;
                }
            });
            clusters[closestIndex].push(p);
        }

        // Update
        centroids = clusters.map(cluster => {
            if (cluster.length === 0) return [Math.random() * 255, Math.random() * 255, Math.random() * 255];

            const sum = cluster.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
            return [
                sum[0] / cluster.length,
                sum[1] / cluster.length,
                sum[2] / cluster.length
            ];
        });
    }

    // 3. Create Compressed Image (Map pixels to Final Centroids)
    const compressedPixels = state.originalPixels.map(p => {
        let minDist = Infinity;
        let closestCentroid = centroids[0];

        centroids.forEach(c => {
            const dist = Math.sqrt(
                (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2
            );
            if (dist < minDist) {
                minDist = dist;
                closestCentroid = c;
            }
        });
        return closestCentroid;
    });

    // 4. Calculate Stats
    const originalColors = state.stats.originalColorCount;
    const compressionRatioVal = (originalColors - k) / originalColors * 100;
    const qualityScoreVal = Math.min(100, (k / 16) * 100); // Simple logic from original
    const score = Math.round((compressionRatioVal + qualityScoreVal) / 2);

    return {
        ...state,
        centroids,
        compressedPixels,
        stats: {
            ...state.stats,
            compressedColorCount: k,
            compressionRatio: compressionRatioVal.toFixed(1) + '%',
            qualityScore: qualityScoreVal.toFixed(0) + '%',
            totalScore: score
        }
    };
}
