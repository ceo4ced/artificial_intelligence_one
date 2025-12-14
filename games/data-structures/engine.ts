
export interface Scenario {
    title: string;
    description: string;
    data: string[];
    bestAnswer: string;
    acceptableAnswers: string[];
    explanation: string;
    preview: string;
    whyNotOthers: { [key: string]: string };
}

export interface StructureDefinition {
    id: string;
    name: string;
    description: string;
    icon: string;
}

export interface GameState {
    currentScenarioIndex: number;
    score: number;
    perfectAnswers: number;
    correctAnswers: number;
    gameComplete: boolean;
}

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    score: 0,
    perfectAnswers: 0,
    correctAnswers: 0,
    gameComplete: false
};

export const STRUCTURE_DEFINITIONS: StructureDefinition[] = [
    {
        id: 'list',
        name: 'List/Array',
        description: 'Ordered sequence of items accessed by position (index 0, 1, 2...). Best for sequential data.',
        icon: '📝'
    },
    {
        id: 'dictionary',
        name: 'Dictionary/Object',
        description: 'Key-value pairs accessed by name. Best for properties of a single entity.',
        icon: '📖'
    },
    {
        id: 'table',
        name: 'Table',
        description: 'Rows and columns of structured data. Best for records with multiple fields.',
        icon: '📊'
    },
    {
        id: 'tree',
        name: 'Tree',
        description: 'Hierarchical parent-child structure. Best for categories, org charts, file systems.',
        icon: '🌲'
    },
    {
        id: 'graph',
        name: 'Graph',
        description: 'Nodes with connections between them. Best for networks, maps, social relationships.',
        icon: '🕸️'
    }
];

export const SCENARIOS: Scenario[] = [
    {
        title: "Student Playlist",
        description: "A student wants to store their favorite songs in the order they like to listen to them. They frequently add new songs at the end and sometimes skip to specific positions.",
        data: ["Bohemian Rhapsody", "Stairway to Heaven", "Hotel California", "Imagine", "Sweet Child O' Mine"],
        bestAnswer: "list",
        acceptableAnswers: ["list"],
        explanation: "A List/Array is perfect here! The songs have a specific order, and you can access them by position (play song #3). Lists maintain order and allow efficient sequential access.",
        preview: "['Bohemian Rhapsody', 'Stairway to Heaven', 'Hotel California', 'Imagine', 'Sweet Child O\\'Mine']",
        whyNotOthers: {
            table: "Tables are for multiple related properties per item, not simple ordered lists",
            tree: "Trees are for hierarchical relationships, not flat sequential data",
            graph: "Graphs are for complex relationships between items, not simple sequences"
        }
    },
    {
        title: "Student Records Database",
        description: "A school needs to store information about students including their ID, name, grade, GPA, and email. Teachers need to search, sort, and filter this information.",
        data: ["ID: 1001, Name: Alice, Grade: 10, GPA: 3.8", "ID: 1002, Name: Bob, Grade: 11, GPA: 3.5", "ID: 1003, Name: Carol, Grade: 10, GPA: 3.9"],
        bestAnswer: "table",
        acceptableAnswers: ["table"],
        explanation: "A Table is the best choice! Each student has multiple properties (columns), and you have multiple students (rows). Tables excel at structured data with consistent fields and support sorting, filtering, and searching.",
        preview: "ID | Name  | Grade | GPA\n1001 | Alice | 10 | 3.8\n1002 | Bob | 11 | 3.5\n1003 | Carol | 10 | 3.9",
        whyNotOthers: {
            list: "Lists can't efficiently organize multiple properties per student",
            tree: "Students don't have a parent-child hierarchy",
            graph: "No complex relationships between students need modeling"
        }
    },
    {
        title: "User Profile Information",
        description: "A website needs to store a user's account information: username, email, age, city, and premium status. This data needs to be quickly accessible by property name.",
        data: ["username: alice123", "email: alice@example.com", "age: 25", "city: Seattle", "premium: true"],
        bestAnswer: "dictionary",
        acceptableAnswers: ["dictionary", "table"],
        explanation: "A Dictionary/Object is ideal! You can quickly look up any property by name (user.email, user.age). Dictionaries are perfect for a single entity with multiple named properties.",
        preview: "{\n  username: 'alice123',\n  email: 'alice@example.com',\n  age: 25,\n  city: 'Seattle',\n  premium: true\n}",
        whyNotOthers: {
            list: "Lists use numeric indexes, not descriptive property names",
            tree: "No hierarchical structure in flat user properties",
            graph: "No relationships between properties to model"
        }
    },
    {
        title: "Company Organization Chart",
        description: "A company needs to represent its management structure: CEO at the top, with VPs reporting to CEO, Directors reporting to VPs, and Managers reporting to Directors.",
        data: ["CEO", "├─ VP Engineering", "│  ├─ Director of Dev", "│  └─ Director of QA", "└─ VP Sales", "   └─ Sales Director"],
        bestAnswer: "tree",
        acceptableAnswers: ["tree"],
        explanation: "A Tree is perfect! Org charts are classic hierarchical structures with clear parent-child relationships. Each person reports to exactly one boss (except CEO), creating a tree structure.",
        preview: "CEO\n├── VP Engineering\n│   ├── Director of Dev\n│   └── Director of QA\n└── VP Sales\n    └── Sales Director",
        whyNotOthers: {
            list: "Lists can't represent hierarchical reporting relationships",
            table: "Tables can't easily show parent-child hierarchies",
            graph: "Too complex - trees are simpler for strict hierarchies where each node has one parent"
        }
    },
    {
        title: "Social Network Friendships",
        description: "A social network needs to store who is friends with whom. Alice is friends with Bob and Carol. Bob is friends with Alice and Dave. Carol is friends with Alice and Dave. Dave is friends with Bob and Carol.",
        data: ["Alice ↔ Bob", "Alice ↔ Carol", "Bob ↔ Dave", "Carol ↔ Dave"],
        bestAnswer: "graph",
        acceptableAnswers: ["graph"],
        explanation: "A Graph is the best structure! Friendships are bidirectional relationships between people. Graphs excel at representing networks where items can have multiple connections to each other.",
        preview: "Alice --- Bob\n  |        |\nCarol --- Dave",
        whyNotOthers: {
            list: "Can't efficiently represent bidirectional relationships",
            table: "Would need complex lookups to find all friendships",
            tree: "Friendship networks aren't hierarchical - people have multiple equal connections"
        }
    },
    {
        title: "Product Catalog Categories",
        description: "An e-commerce site organizes products: Electronics contains Computers and Phones. Computers contains Laptops and Desktops. Phones contains iOS and Android. Each category can contain subcategories.",
        data: ["Electronics", "├─ Computers", "│  ├─ Laptops", "│  └─ Desktops", "└─ Phones", "   ├─ iOS", "   └─ Android"],
        bestAnswer: "tree",
        acceptableAnswers: ["tree"],
        explanation: "A Tree is ideal! Product categories form a natural hierarchy where each subcategory belongs to exactly one parent category. Trees make it easy to browse from general to specific.",
        preview: "Electronics\n├── Computers\n│   ├── Laptops\n│   └── Desktops\n└── Phones\n    ├── iOS\n    └── Android",
        whyNotOthers: {
            list: "Can't show parent-child category relationships",
            table: "Doesn't naturally represent nested hierarchies",
            graph: "Too complex - categories have simple parent-child structure, not complex networks"
        }
    },
    {
        title: "City Road Network",
        description: "A mapping app needs to store a city's roads. Each intersection connects to multiple other intersections. Main & 1st connects to Main & 2nd and Elm & 1st. Intersections can connect to any other nearby intersection.",
        data: ["Main & 1st ↔ Main & 2nd", "Main & 1st ↔ Elm & 1st", "Main & 2nd ↔ Elm & 2nd", "Elm & 1st ↔ Elm & 2nd", "Elm & 2nd ↔ Oak & 2nd"],
        bestAnswer: "graph",
        acceptableAnswers: ["graph"],
        explanation: "A Graph is perfect! Road networks are classic graph problems. Each intersection is a node, and roads are edges connecting them. Graphs enable finding shortest paths and navigation.",
        preview: "Main&1st --- Main&2nd\n   |            |\nElm&1st --- Elm&2nd --- Oak&2nd",
        whyNotOthers: {
            list: "Can't represent complex interconnections between locations",
            table: "Would require complex queries to find connected intersections",
            tree: "Road networks aren't hierarchical - intersections connect in complex ways"
        }
    },
    {
        title: "Daily Todo List",
        description: "A productivity app stores daily tasks in the order you plan to do them: Morning tasks first, then afternoon, then evening. You often reorder tasks and check them off sequentially.",
        data: ["Wake up and exercise", "Reply to emails", "Team meeting at 10am", "Lunch break", "Finish project report", "Review code", "Dinner"],
        bestAnswer: "list",
        acceptableAnswers: ["list"],
        explanation: "A List/Array is best! Tasks have a specific order you want to follow. Lists maintain sequence, allow reordering, and you can iterate through them checking items off one by one.",
        preview: "['Wake up and exercise', 'Reply to emails', 'Team meeting at 10am', 'Lunch break', 'Finish project report', 'Review code', 'Dinner']",
        whyNotOthers: {
            table: "Tasks don't have multiple properties that need columns",
            tree: "Tasks don't have parent-child relationships",
            graph: "No complex relationships between tasks to model"
        }
    },
    {
        title: "Family Tree Genealogy",
        description: "A genealogy app tracks family relationships. Grandparents have children (parents), who have their own children (you and siblings). Each person has exactly one set of biological parents.",
        data: ["Grandma & Grandpa", "├─ Mom", "│  ├─ You", "│  └─ Sister", "└─ Uncle", "   └─ Cousin"],
        bestAnswer: "tree",
        acceptableAnswers: ["tree"],
        explanation: "A Tree is the natural choice! Family trees are literally named after this data structure. Each person (except the root ancestors) has exactly one parent node, creating a clear hierarchy.",
        preview: "Grandparents\n├── Mom\n│   ├── You\n│   └── Sister\n└── Uncle\n    └── Cousin",
        whyNotOthers: {
            list: "Can't show generational parent-child relationships",
            table: "Doesn't naturally represent family hierarchies",
            graph: "More complex than needed - family descent follows simple tree structure"
        }
    },
    {
        title: "E-commerce Order History",
        description: "A shopping app stores your past orders, each with order number, date, items purchased, total cost, and shipping status. You want to search and sort by date or total.",
        data: ["Order #1001, 2024-01-15, $49.99, Delivered", "Order #1002, 2024-02-03, $129.99, Shipped", "Order #1003, 2024-02-20, $24.99, Processing"],
        bestAnswer: "table",
        acceptableAnswers: ["table"],
        explanation: "A Table is ideal! Each order has multiple properties (columns), and you have many orders (rows). Tables support efficient sorting by date or cost and filtering by status.",
        preview: "Order # | Date | Total | Status\n1001 | 2024-01-15 | $49.99 | Delivered\n1002 | 2024-02-03 | $129.99 | Shipped\n1003 | 2024-02-20 | $24.99 | Processing",
        whyNotOthers: {
            list: "Can't efficiently organize multiple properties per order",
            tree: "Orders don't have hierarchical relationships",
            graph: "No complex relationships between orders"
        }
    }
];

export interface AnswerResult {
    isBest: boolean;
    isAcceptable: boolean;
    points: number;
    explanation: string;
    newState: GameState;
}

export function checkAnswer(
    state: GameState,
    scenario: Scenario,
    selectedStructureId: string
): AnswerResult {
    const isBest = selectedStructureId === scenario.bestAnswer;
    const isAcceptable = scenario.acceptableAnswers.includes(selectedStructureId);

    let points = 0;

    // Create new state (pure update)
    const newState = { ...state };

    if (isBest) {
        points = 100;
        newState.perfectAnswers++;
        newState.correctAnswers++;
        newState.score += 100;
    } else if (isAcceptable) {
        points = 60;
        newState.correctAnswers++;
        newState.score += 60;
    }

    return {
        isBest,
        isAcceptable,
        points,
        explanation: scenario.explanation,
        newState
    };
}
