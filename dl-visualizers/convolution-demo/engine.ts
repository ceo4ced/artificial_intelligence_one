
export type ImageGrid = number[][];
export type FilterKernel = number[][];

export interface ConvolutionState {
    inputImage: ImageGrid;
    featureMap: ImageGrid;
    currentFilter: FilterKernel;
    filterName: string;
    stride: number;
    currentRow: number;
    currentCol: number;
    isComplete: boolean;
}

export const GRID_SIZE = 15;

export const FILTERS: Record<string, FilterKernel> = {
    edge_vertical: [
        [-1, 0, 1],
        [-2, 0, 2],
        [-1, 0, 1]
    ],
    edge_horizontal: [
        [-1, -2, -1],
        [0, 0, 0],
        [1, 2, 1]
    ],
    edge_all: [
        [-1, -1, -1],
        [-1, 8, -1],
        [-1, -1, -1]
    ],
    sharpen: [
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ],
    blur: [
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9],
        [1 / 9, 1 / 9, 1 / 9]
    ],
    emboss: [
        [-2, -1, 0],
        [-1, 1, 1],
        [0, 1, 2]
    ]
};

export function createEmptyImage(size: number): ImageGrid {
    return Array(size).fill(0).map(() => Array(size).fill(0));
}

export function generateImage(type: 'shapes' | 'letter' | 'grid' | 'checker'): ImageGrid {
    const image = createEmptyImage(GRID_SIZE);

    switch (type) {
        case 'shapes':
            // Draw a square
            for (let i = 2; i < 6; i++) {
                for (let j = 2; j < 6; j++) {
                    image[i][j] = 255;
                }
            }
            // Draw a circle
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    const dx = i - 10;
                    const dy = j - 10;
                    if (dx * dx + dy * dy < 12) {
                        image[i][j] = 255;
                    }
                }
            }
            break;

        case 'letter':
            // Draw an X
            for (let i = 0; i < GRID_SIZE; i++) {
                image[i][i] = 255;
                image[i][GRID_SIZE - 1 - i] = 255;
            }
            break;

        case 'grid':
            // Vertical and horizontal lines
            for (let i = 0; i < GRID_SIZE; i++) {
                image[5][i] = 255;
                image[10][i] = 255;
                image[i][5] = 255;
                image[i][10] = 255;
            }
            break;

        case 'checker':
            // Checkerboard pattern
            for (let i = 0; i < GRID_SIZE; i++) {
                for (let j = 0; j < GRID_SIZE; j++) {
                    if ((Math.floor(i / 3) + Math.floor(j / 3)) % 2 === 0) {
                        image[i][j] = 255;
                    }
                }
            }
            break;
    }
    return image;
}

export function initializeState(imageType: 'shapes' | 'letter' | 'grid' | 'checker' = 'shapes'): ConvolutionState {
    const filterName = 'edge_vertical';
    const stride = 1;
    const maxSize = Math.floor((GRID_SIZE - 2) / stride);

    return {
        inputImage: generateImage(imageType),
        featureMap: createEmptyImage(maxSize), // This size might vary if stride changes dynamically
        currentFilter: FILTERS[filterName],
        filterName,
        stride,
        currentRow: 0,
        currentCol: 0,
        isComplete: false
    };
}

// Pure calculation for a single patch
export function applyConvolutionPatch(image: ImageGrid, filter: FilterKernel, row: number, col: number): number {
    let sum = 0;
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const imgRow = row + i;
            const imgCol = col + j;
            if (imgRow < GRID_SIZE && imgCol < GRID_SIZE) {
                sum += image[imgRow][imgCol] * filter[i][j];
            }
        }
    }
    return Math.max(0, Math.min(255, sum));
}

// Advances the state by one step
export function calculateNextStep(state: ConvolutionState): ConvolutionState {
    if (state.isComplete) return state;

    const { inputImage, currentFilter, currentRow, currentCol, stride, featureMap } = state;

    // Copy feature map for immutability
    const newFeatureMap = featureMap.map(row => [...row]);

    // Calculate output for current position
    const mapRow = Math.floor(currentRow / stride);
    const mapCol = Math.floor(currentCol / stride);

    // Ensure we are within bounds of feature map
    if (mapRow < newFeatureMap.length && mapCol < newFeatureMap[0].length) {
        newFeatureMap[mapRow][mapCol] = applyConvolutionPatch(inputImage, currentFilter, currentRow, currentCol);
    }

    // Advance position
    let nextCol = currentCol + stride;
    let nextRow = currentRow;
    let complete = false;

    if (nextCol > GRID_SIZE - 3) {
        nextCol = 0;
        nextRow += stride;
    }

    if (nextRow > GRID_SIZE - 3) {
        complete = true;
    }

    return {
        ...state,
        featureMap: newFeatureMap,
        currentRow: nextRow,
        currentCol: nextCol,
        isComplete: complete
    };
}

export function resetConvolutionState(state: ConvolutionState): ConvolutionState {
    const maxSize = Math.floor((GRID_SIZE - 2) / state.stride);
    return {
        ...state,
        currentRow: 0,
        currentCol: 0,
        featureMap: createEmptyImage(maxSize), // Resize feature map
        isComplete: false
    };
}

export function updateFilter(state: ConvolutionState, filterName: string): ConvolutionState {
    return resetConvolutionState({
        ...state,
        filterName,
        currentFilter: FILTERS[filterName]
    });
}

export function updateStride(state: ConvolutionState, stride: number): ConvolutionState {
    return resetConvolutionState({
        ...state,
        stride
    });
}

export function updateImage(state: ConvolutionState, type: 'shapes' | 'letter' | 'grid' | 'checker'): ConvolutionState {
    return resetConvolutionState({
        ...state,
        inputImage: generateImage(type)
    });
}
