
export interface DataRow {
    id: number;
    [key: string]: any;
}

export interface ErrorDef {
    row: number; // 0-indexed index in data array
    col?: string;
    type?: 'duplicate';
    fix?: string; // The correct value
    reason: string;
}

export interface DatasetDef {
    id: number;
    name: string;
    description: string;
    problems: string[];
    data: DataRow[];
    errors: ErrorDef[];
    hint: string;
}

export interface GameState {
    datasetId: number | null;
    edits: Record<string, string>; // Key: "rowIndex-colName"
    deletedRows: number[]; // indicies
    completedDatasetIds: number[];
    scores: number[];
}

export interface SubmissionResult {
    score: number;
    correctFixes: number;
    totalErrors: number;
    accuracy: number;
    message: string;
}

// --- Initial State ---

export const INITIAL_STATE: GameState = {
    datasetId: null,
    edits: {},
    deletedRows: [],
    completedDatasetIds: [],
    scores: []
};

// --- Pure Functions ---

export function loadDataset(state: GameState, id: number): GameState {
    return {
        ...state,
        datasetId: id,
        edits: {},
        deletedRows: []
    };
}

export function editCell(state: GameState, rowIndex: number, col: string, value: string): GameState {
    const key = `${rowIndex}-${col}`;
    return {
        ...state,
        edits: { ...state.edits, [key]: value }
    };
}

export function toggleDeleteRow(state: GameState, rowIndex: number): GameState {
    const isDeleted = state.deletedRows.includes(rowIndex);
    let newDeleted;
    if (isDeleted) {
        newDeleted = state.deletedRows.filter(r => r !== rowIndex);
    } else {
        newDeleted = [...state.deletedRows, rowIndex];
    }
    return {
        ...state,
        deletedRows: newDeleted
    };
}

export function checkSubmission(state: GameState, dataset: DatasetDef): SubmissionResult {
    let correctFixes = 0;
    const totalErrors = dataset.errors.length;

    dataset.errors.forEach(error => {
        if (error.type === 'duplicate') {
            if (state.deletedRows.includes(error.row)) {
                correctFixes++;
            }
        } else if (error.col && error.fix !== undefined) {
            const cellKey = `${error.row}-${error.col}`;
            // Check if edited
            if (state.edits[cellKey] !== undefined) {
                const userVal = state.edits[cellKey].toString().toLowerCase().trim();
                const correctVal = error.fix.toString().toLowerCase().trim();
                if (userVal === correctVal) correctFixes++;
            }
        }
    });

    const accuracy = totalErrors > 0 ? (correctFixes / totalErrors) * 100 : 100;
    const score = Math.round((correctFixes / totalErrors) * 1000) || 0;

    let message = '';
    if (accuracy >= 90) message = '🏆 Excellent! You found almost all the errors!';
    else if (accuracy >= 75) message = '⭐ Great job! Keep practicing.';
    else if (accuracy >= 50) message = '👍 Good start! Review the solution.';
    else message = '💪 Keep trying! Data cleaning takes practice.';

    return {
        score,
        correctFixes,
        totalErrors,
        accuracy: parseFloat(accuracy.toFixed(1)),
        message
    };
}

export function completeLevel(state: GameState, result: SubmissionResult): GameState {
    if (state.datasetId === null) return state;

    // Check duplication to avoid double scoring if submitted multiple times? 
    // The original game pushes score every submit. We will mimic that.

    return {
        ...state,
        completedDatasetIds: [...new Set([...state.completedDatasetIds, state.datasetId])],
        scores: [...state.scores, result.accuracy]
    };
}

// --- Data ---
// In a real app this might be loaded from JSON, but here we inline it as per original.
export const DATASETS: DatasetDef[] = [
    {
        id: 1,
        name: "Student Grades",
        description: "School grade records",
        problems: ["Missing values", "Duplicates", "Outliers"],
        data: [
            { id: 1, name: "Alice Johnson", grade: "95", subject: "Math", semester: "Fall 2024" },
            { id: 2, name: "Bob Smith", grade: "", subject: "Math", semester: "Fall 2024" },
            { id: 3, name: "Carol Davis", grade: "88", subject: "Math", semester: "fall 2024" },
            { id: 4, name: "Bob Smith", grade: "92", subject: "Math", semester: "Fall 2024" },
            { id: 5, name: "Eve Wilson", grade: "999", subject: "Math", semester: "Fall 2024" },
            { id: 6, name: "Frank Brown", grade: "78", subject: "Math", semester: "Fall 2024" },
        ],
        errors: [
            { row: 1, col: "grade", fix: "92", reason: "Missing value - should be 92" },
            { row: 3, col: "semester", fix: "Fall 2024", reason: "Inconsistent capitalization" },
            { row: 3, type: "duplicate", reason: "Duplicate of row 1 (Bob Smith)" }, // Row 3 is index 3 -> 4th item? Original code said row 3
            // Wait, original code usage: datasets[...].errors[...].row
            // In original JS: { row: 3, type: "duplicate" ... }
            // Let's verify indexing.
            { row: 4, col: "grade", fix: "85", reason: "Outlier - grade should be 85 not 999" },
        ],
        hint: "Look for: empty grades, duplicate students, impossible grade values (>100), and inconsistent text formatting"
    },
    {
        id: 2,
        name: "Customer Records",
        description: "E-commerce customer data",
        problems: ["Formatting", "Typos", "Missing values"],
        data: [
            { id: 1, name: "John Smith", email: "john@email.com", phone: "555-1234", state: "CA" },
            { id: 2, name: "jane doe", email: "jane@email.com", phone: "(555) 5678", state: "ca" },
            { id: 3, name: "Bob Jones", email: "bob@emailcom", phone: "5559012", state: "NY" },
            { id: 4, name: "Alice Brown", email: "alice@email.com", phone: "", state: "CA" },
            { id: 5, name: "CHARLIE DAVIS", email: "charlie@email.com", phone: "555-3456", state: "Texas" },
        ],
        errors: [
            { row: 1, col: "name", fix: "Jane Doe", reason: "Name should be capitalized" },
            { row: 1, col: "state", fix: "CA", reason: "State code should be uppercase" },
            { row: 2, col: "email", fix: "bob@email.com", reason: "Missing dot in email domain" },
            { row: 3, col: "phone", fix: "555-9012", reason: "Phone should have consistent format" },
            { row: 4, col: "name", fix: "Charlie Davis", reason: "Name should use title case, not all caps" },
            { row: 4, col: "state", fix: "TX", reason: "State should be 2-letter code" },
        ],
        hint: "Check for: inconsistent name capitalization, email format errors, phone number formats, and state abbreviations"
    },
    // Truncating for brevity in file writing, but I should copy ALL datasets to ensure full functionality.
    // I will use '...' for others in this artifact for speed if I can, OR I'll just copy 2 for now as proof of concept?
    // "Refactor" implies keeping existing functionality.
    // I will assume for the purposes of this task, I should port ALL data. 
    // I'll define the rest below.
    {
        id: 3,
        name: "Product Inventory",
        description: "Store inventory system",
        problems: ["Inconsistent categories", "Outliers", "Typos"],
        data: [
            { id: 1, product: "Laptop", category: "Electronics", price: "$999.99", stock: "50" },
            { id: 2, product: "Mouse", category: "electronics", price: "$19.99", stock: "200" },
            { id: 3, product: "Keybord", category: "Electronics", price: "$49.99", stock: "150" },
            { id: 4, product: "Monitor", category: "Electronic", price: "$299.99", stock: "-5" },
            { id: 5, product: "Headphones", category: "Electronics", price: "$79.99", stock: "1000000" },
        ],
        errors: [
            { row: 1, col: "category", fix: "Electronics", reason: "Category should be consistently capitalized" },
            { row: 2, col: "product", fix: "Keyboard", reason: "Typo in product name" },
            { row: 3, col: "category", fix: "Electronics", reason: "Inconsistent category name" },
            { row: 3, col: "stock", fix: "5", reason: "Negative stock impossible" },
            { row: 4, col: "stock", fix: "100", reason: "Outlier - unrealistic stock quantity" },
        ],
        hint: "Look for: spelling errors, inconsistent category names, negative stock values, and unrealistic inventory numbers"
    },
    {
        id: 4,
        name: "Survey Responses",
        description: "Customer satisfaction survey",
        problems: ["Missing values", "Inconsistent entries", "Outliers"],
        data: [
            { id: 1, age: "25", satisfaction: "Very Satisfied", rating: "5", date: "2024-01-15" },
            { id: 2, age: "", satisfaction: "Satisfied", rating: "4", date: "2024-01-16" },
            { id: 3, age: "35", satisfaction: "very satisfied", rating: "5", date: "01/17/2024" },
            { id: 4, age: "200", satisfaction: "Neutral", rating: "3", date: "2024-01-18" },
            { id: 5, age: "45", satisfaction: "Dissatisfied", rating: "15", date: "2024-01-19" },
        ],
        errors: [
            { row: 1, col: "age", fix: "30", reason: "Missing age value" },
            { row: 2, col: "satisfaction", fix: "Very Satisfied", reason: "Inconsistent capitalization" },
            { row: 2, col: "date", fix: "2024-01-17", reason: "Date format should be YYYY-MM-DD" },
            { row: 3, col: "age", fix: "28", reason: "Age outlier - 200 is impossible" },
            { row: 4, col: "rating", fix: "2", reason: "Rating should be 1-5 scale, not 15" },
        ],
        hint: "Check for: missing ages, inconsistent capitalization, different date formats, impossible ages, and invalid ratings"
    },
    {
        id: 5,
        name: "Sales Data",
        description: "Monthly sales records",
        problems: ["Duplicates", "Formatting", "Outliers"],
        data: [
            { id: 1, date: "2024-01-15", product: "Widget A", quantity: "100", revenue: "$5,000" },
            { id: 2, date: "2024-01-15", product: "Widget A", quantity: "100", revenue: "$5,000" },
            { id: 3, date: "2024-01-16", product: "Widget B", quantity: "50", revenue: "2500" },
            { id: 4, date: "01/17/2024", product: "Widget C", quantity: "-10", revenue: "$1,200" },
            { id: 5, date: "2024-01-18", product: "Widget D", quantity: "75", revenue: "$99999" },
        ],
        errors: [
            { row: 1, type: "duplicate", reason: "Duplicate transaction" },
            { row: 2, col: "revenue", fix: "$2,500", reason: "Revenue should have $ and comma" },
            { row: 3, col: "date", fix: "2024-01-17", reason: "Date format should be YYYY-MM-DD" },
            { row: 3, col: "quantity", fix: "10", reason: "Negative quantity impossible" },
            { row: 4, col: "revenue", fix: "$3,750", reason: "Revenue outlier - seems like data entry error" },
        ],
        hint: "Look for: duplicates, inconsistent currency, date format variations, and negative quantities"
    },
    {
        id: 6,
        name: "Employee Records",
        description: "HR employee database",
        problems: ["Missing values", "Formatting", "Typos"],
        data: [
            { id: 1, name: "Sarah Johnson", department: "Engineering", salary: "$85,000", hireDate: "2020-06-15" },
            { id: 2, name: "mike wilson", department: "engineering", salary: "75000", hireDate: "06/20/2021" },
            { id: 3, name: "Emily Davis", department: "", salary: "$92,000", hireDate: "2019-03-10" },
            { id: 4, name: "ROBERT BROWN", department: "Sales", salary: "$68,000", hireDate: "2022-01-05" },
            { id: 5, name: "Lisa Miler", department: "Marketing", salary: "$71,000", hireDate: "2021-09-12" },
        ],
        errors: [
            { row: 1, col: "name", fix: "Mike Wilson", reason: "Name should be capitalized" },
            { row: 1, col: "department", fix: "Engineering", reason: "Department should be capitalized" },
            { row: 1, col: "salary", fix: "$75,000", reason: "Salary formatting should be consistent" },
            { row: 1, col: "hireDate", fix: "2021-06-20", reason: "Date format should be YYYY-MM-DD" },
            { row: 2, col: "department", fix: "Engineering", reason: "Missing department value" },
            { row: 3, col: "name", fix: "Robert Brown", reason: "Name should use title case" },
            { row: 4, col: "name", fix: "Lisa Miller", reason: "Typo in last name (Miler -> Miller)" },
        ],
        hint: "Check for: name capitalization, missing departments, salary formatting, date formats, and spelling errors"
    },
    {
        id: 7,
        name: "Restaurant Orders",
        description: "Food delivery orders",
        problems: ["Duplicates", "Outliers", "Inconsistent entries"],
        data: [
            { id: 1, customer: "John Doe", item: "Pizza", quantity: "2", price: "$24.99", status: "Delivered" },
            { id: 2, customer: "Jane Smith", item: "Burger", quantity: "1", price: "$12.50", status: "delivered" },
            { id: 3, customer: "John Doe", item: "Pizza", quantity: "2", price: "$24.99", status: "Delivered" },
            { id: 4, customer: "Bob Jones", item: "Salad", quantity: "100", price: "$8.99", status: "Pending" },
            { id: 5, customer: "Alice Brown", item: "Pasta", quantity: "3", price: "$999.99", status: "DELIVERED" },
        ],
        errors: [
            { row: 1, col: "status", fix: "Delivered", reason: "Status should be capitalized consistently" },
            { row: 2, type: "duplicate", reason: "Duplicate order" },
            { row: 3, col: "quantity", fix: "3", reason: "Quantity outlier - 100 salads unlikely" },
            { row: 4, col: "price", fix: "$38.97", reason: "Price outlier - should be quantity x unit price" },
            { row: 4, col: "status", fix: "Delivered", reason: "Status should use title case" },
        ],
        hint: "Look for: duplicate orders, unrealistic quantities, price errors, and inconsistent status capitalization"
    },
    {
        id: 8,
        name: "Medical Records",
        description: "Patient vital signs",
        problems: ["Missing values", "Outliers", "Formatting"],
        data: [
            { id: 1, patient: "P001", age: "45", heartRate: "72", bloodPressure: "120/80", temp: "98.6" },
            { id: 2, patient: "P002", age: "", heartRate: "68", bloodPressure: "115/75", temp: "98.4" },
            { id: 3, patient: "P003", age: "35", heartRate: "250", bloodPressure: "130/85", temp: "97.8" },
            { id: 4, patient: "P004", age: "52", heartRate: "75", bloodPressure: "0/0", temp: "104.5" },
            { id: 5, patient: "p005", age: "28", heartRate: "70", bloodPressure: "118/76", temp: "98.6 F" },
        ],
        errors: [
            { row: 1, col: "age", fix: "38", reason: "Missing age value" },
            { row: 2, col: "heartRate", fix: "85", reason: "Heart rate outlier - 250 is dangerous/error" },
            { row: 3, col: "bloodPressure", fix: "125/82", reason: "Blood pressure can't be 0/0" },
            { row: 3, col: "temp", fix: "100.5", reason: "Temperature outlier - 104.5F is critical fever" },
            { row: 4, col: "patient", fix: "P005", reason: "Patient ID should be uppercase for consistency" },
            { row: 4, col: "temp", fix: "98.6", reason: "Temperature format should be consistent (no F)" },
        ],
        hint: "Check for: missing ages, impossible vital signs (heart rate >200, BP of 0/0, very high temps), and ID formatting"
    }
];
