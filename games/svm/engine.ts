
export interface Point {
    x: number;
    y: number;
    label: 1 | -1;
}

export interface Solution {
    type: 'vertical' | 'diagonal' | 'sine' | 'circle';
    x?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    centerX?: number;
    centerY?: number;
    radius?: number;
    amplitude?: number;
    frequency?: number;
    offset?: number;
}

export interface Challenge {
    title: string;
    description: string;
    type: string;
    difficulty: string;
}

export interface SVMGameState {
    currentLevelIndex: number;
    dataPoints: Point[];
    boundaryPoints: { x: number, y: number }[];
    totalScore: number;
    completedChallenges: number;
    marginScores: number[];
    bestScore: number;
    solution: Solution | null;
    currentMode: 'draw' | 'erase';
}

export const CHALLENGES: Challenge[] = [
    { title: "Challenge 1: Simple Linear Separation", description: "Draw a straight line to separate these linearly separable classes.", type: "linear", difficulty: "easy" },
    { title: "Challenge 2: Diagonal Separation", description: "Find the optimal diagonal boundary with maximum margin.", type: "diagonal", difficulty: "easy" },
    { title: "Challenge 3: Narrow Margin", description: "Careful! The classes are close together. Maximize that margin!", type: "narrow", difficulty: "medium" },
    { title: "Challenge 4: Unbalanced Classes", description: "Handle unbalanced data - one class has more points than the other.", type: "unbalanced", difficulty: "medium" },
    { title: "Challenge 5: Curved Boundary", description: "This needs a curved decision boundary. Draw carefully!", type: "curved", difficulty: "hard" },
    { title: "Challenge 6: Multiple Clusters", description: "Each class has multiple clusters. Find the best overall boundary.", type: "clusters", difficulty: "hard" },
    { title: "Challenge 7: Circular Pattern", description: "One class surrounds the other. Draw a circular boundary!", type: "circular", difficulty: "hard" },
    { title: "Challenge 8: Complex Pattern", description: "The ultimate challenge - find the optimal boundary for this complex data!", type: "complex", difficulty: "expert" }
];

export const INITIAL_STATE: SVMGameState = {
    currentLevelIndex: 0,
    dataPoints: [],
    boundaryPoints: [],
    totalScore: 0,
    completedChallenges: 0,
    marginScores: [],
    bestScore: 0,
    solution: null,
    currentMode: 'draw'
};

// Pure Functions

export function generateLevelData(type: string): { dataPoints: Point[], solution: Solution } {
    const dataPoints: Point[] = [];
    let solution: Solution = { type: 'vertical', x: 0 }; // default

    switch (type) {
        case 'linear':
            // Class 1
            for (let i = 0; i < 20; i++) {
                dataPoints.push({ x: 100 + Math.random() * 250, y: 100 + Math.random() * 400, label: 1 });
            }
            // Class 2
            for (let i = 0; i < 20; i++) {
                dataPoints.push({ x: 400 + Math.random() * 250, y: 100 + Math.random() * 400, label: -1 });
            }
            solution = { type: 'vertical', x: 350 };
            break;

        case 'diagonal':
            for (let i = 0; i < 20; i++) {
                dataPoints.push({ x: 100 + Math.random() * 250, y: 50 + Math.random() * 200, label: 1 });
            }
            for (let i = 0; i < 20; i++) {
                dataPoints.push({ x: 400 + Math.random() * 250, y: 350 + Math.random() * 200, label: -1 });
            }
            solution = { type: 'diagonal', x1: 250, y1: 150, x2: 550, y2: 450 };
            break;

        case 'narrow':
            for (let i = 0; i < 25; i++) {
                dataPoints.push({ x: 150 + Math.random() * 180, y: 100 + Math.random() * 400, label: 1 });
            }
            for (let i = 0; i < 25; i++) {
                dataPoints.push({ x: 370 + Math.random() * 180, y: 100 + Math.random() * 400, label: -1 });
            }
            solution = { type: 'vertical', x: 330 };
            break;

        case 'unbalanced':
            for (let i = 0; i < 35; i++) {
                dataPoints.push({ x: 100 + Math.random() * 300, y: 100 + Math.random() * 400, label: 1 });
            }
            for (let i = 0; i < 15; i++) {
                dataPoints.push({ x: 450 + Math.random() * 200, y: 150 + Math.random() * 300, label: -1 });
            }
            solution = { type: 'vertical', x: 425 };
            break;

        case 'curved':
            for (let i = 0; i < 25; i++) {
                const x = 100 + Math.random() * 500;
                const y = 100 + Math.sin(x / 100) * 60 + Math.random() * 80;
                dataPoints.push({ x, y, label: 1 });
            }
            for (let i = 0; i < 25; i++) {
                const x = 100 + Math.random() * 500;
                const y = 400 + Math.sin(x / 100) * 60 + Math.random() * 80;
                dataPoints.push({ x, y, label: -1 });
            }
            solution = { type: 'sine', amplitude: 60, frequency: 100, offset: 300 };
            break;

        case 'clusters':
            for (let i = 0; i < 15; i++) {
                dataPoints.push({ x: 100 + Math.random() * 120, y: 100 + Math.random() * 150, label: 1 });
                dataPoints.push({ x: 100 + Math.random() * 120, y: 350 + Math.random() * 150, label: 1 });
            }
            for (let i = 0; i < 15; i++) {
                dataPoints.push({ x: 480 + Math.random() * 120, y: 100 + Math.random() * 150, label: -1 });
                dataPoints.push({ x: 480 + Math.random() * 120, y: 350 + Math.random() * 150, label: -1 });
            }
            solution = { type: 'vertical', x: 350 };
            break;

        case 'circular':
            const centerX = 350, centerY = 300;
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 40 + Math.random() * 50;
                dataPoints.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius, label: 1 });
            }
            for (let i = 0; i < 35; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 140 + Math.random() * 80;
                dataPoints.push({ x: centerX + Math.cos(angle) * radius, y: centerY + Math.sin(angle) * radius, label: -1 });
            }
            solution = { type: 'circle', centerX, centerY, radius: 110 };
            break;

        case 'complex':
            for (let i = 0; i < 20; i++) {
                const x = 100 + Math.random() * 200;
                const y = 100 + Math.random() * 150 + x * 0.3;
                dataPoints.push({ x, y, label: 1 });
            }
            for (let i = 0; i < 20; i++) {
                const x = 400 + Math.random() * 250;
                const y = 300 + Math.random() * 200 + (x - 400) * 0.2;
                dataPoints.push({ x, y, label: -1 });
            }
            solution = { type: 'diagonal', x1: 200, y1: 200, x2: 600, y2: 450 };
            break;
    }

    return { dataPoints, solution };
}

export function classifyPoint(point: { x: number, y: number }, boundary: { x: number, y: number }[]): number {
    if (boundary.length < 2) return 0;
    // Use first and last point of user boundary (assuming line/curve drawn separates space)
    // The original logic used cross product of first and last point for everything?
    // "const crossProduct = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);"
    // This implies the boundary IS treated as a line between start and end. 
    // If the user draws a complex curve, this simplification in original code might be inaccurate for complex shapes, 
    // but we will replicate it for functionality parity unless we want to upgrade it to Polygon containment or ray casting.
    // Given "Margin Maximizer" usually involves linear SVM-ish intuition, treating start/end as the line is robust enough for "intent".

    // However, for 'circular' or 'curved', a line approximation is bad. 
    // But original code: "const p1 = boundaryPoints[0]; const p2 = boundaryPoints[boundaryPoints.length - 1]; ..."
    // So distinct linear approximation was indeed used regardless of drawing complexity in the JS version.
    // We will stick to it for parity.

    const p1 = boundary[0];
    const p2 = boundary[boundary.length - 1];

    const crossProduct = (p2.x - p1.x) * (point.y - p1.y) - (p2.y - p1.y) * (point.x - p1.x);
    return crossProduct > 0 ? 1 : -1;
}

export function pointToLineDistance(point: { x: number, y: number }, lineStart: { x: number, y: number }, lineEnd: { x: number, y: number }): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = lineStart.x;
        yy = lineStart.y;
    } else if (param > 1) {
        xx = lineEnd.x;
        yy = lineEnd.y;
    } else {
        xx = lineStart.x + param * C;
        yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
}

export function calculateScore(boundary: { x: number, y: number }[], dataPoints: Point[]): { score: number, points: number } {
    if (boundary.length < 2) return { score: 0, points: 0 };

    // 1. Calculate Margin
    let minDistClass1 = Infinity;
    let minDistClass2 = Infinity;

    dataPoints.forEach(point => {
        let minDist = Infinity;
        // Distance to ANY segment of the polyline
        for (let i = 0; i < boundary.length - 1; i++) {
            const dist = pointToLineDistance(point, boundary[i], boundary[i + 1]);
            minDist = Math.min(minDist, dist);
        }

        if (point.label === 1) {
            minDistClass1 = Math.min(minDistClass1, minDist);
        } else {
            minDistClass2 = Math.min(minDistClass2, minDist);
        }
    });

    const margin = Math.min(minDistClass1, minDistClass2);

    // 2. Accuracy
    let misclassified = 0;
    dataPoints.forEach(point => {
        // Original logic classified based on START and END of boundary only.
        // If the user draws a 'U' shape, this logic fails. 
        // But for parity we use `classifyPoint`.
        if (classifyPoint(point, boundary) !== point.label) {
            misclassified++;
        }
    });

    // Score
    const maxPossibleMargin = 100; // heuristic
    const marginScore = (margin / maxPossibleMargin) * 100;
    const accuracyPenalty = misclassified * 10;

    const rawScore = Math.max(0, Math.min(100, marginScore - accuracyPenalty));
    return {
        score: rawScore,
        points: Math.round(rawScore * 10)
    };
}
