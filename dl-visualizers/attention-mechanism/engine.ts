
export interface AttentionState {
    sentence: string;
    words: string[];
    attentionMatrix: number[][]; // N x N matrix
    selectedWordIndex: number;
}

export const INITIAL_STATE: AttentionState = {
    sentence: 'The cat sat on the mat',
    words: ['the', 'cat', 'sat', 'on', 'the', 'mat'],
    attentionMatrix: [],
    selectedWordIndex: -1
};

export const SAMPLE_SENTENCES = [
    'The quick brown fox jumps',
    'I love machine learning',
    'Attention is all you need',
    'The student learned about neural networks'
];

export function tokenize(sentence: string): string[] {
    return sentence.toLowerCase().trim().split(/\s+/).filter(w => w.length > 0);
}

export function calculateAttentionMatrix(words: string[]): number[][] {
    const n = words.length;
    const matrix: number[][] = [];

    for (let i = 0; i < n; i++) {
        const row: number[] = [];
        for (let j = 0; j < n; j++) {
            let score = 0;

            if (i === j) {
                // High self-attention
                // Using seeded random-like behavior based on index to be deterministic?
                // Or just simple heuristics. original used Math.random().
                // We'll stick to a deterministic "noisy" heuristic for testability.
                score = 0.5;
            } else {
                // Distance decay: closer words attend more
                const distance = Math.abs(i - j);
                score = Math.exp(-distance * 0.5) * 0.3;

                // Grammar Heuristics
                const wordI = words[i];
                // const wordJ = words[j];

                // Articles look forward
                if (['the', 'a', 'an'].includes(wordI)) {
                    if (j > i && j <= i + 2) score *= 2.0;
                }

                // Verbs look for subjects/objects (nearby nouns)
                if (['is', 'are', 'was', 'were', 'love', 'like', 'jumps', 'sat', 'learned'].includes(wordI)) {
                    score *= 1.5;
                }
            }
            row.push(score);
        }

        // Softmax (normalize row to sum to 1)
        const rowSum = row.reduce((a, b) => a + b, 0);
        matrix.push(row.map(val => val / rowSum));
    }

    return matrix;
}

export function updateSentence(state: AttentionState, sentence: string): AttentionState {
    const words = tokenize(sentence);
    if (words.length < 2) return state; // Ignore invalid input

    const attentionMatrix = calculateAttentionMatrix(words);
    return {
        ...state,
        sentence,
        words,
        attentionMatrix,
        selectedWordIndex: -1
    };
}
