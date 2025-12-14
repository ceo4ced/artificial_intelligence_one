
export interface GraphNode {
    id: number;
    x: number;
    y: number;
    label: string;
    radius: number;
}

export interface GraphEdge {
    from: number; // Node ID
    to: number;   // Node ID
    weight: number | null;
    directed: boolean;
}

export interface Question {
    text: string;
    answer: string;
    type: string;
}

export interface Scenario {
    title: string;
    description: string;
    directed: boolean;
    weighted: boolean;
    nodeLabels: string[];
    questions: Question[];
}

export interface GameState {
    currentScenarioIndex: number;
    nodes: GraphNode[];
    edges: GraphEdge[];
    scenarioScores: number[];
    scenariosCompleted: number;
    nodeIdCounter: number;
}

export const SCENARIOS: Scenario[] = [
    {
        title: "Social Network",
        description: "Map out friendships between people. Create bidirectional connections!",
        directed: false,
        weighted: false,
        nodeLabels: ["Alice", "Bob", "Carol", "Dan", "Eve"],
        questions: [
            { text: "How many people are in this network?", answer: "5", type: "count-nodes" },
            { text: "Who has the most friends? (name)", answer: "", type: "most-connected" },
            { text: "Are Alice and Eve connected (directly or indirectly)? (yes/no)", answer: "", type: "connected" }
        ]
    },
    {
        title: "City Roads",
        description: "Build a road network between cities. Bidirectional roads with distances!",
        directed: false,
        weighted: true,
        nodeLabels: ["NYC", "Boston", "Philly", "DC", "Pittsburgh"],
        questions: [
            { text: "How many cities are in the network?", answer: "5", type: "count-nodes" },
            { text: "How many roads connect the cities?", answer: "", type: "count-edges" },
            { text: "What is the total of all road distances?", answer: "", type: "sum-weights" }
        ]
    },
    {
        title: "Website Links",
        description: "Create hyperlinks between web pages. Links are one-directional!",
        directed: true,
        weighted: false,
        nodeLabels: ["Home", "About", "Blog", "Contact", "Shop"],
        questions: [
            { text: "How many web pages are there?", answer: "5", type: "count-nodes" },
            { text: "Which page has the most outgoing links? (name)", answer: "", type: "most-outgoing" },
            { text: "How many total links exist?", answer: "", type: "count-edges" }
        ]
    },
    {
        title: "Flight Routes",
        description: "Map airline routes with flight times. Directed, weighted connections!",
        directed: true,
        weighted: true,
        nodeLabels: ["LAX", "JFK", "ORD", "DFW", "ATL"],
        questions: [
            { text: "How many airports are in the network?", answer: "5", type: "count-nodes" },
            { text: "What is the shortest flight time in your network?", answer: "", type: "min-weight" },
            { text: "How many direct flights exist?", answer: "", type: "count-edges" }
        ]
    },
    {
        title: "Task Dependencies",
        description: "Show which tasks must be completed before others. Directed graph!",
        directed: true,
        weighted: false,
        nodeLabels: ["Start", "Design", "Code", "Test", "Deploy"],
        questions: [
            { text: "How many tasks are there?", answer: "5", type: "count-nodes" },
            { text: "Which task has the most dependencies pointing to it? (name)", answer: "", type: "most-incoming" },
            { text: "Does your graph have a cycle? (yes/no)", answer: "no", type: "has-cycle" }
        ]
    },
    {
        title: "Family Tree",
        description: "Create parent-child relationships. Directed edges from parent to child!",
        directed: true,
        weighted: false,
        nodeLabels: ["Grandma", "Dad", "Mom", "You", "Sister"],
        questions: [
            { text: "How many family members are included?", answer: "5", type: "count-nodes" },
            { text: "Who is the root ancestor? (has no incoming edges)", answer: "", type: "find-root" },
            { text: "How many parent-child relationships exist?", answer: "", type: "count-edges" }
        ]
    }
];

export const INITIAL_STATE: GameState = {
    currentScenarioIndex: 0,
    nodes: [],
    edges: [],
    scenarioScores: [0, 0, 0, 0, 0, 0],
    scenariosCompleted: 0,
    nodeIdCounter: 0
};

export function computeAnswer(question: Question, nodes: GraphNode[], edges: GraphEdge[]): string {
    switch (question.type) {
        case 'count-nodes':
            return nodes.length.toString();

        case 'count-edges':
            return edges.length.toString();

        case 'sum-weights':
            return edges.reduce((sum, e) => sum + (e.weight || 0), 0).toString();

        case 'min-weight':
            if (edges.length === 0) return '0';
            return Math.min(...edges.map(e => e.weight || 0)).toString();

        case 'most-connected':
            if (nodes.length === 0) return '';
            const degrees = nodes.map(n => {
                const degree = edges.filter(e => e.from === n.id || e.to === n.id).length;
                return { node: n, degree };
            });
            const maxDegree = Math.max(0, ...degrees.map(d => d.degree));
            const mostConnected = degrees.find(d => d.degree === maxDegree);
            return mostConnected ? mostConnected.node.label.toLowerCase() : '';

        case 'most-outgoing':
            if (nodes.length === 0) return '';
            const outgoing = nodes.map(n => {
                const count = edges.filter(e => e.from === n.id).length;
                return { node: n, count };
            });
            const maxOut = Math.max(0, ...outgoing.map(o => o.count));
            const mostOut = outgoing.find(o => o.count === maxOut);
            return mostOut ? mostOut.node.label.toLowerCase() : '';

        case 'most-incoming':
            if (nodes.length === 0) return '';
            const incoming = nodes.map(n => {
                const count = edges.filter(e => e.to === n.id).length;
                return { node: n, count };
            });
            const maxIn = Math.max(0, ...incoming.map(i => i.count));
            const mostIn = incoming.find(i => i.count === maxIn);
            return mostIn ? mostIn.node.label.toLowerCase() : '';

        case 'find-root':
            if (nodes.length === 0) return '';
            const root = nodes.find(n => !edges.some(e => e.to === n.id));
            return root ? root.label.toLowerCase() : '';

        case 'connected':
            if (nodes.length === 0) return 'no';
            const visited = new Set<number>();
            const queue = [nodes[0].id];
            visited.add(nodes[0].id);

            while (queue.length > 0) {
                const current = queue.shift()!;
                edges.forEach(e => {
                    if (e.from === current && !visited.has(e.to)) {
                        visited.add(e.to);
                        queue.push(e.to);
                    }
                    if (!e.directed && e.to === current && !visited.has(e.from)) {
                        visited.add(e.from);
                        queue.push(e.from);
                    }
                });
            }

            return visited.size === nodes.length ? 'yes' : 'no';

        case 'has-cycle':
            return hasCycle(nodes, edges) ? 'yes' : 'no'; // Should allow directed/undirected detection? 
        // Original code treated directed logic.
        // But scenarios[0] is undirected. Does `hasCycle` work for undirected?
        // Original: "const outgoing = edges.filter(e => e.from === nodeId);"
        // For undirected graphs, cycle detection usually treats edge as bi-directional.
        // However, the original code logic seems tailored for Directed Acyclic Graphs (Task Dependencies) which is the only one asking for cycle?
        // Check questions: only "Task Dependencies" asks "Does your graph have a cycle?". It is directed.
        // So default DFS cycle detection is fine for directed.

        default:
            return question.answer;
    }
}

function hasCycle(nodes: GraphNode[], edges: GraphEdge[]): boolean {
    const visited = new Set<number>();
    const recStack = new Set<number>();

    function dfs(nodeId: number): boolean {
        visited.add(nodeId);
        recStack.add(nodeId);

        const outgoing = edges.filter(e => e.from === nodeId);
        for (let edge of outgoing) {
            if (!visited.has(edge.to)) {
                if (dfs(edge.to)) return true;
            } else if (recStack.has(edge.to)) {
                return true;
            }
        }

        recStack.delete(nodeId);
        return false;
    }

    for (let node of nodes) {
        if (!visited.has(node.id)) {
            if (dfs(node.id)) return true;
        }
    }

    return false;
}

export function distanceToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy);
}
