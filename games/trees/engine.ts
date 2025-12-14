
export interface Item {
    name: string;
    type: 'file' | 'folder';
    category?: string;
}

export interface TreeNode {
    name: string;
    type: 'file' | 'folder';
    children?: TreeNode[];
    expanded?: boolean;
    category?: string;
}

export interface Scenario {
    title: string;
    description: string;
    items: Item[];
    targetDepth: number;
    hint: string;
}

export interface TreeGameState {
    currentScenarioIndex: number;
    score: number;
    tree: TreeNode;
    poolItems: Item[];
    searchActive: boolean;
    searchTarget: string | null;
    searchStartTime: number;
}

export const SCENARIOS: Scenario[] = [
    {
        title: "Personal Desktop Cleanup",
        description: "You have a messy desktop with 15 random files. Organize them into a logical folder structure.",
        items: [
            { name: "vacation.jpg", type: "file", category: "photos" },
            { name: "birthday.jpg", type: "file", category: "photos" },
            { name: "resume.pdf", type: "file", category: "documents" },
            { name: "taxes2024.pdf", type: "file", category: "documents" },
            { name: "game.exe", type: "file", category: "programs" },
            { name: "music_player.exe", type: "file", category: "programs" },
            { name: "shopping_list.txt", type: "file", category: "documents" },
            { name: "song1.mp3", type: "file", category: "music" },
            { name: "song2.mp3", type: "file", category: "music" },
            { name: "recipe.txt", type: "file", category: "documents" },
            { name: "project.zip", type: "file", category: "work" },
            { name: "meeting_notes.txt", type: "file", category: "work" },
            { name: "family.jpg", type: "file", category: "photos" }
        ],
        targetDepth: 3,
        hint: "Group by type: Photos, Documents, Music, Programs, Work"
    },
    {
        title: "Student Project Folder",
        description: "Organize your school project files for a science fair presentation.",
        items: [
            { name: "hypothesis.docx", type: "file", category: "research" },
            { name: "results.xlsx", type: "file", category: "research" },
            { name: "slide1.pptx", type: "file", category: "presentation" },
            { name: "slide2.pptx", type: "file", category: "presentation" },
            { name: "experiment1.jpg", type: "file", category: "photos" },
            { name: "experiment2.jpg", type: "file", category: "photos" },
            { name: "data.csv", type: "file", category: "research" },
            { name: "bibliography.txt", type: "file", category: "research" },
            { name: "draft.docx", type: "file", category: "writing" },
            { name: "final_paper.docx", type: "file", category: "writing" },
            { name: "notes.txt", type: "file", category: "research" }
        ],
        targetDepth: 3,
        hint: "Organize by: Research, Presentation, Photos, Writing"
    },
    {
        title: "Developer Source Code",
        description: "Structure a web development project with proper organization.",
        items: [
            { name: "index.html", type: "file", category: "frontend" },
            { name: "styles.css", type: "file", category: "frontend" },
            { name: "app.js", type: "file", category: "frontend" },
            { name: "server.py", type: "file", category: "backend" },
            { name: "database.py", type: "file", category: "backend" },
            { name: "api.py", type: "file", category: "backend" },
            { name: "logo.png", type: "file", category: "assets" },
            { name: "icon.svg", type: "file", category: "assets" },
            { name: "README.md", type: "file", category: "docs" },
            { name: "API_GUIDE.md", type: "file", category: "docs" },
            { name: "test_app.py", type: "file", category: "tests" },
            { name: "test_api.py", type: "file", category: "tests" }
        ],
        targetDepth: 3,
        hint: "Standard structure: src/(frontend, backend), assets, docs, tests"
    },
    {
        title: "Photography Portfolio",
        description: "Organize a photographer's portfolio by categories and dates.",
        items: [
            { name: "portrait1.jpg", type: "file", category: "portraits" },
            { name: "portrait2.jpg", type: "file", category: "portraits" },
            { name: "landscape1.jpg", type: "file", category: "landscapes" },
            { name: "landscape2.jpg", type: "file", category: "landscapes" },
            { name: "wedding_jan.jpg", type: "file", category: "events" },
            { name: "wedding_feb.jpg", type: "file", category: "events" },
            { name: "street1.jpg", type: "file", category: "street" },
            { name: "street2.jpg", type: "file", category: "street" },
            { name: "macro1.jpg", type: "file", category: "nature" },
            { name: "macro2.jpg", type: "file", category: "nature" },
            { name: "client_contract.pdf", type: "file", category: "business" },
            { name: "pricing.xlsx", type: "file", category: "business" }
        ],
        targetDepth: 3,
        hint: "Categories: Portraits, Landscapes, Events, Street, Nature, Business"
    },
    {
        title: "Company HR System",
        description: "Organize employee records and HR documents efficiently.",
        items: [
            { name: "alice_resume.pdf", type: "file", category: "hiring" },
            { name: "bob_resume.pdf", type: "file", category: "hiring" },
            { name: "payroll_jan.xlsx", type: "file", category: "payroll" },
            { name: "payroll_feb.xlsx", type: "file", category: "payroll" },
            { name: "benefits_guide.pdf", type: "file", category: "benefits" },
            { name: "insurance_plan.pdf", type: "file", category: "benefits" },
            { name: "employee_handbook.pdf", type: "file", category: "policies" },
            { name: "conduct_policy.pdf", type: "file", category: "policies" },
            { name: "training_video.mp4", type: "file", category: "training" },
            { name: "safety_cert.pdf", type: "file", category: "training" },
            { name: "team_photo.jpg", type: "file", category: "misc" }
        ],
        targetDepth: 3,
        hint: "Organize by: Hiring, Payroll, Benefits, Policies, Training"
    },
    {
        title: "Music Library",
        description: "Organize a digital music collection by artist, album, and genre.",
        items: [
            { name: "track1_rock.mp3", type: "file", category: "rock" },
            { name: "track2_rock.mp3", type: "file", category: "rock" },
            { name: "track1_pop.mp3", type: "file", category: "pop" },
            { name: "track2_pop.mp3", type: "file", category: "pop" },
            { name: "track1_jazz.mp3", type: "file", category: "jazz" },
            { name: "track2_jazz.mp3", type: "file", category: "jazz" },
            { name: "playlist_workout.m3u", type: "file", category: "playlists" },
            { name: "playlist_relax.m3u", type: "file", category: "playlists" },
            { name: "album_art1.jpg", type: "file", category: "artwork" },
            { name: "album_art2.jpg", type: "file", category: "artwork" },
            { name: "concert_ticket.pdf", type: "file", category: "memories" }
        ],
        targetDepth: 3,
        hint: "Structure: Music/(Rock, Pop, Jazz), Playlists, Artwork, Memories"
    },
    {
        title: "E-commerce Product Catalog",
        description: "Organize products into a hierarchical category structure.",
        items: [
            { name: "laptop_dell.txt", type: "file", category: "electronics_computers" },
            { name: "laptop_hp.txt", type: "file", category: "electronics_computers" },
            { name: "iphone.txt", type: "file", category: "electronics_phones" },
            { name: "samsung.txt", type: "file", category: "electronics_phones" },
            { name: "shirt_blue.txt", type: "file", category: "clothing_shirts" },
            { name: "shirt_red.txt", type: "file", category: "clothing_shirts" },
            { name: "jeans.txt", type: "file", category: "clothing_pants" },
            { name: "shorts.txt", type: "file", category: "clothing_pants" },
            { name: "chair.txt", type: "file", category: "furniture" },
            { name: "desk.txt", type: "file", category: "furniture" },
            { name: "lamp.txt", type: "file", category: "furniture" }
        ],
        targetDepth: 4,
        hint: "Deep hierarchy: Electronics/(Computers, Phones), Clothing/(Shirts, Pants), Furniture"
    },
    {
        title: "Research Lab Data",
        description: "Organize scientific research data with experiments and analysis.",
        items: [
            { name: "exp1_data.csv", type: "file", category: "experiment1" },
            { name: "exp1_analysis.py", type: "file", category: "experiment1" },
            { name: "exp1_results.txt", type: "file", category: "experiment1" },
            { name: "exp2_data.csv", type: "file", category: "experiment2" },
            { name: "exp2_analysis.py", type: "file", category: "experiment2" },
            { name: "exp2_results.txt", type: "file", category: "experiment2" },
            { name: "paper_draft.docx", type: "file", category: "publications" },
            { name: "paper_final.pdf", type: "file", category: "publications" },
            { name: "raw_sensor.dat", type: "file", category: "raw_data" },
            { name: "calibration.dat", type: "file", category: "raw_data" },
            { name: "grant_proposal.pdf", type: "file", category: "admin" }
        ],
        targetDepth: 3,
        hint: "Group by: Experiments/(Exp1, Exp2), Publications, Raw_Data, Admin"
    }
];

export const INITIAL_STATE: TreeGameState = {
    currentScenarioIndex: 0,
    score: 0,
    tree: { name: "Desktop", type: "folder", children: [], expanded: true },
    poolItems: [],
    searchActive: false,
    searchTarget: null,
    searchStartTime: 0
};

// Pure Functions

export function initializeScenario(index: number): TreeGameState {
    const scenario = SCENARIOS[index];
    if (!scenario) return INITIAL_STATE;

    return {
        ...INITIAL_STATE,
        currentScenarioIndex: index,
        poolItems: JSON.parse(JSON.stringify(scenario.items)), // Deep copy items
        tree: {
            name: index === 0 ? "Desktop" : scenario.title.replace(/ /g, '_'),
            type: "folder",
            children: [],
            expanded: true
        }
    };
}

export function addChild(tree: TreeNode, targetNodePath: number[], child: TreeNode): TreeNode {
    // Deep copy to maintain immutability
    const newTree = JSON.parse(JSON.stringify(tree));
    let current = newTree;

    for (const index of targetNodePath) {
        if (!current.children || !current.children[index]) return tree;
        current = current.children[index];
    }

    // Ensure children array exists
    if (!current.children) current.children = [];
    current.children.push(child);

    return newTree;
}

export function toggleNodeExpand(tree: TreeNode, targetNodePath: number[]): TreeNode {
    const newTree = JSON.parse(JSON.stringify(tree));
    let current = newTree;

    for (const index of targetNodePath) {
        if (!current.children || !current.children[index]) return tree;
        current = current.children[index];
    }

    if (current.type === 'folder') {
        current.expanded = !current.expanded;
    }

    return newTree;
}

export function getMaxDepth(node: TreeNode, currentDepth = 0): number {
    if (!node.children || node.children.length === 0) {
        return currentDepth;
    }
    return Math.max(...node.children.map(child => getMaxDepth(child, currentDepth + 1)));
}

export function calculateBalance(node: TreeNode): number {
    if (!node.children || node.children.length === 0) return 100;

    const depths = node.children.map(child => getMaxDepth(child));
    const minDepth = Math.min(...depths);
    const maxDepth = Math.max(...depths);

    if (maxDepth === 0) return 100;
    return Math.round((minDepth / maxDepth) * 100);
}

export function getAllFiles(node: TreeNode, files: string[] = []): string[] {
    if (node.type === 'file') {
        files.push(node.name);
    } else if (node.children) {
        node.children.forEach(child => getAllFiles(child, files));
    }
    return files;
}

export function findItemDepth(node: TreeNode, targetName: string, currentDepth = 0): number {
    if (node.name === targetName) return currentDepth;

    if (node.children) {
        for (const child of node.children) {
            const depth = findItemDepth(child, targetName, currentDepth + 1);
            if (depth !== -1) return depth;
        }
    }
    return -1;
}

export function collapseAllNodes(node: TreeNode): void {
    // Modifies in place if we passed a mutable copy, but function signature should imply pure if we return a new one.
    // For recursive logic, it's easier to return a new copy or modify a copy. 
    // For performance in UI visualization, modification of the state copy is fine before setting state.
    if (node.type === 'folder') {
        node.expanded = false;
        if (node.children) {
            node.children.forEach(child => collapseAllNodes(child));
        }
    }
}
