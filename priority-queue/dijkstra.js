import {MinPriorityQueue} from "./min-priority-queue.js";

export function shortestPath(graph, nodes, startNode) {
    const distances = new Map();
    const visited = new Set();

    const queue = new MinPriorityQueue();
    queue.add(0, {node: startNode, prev: null});

    while (!queue.isEmpty()) {
        const record = queue.poll();
        if (visited.has(record.data.node)) {
            continue;
        }
        distances.set(record.data.node, {...record.data, value: record.value});
        const neighbours = graph.has(record.data.node) ? graph.get(record.data.node) : [];
        for (let neighbour of neighbours) {
            queue.add(distances.get(record.data.node).value + neighbour.weight,
                {node: neighbour.node, prev: record.data.node});
        }
        visited.add(record.data.node);
    }

    return distances;
}
