const dependencyList1 = [
    ['a', 'b'], ['d', 'b'], ['d', 'c'],  ['b', 'c'], ['z', 'c'], ['e', 'c'], ['e', 'a'],
    ['t', 'x'], ['l', 't'],
    ['k', 'p'], ['k', 'm'], ['a', 'k'],
    // ['m', 'a'] // error: cycle
];

const dependencyList2 = [
    ['b', 'a'], ['b', 'c'],
    ['c', 'a'], ['c', 'd'],
    ['d', 'a'], ['d', 'e'],
    ['e', 'a'],
    ['f', 'b'], ['f', 'c'], ['f', 'd'], ['f', 'e']
];

function getNextLetter(pairIndex, depList) {
    if (pairIndex[0] >= depList.length) {
        return null;
    } else {
        const letter =  depList[pairIndex[0]][pairIndex[1]];
        pairIndex[1]++;
        if (pairIndex[1] > 1) {
            pairIndex[0]++;
            pairIndex[1] = 0;
        }
        return letter;
    }
}

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
        const cycle = visitNeighbors(graph, neighbor, visited, ordered, currentPath);
        if (cycle) {
            return true;
        }
    }

    ordered.push(startVertex);
    currentPath.pop();

    return false; // report no cycles
}

function topSort(depList) {
    const graph = new Map();

    // create a directed graph from the dependency list
    for (let [x, y] of depList) {
        if (graph.has(y)) {
            graph.get(y).push(x);
        } else {
            graph.set(y, [x]);
        }
    }

    const ordered = [];
    const pairIndex = [0, 0];
    const visited = new Set();
    let hasCycle = false;
    while (true) {
        const letter = getNextLetter(pairIndex, depList);
        if (!letter) {
            break;
        }
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

const sortResults = topSort(dependencyList2);
if (sortResults.hasCycle) {
    console.log('A cycle has been detected');
} else {
    console.log('order:');
    console.log(sortResults.ordered);
}
