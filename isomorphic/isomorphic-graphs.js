const graphData = [];
graphData[0] = [8];
graphData[1] = [10, 2, 7];
graphData[2] = [1, 3, 4];
graphData[3] = [2];
graphData[4] = [5, 6, 2];
graphData[5] = [4];
graphData[6] = [4];
graphData[7] = [1, 8];
graphData[8] = [7, 0];
graphData[9] = [12, 10];
graphData[10] = [11, 9, 1];
graphData[11] = [10];
graphData[12] = [9];


class TreeNode {
    constructor(parentRef, childrenRef, id) {
        this.parent = parentRef;
        this.children = childrenRef || [];
        this.id = id;
    }
    parent = null;
    children = [];
    id = null;
}

function findTreeCenter(graph) {
    const leafs = new Set();
    for (let i = 0; i < graph.length; i++) {
        if (graph[i].length <= 1) {
            leafs.add(i);
        }
    }

    let prevLeafs = leafs;
    let newLeafs;
    let i = 0;
    while (leafs.size < graph.length) {
        if (i++ > 100) {
            break;
        }
        newLeafs = new Set();
        for (let leaf of prevLeafs) {
            const remainingParents = graph[leaf].filter(node => !leafs.has(node));
            if (remainingParents.length > 0) {
                const parent = remainingParents[0];
                const parentDegree = graph[parent].filter(node => !leafs.has(node)).length;
                if (parentDegree <= 1) {
                    newLeafs.add(parent);
                }
            }
        }
        for (let newLeaf of newLeafs) {
            leafs.add(newLeaf);
        }
        prevLeafs = newLeafs;
    }

    return newLeafs ? [...newLeafs] : []; // [] if all of the nodes are leafs
}

function rootTree(root, graph, rootId, visited) {
    const unvisitedChildren = graph[rootId].filter(childId => !visited.has(childId));
    for (let childId of unvisitedChildren) {
        visited.add(childId);
        const childNode = new TreeNode(root, [], childId);
        childNode.parent = root;
        root.children.push(childNode);
        rootTree(childNode, graph, childId, visited);
    }
    return root;
}

function printTree(root, leftPadding = 0) {
    console.log(' '.repeat(leftPadding * 3) + root.id);
    for (let child of root.children) {
        printTree(child, leftPadding + 1);
    }
}

function serializeTree(root) {
    if (root.children.length > 0) {
        const sChildren = root.children
            .map(child => serializeTree(child))
            .sort()
            .join('');
        return '(' + sChildren + ')';
    } else {
        return '()';
    }
}

const treeCenters = findTreeCenter(graphData);
console.log('tree centers: ');
console.log(treeCenters);

if (treeCenters.length) {
    const rootId = treeCenters[0];
    const visited = new Set([rootId]);
    const treeRoot = new TreeNode(null, [], rootId);
    rootTree(treeRoot, graphData, rootId, visited);
    console.log('');
    console.log('tree:');
    printTree(treeRoot);

    const serializedTree = serializeTree(treeRoot);
    console.log('');
    console.log('serialized tree;')
    console.log(serializedTree);
}
