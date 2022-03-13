const taskList1 = ['a', 'b', 'd', 'c', 'z', 'e', 't', 'x', 'l', 'k', 'p', 'm'];
const dependencyList1 = [
    ['a', 'b'], ['d', 'b'], ['d', 'c'],  ['b', 'c'], ['z', 'c'], ['e', 'c'], ['e', 'a'],
    ['t', 'x'], ['l', 't'],
    ['k', 'p'], ['k', 'm'], ['a', 'k'],
    // ['m', 'a'] // error: cycle
];

const taskList2 = ['a', 'b', 'c', 'd', 'e', 'f'];
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

function kahnSort(depList, tasks) {
    const graph = new Map();

    // create a directed graph from the dependency list
    for (let [x, y] of depList) {
        if (graph.has(y)) {
            graph.get(y).push(x);
        } else {
            graph.set(y, [x]);
        }
    }

    const degree = new Map();

    for (let task of tasks) {
        degree.set(task, 0);
    }

    // initialize all degrees (how many incoming edges each node has)
    for (let task of tasks) {
        const neighbours = graph.has(task) ? graph.get(task) : [];
        for (let neighbour of neighbours) {
            degree.set(neighbour, degree.get(neighbour) + 1);
        }
    }

    let leaves = [];
    for (let task of tasks) {
        if (degree.get(task) === 0) {
            leaves.push(task);
        }
    }

    const ordered = [...leaves];
    let hasCycle = false;
    while (leaves.length > 0) {
        let newLeaves = [];
        for (let leaf of leaves) {
            const neighbours = graph.has(leaf) ? graph.get(leaf) : [];
            for (let neighbour of neighbours) {
                if (degree.get(neighbour) === 1) {
                    newLeaves.push(neighbour);
                }
                degree.set(neighbour, degree.get(neighbour) - 1);
            }
        }
        ordered.push(...newLeaves);
        leaves = newLeaves;
    }

    if (ordered.length !== tasks.length) {
        hasCycle = true;
    }

    return {hasCycle, ordered};
}

const sortResults = kahnSort(dependencyList1, taskList1);
if (sortResults.hasCycle) {
    console.log('A cycle has been detected');
} else {
    console.log('order:');
    console.log(sortResults.ordered);
}
