const mazeData = [ // 0 - free path, 1 - road block
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 1],
    [0, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0]
];
const startPosition = [1, 0]; // x, y
const endPosition = [2, 2]
const visited = [];
const previous = [];
const width = 6;
const height = 6;
const directions = [ //[x,y]
    [-1, 0], [1, 0], [0, -1], [0, 1]
];

function positionToAddress(position) {
    return position[0] + width * position[1];
}

function isSamePosition(one, another) {
    return one[0] === another[0] && one[1] === another[1];
}

function visitNeighbours(maze, [currentX, currentY]) {
    const newPositions = [];
    for (let direction of directions) {
        const newPosition = [currentX + direction[0], currentY + direction[1]];
        if (newPosition[0] < 0 || newPosition[0] >= width || newPosition[1] < 0 || newPosition[1] >= height) {
            continue; // out of bounds
        }
        if (maze[newPosition[1]][newPosition[0]]) {
            continue; // road block
        }
        if (visited[positionToAddress(newPosition)]) {
            continue; // already visited
        }
        newPositions.push(newPosition);
    }
    return newPositions;
}

function findPath() {
    const queue = [startPosition];

    // Use the breadth-first search to find the end position
    let found = false;
    while (queue.length > 0) {
        const currentPosition = queue.pop();
        const newPositions = visitNeighbours(mazeData, currentPosition);
        for (let newPosition of newPositions) {
            const newAddress = positionToAddress(newPosition);
            previous[newAddress] = currentPosition;
            visited[newAddress] = true;
            if (isSamePosition(newPosition, endPosition)) { // found the end node
                found = true;
                break;
            }
            queue.unshift(newPosition);
        }
        if (found) {
            break;
        }
    }

    if (!found) {
        throw new Error('Could not find the end position');
    }

    // Trace back to the starting position to find the order of visited positions
    let currentPosition = endPosition;
    const path = [endPosition];
    while (!isSamePosition(currentPosition, startPosition)) {
        const currentAddress = positionToAddress(currentPosition);
        currentPosition = previous[currentAddress];
        path.push(currentPosition);
    }
    return path.reverse();
}

function buildTable(maze, start, end) {
    const table = document.createElement('div');
    table.classList.add('table');
    table.setAttribute('id', 'table');
    for (let y = 0; y < height; y++) {
        const row = document.createElement('div');
        row.classList.add('row');
        for (let x = 0; x < width; x++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.setAttribute('id', `${y}-${x}`);
            if (isSamePosition([x, y], start)) {
                cell.classList.add('cell-start');
                cell.append(
                    document.createTextNode('S')
                );
            } else if (isSamePosition([x, y], end)) {
                cell.classList.add('cell-end');
                cell.append(
                    document.createTextNode('E')
                );
            } else if (maze[y][x] === 1) {
                cell.classList.add('cell-roadblock');
                cell.append(
                    document.createTextNode('X')
                );
            }
            row.append(cell);
        }
        table.append(row);
    }
    document.getElementById('table').replaceWith(table);
}
buildTable(mazeData, startPosition, endPosition);

const path = findPath();
for (let position of path) {
    const isFirst = isSamePosition(position, startPosition);
    const isLast = isSamePosition(position, endPosition);
    if (!isFirst && !isLast) {
        const cell = document.getElementById(`${position[1]}-${position[0]}`);
        cell.classList.add('cell-path');
    }
}
