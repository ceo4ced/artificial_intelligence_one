
export interface Point {
    x: number;
    y: number;
    trueCluster?: number;
}

export interface Centroid {
    x: number;
    y: number;
}

export interface KMeansResult {
    assignments: number[];
    centroids: Centroid[];
}

export interface DatasetConfig {
    name: string;
    xLabel: string;
    yLabel: string;
    clusters: number;
    description: string;
}

export type DatasetID = 'customers' | 'students' | 'products' | 'cities' | 'animals' | 'plants' | 'weather' | 'sports';

export const DATASETS: Record<DatasetID, DatasetConfig> = {
    customers: {
        name: 'Customer Segments',
        xLabel: 'Purchase Frequency',
        yLabel: 'Average Spend',
        clusters: 3,
        description: 'Customer shopping behavior'
    },
    students: {
        name: 'Student Performance',
        xLabel: 'Study Hours',
        yLabel: 'Test Scores',
        clusters: 3,
        description: 'Student achievement groups'
    },
    products: {
        name: 'Product Categories',
        xLabel: 'Price',
        yLabel: 'Popularity',
        clusters: 4,
        description: 'Product market segments'
    },
    cities: {
        name: 'City Types',
        xLabel: 'Population',
        yLabel: 'Area (sq km)',
        clusters: 3,
        description: 'Urban classification'
    },
    animals: {
        name: 'Animal Species',
        xLabel: 'Size (kg)',
        yLabel: 'Lifespan (years)',
        clusters: 4,
        description: 'Animal categorization'
    },
    plants: {
        name: 'Plant Types',
        xLabel: 'Height (m)',
        yLabel: 'Water Needs',
        clusters: 3,
        description: 'Botanical groups'
    },
    weather: {
        name: 'Weather Patterns',
        xLabel: 'Temperature (°C)',
        yLabel: 'Humidity (%)',
        clusters: 3,
        description: 'Climate zones'
    },
    sports: {
        name: 'Athlete Stats',
        xLabel: 'Speed',
        yLabel: 'Endurance',
        clusters: 4,
        description: 'Athletic profiles'
    }
};

export const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

// Pure Functions

export function generatePoints(k: number, width: number, height: number): Point[] {
    const points: Point[] = [];
    const pointsPerCluster = 15 + Math.floor(Math.random() * 10);

    for (let i = 0; i < k; i++) {
        const centerX = 100 + Math.random() * (width - 200);
        const centerY = 100 + Math.random() * (height - 200);
        const spreadX = 40 + Math.random() * 40;
        const spreadY = 40 + Math.random() * 40;

        for (let j = 0; j < pointsPerCluster; j++) {
            points.push({
                x: centerX + (Math.random() - 0.5) * spreadX * 2,
                y: centerY + (Math.random() - 0.5) * spreadY * 2,
                trueCluster: i
            });
        }
    }
    return points;
}

export function computeKMeans(points: Point[], k: number, iterations = 20): KMeansResult {
    let centroids: Centroid[] = [];
    const usedIndices = new Set<number>();

    // Initial random centroids
    for (let i = 0; i < k; i++) {
        let idx: number;
        let attempts = 0;
        do {
            idx = Math.floor(Math.random() * points.length);
            attempts++;
        } while (usedIndices.has(idx) && points.length > k && attempts < 100);

        // Fallback if we can't find unique indices easily (rare)
        if (usedIndices.has(idx)) idx = i % points.length;

        usedIndices.add(idx);
        centroids.push({ x: points[idx].x, y: points[idx].y });
    }

    let assignments: number[] = new Array(points.length).fill(0);

    for (let iter = 0; iter < iterations; iter++) {
        // Assignment
        assignments = points.map(p => {
            let minDist = Infinity;
            let cluster = 0;
            centroids.forEach((c, i) => {
                const dist = Math.sqrt((p.x - c.x) ** 2 + (p.y - c.y) ** 2);
                if (dist < minDist) {
                    minDist = dist;
                    cluster = i;
                }
            });
            return cluster;
        });

        // Update
        const newCentroids: Centroid[] = [];
        let converged = true;

        for (let i = 0; i < k; i++) {
            const clusterPoints = points.filter((_, idx) => assignments[idx] === i);
            if (clusterPoints.length > 0) {
                const avgX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
                const avgY = clusterPoints.reduce((sum, p) => sum + p.y, 0) / clusterPoints.length;
                newCentroids.push({ x: avgX, y: avgY });
            } else {
                newCentroids.push({ ...centroids[i] });
            }
        }

        // Convergence Check
        for (let i = 0; i < k; i++) {
            const dist = Math.sqrt((centroids[i].x - newCentroids[i].x) ** 2 + (centroids[i].y - newCentroids[i].y) ** 2);
            if (dist > 0.1) converged = false;
        }

        centroids = newCentroids;
        if (converged) break;
    }

    return { assignments, centroids };
}

export function calculateSimilarityScore(assignments1: number[], assignments2: number[]): number {
    if (assignments1.length !== assignments2.length || assignments1.length === 0) return 0;

    // Adjusted Rand Index approximation (Pairwise agreement)
    let agreements = 0;
    let total = 0;

    for (let i = 0; i < assignments1.length; i++) {
        for (let j = i + 1; j < assignments1.length; j++) {
            const same1 = assignments1[i] === assignments1[j];
            const same2 = assignments2[i] === assignments2[j];

            // Ignore unassigned points (-1)
            if (assignments1[i] === -1 || assignments1[j] === -1) continue;

            if (same1 === same2) {
                agreements++;
            }
            total++;
        }
    }

    if (total === 0) return 0;
    return Math.round((agreements / total) * 100);
}
