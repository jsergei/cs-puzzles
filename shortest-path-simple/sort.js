const graphLetters = ['d', 'g', 'c', 'b', 'a', 'h', 't', 'f', 'e'];
const graphData = new Map([
    ['d', [{weight: 10, node: 'g'}, {weight: 3, node: 'c'}]],
    ['c', [{weight: 1, node: 'h'}, {weight: 5, node: 'g'}]],
    ['g', [{weight: 8, node: 'b'}, {weight: 4, node: 'a'}]],
    ['h', [{weight: 10, node: 'f'}, {weight: 2, node: 'a'}]],
    ['a', [{weight: 2, node: 'b'}, {weight: 1, node: 't'}, {weight: 3, node: 'f'}]],
    ['b', [{weight: 7, node: 't'}]],
    ['t', [{weight: 6, node: 'e'}]],
    ['f', [{weight: 5, node: 'e'}]]
]);


function visitNeighbors(graph, startVertex, visited, ordered, currentPath) {
    if (currentPath.includes(startVertex)) {
        return true; // cycle detected
    }
    currentPath.push(startVertex);

    if (visited.has(startVertex)) { // bumped into already processed parts of the graph
        currentPath.pop();
        return false;
    }
    visited.add(startVertex);

    const neighbours = graph.has(startVertex) ? graph.get(startVertex) : [];
    for (let neighbor of neighbours) {
        const cycle = visitNeighbors(graph, neighbor.node, visited, ordered, currentPath);
        if (cycle) {
            return true;
        }
    }

    ordered.push(startVertex);
    currentPath.pop();

    return false; // report no cycles
}

function topSort(graph, letters) {
    const ordered = [];
    const visited = new Set();
    let hasCycle = false;
    for (let letter of letters) {
        if (visited.has(letter)) {
            continue;
        }
        const orderedChunk = [];
        const cycle = visitNeighbors(graph, letter, visited, orderedChunk, []);
        if (cycle) {
            hasCycle = true;
            break;
        }
        orderedChunk.reverse();
        ordered.unshift(...orderedChunk);
    }

    return {hasCycle, ordered};
}

function calculateDistances(graph, ordered) {
    const distances = new Map();
    for (let node of ordered) {
        distances.set(node, Number.POSITIVE_INFINITY);
    }
    distances.set(ordered[0], 0);

    for (let node of ordered) {
        const neighbours = graph.has(node) ? graph.get(node): [];
        for (let neighbour of neighbours) {
            if (distances.get(node) + neighbour.weight < distances.get(neighbour.node)) {
                distances.set(neighbour.node, distances.get(node) + neighbour.weight);
            }
        }
    }

    return distances;
}

const sortResults = topSort(graphData, graphLetters);
if (sortResults.hasCycle) {
    console.log('A cycle has been detected');
} else {
    const distances = calculateDistances(graphData, sortResults.ordered);
    console.log('order:');
    console.log([...distances]);
}
