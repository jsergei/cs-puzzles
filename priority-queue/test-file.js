import {shortestPath} from "./dijkstra.js";


// const queue = new MinPriorityQueue();
// queue.add(10, 'Michael');
// queue.add(8, 'Rosy');
// queue.add(5, 'Helga');
// queue.add(7, 'Josh');
// queue.add(3, 'Karly');
// queue.add(2, 'James');
// queue.add(30, 'Bill');
// queue.add(19, 'Melinda');
// queue.add(15, 'Josh');
// queue.add(2, 'Kyle');
// queue.add(1, 'Sergei');
// queue.add(18, 'Octavia');
// queue.add(15, 'Kate');
//
//
// queue.print();
//
// const top = queue.poll();
// console.log('Top: ' + top.key + ', ' + top.value);
//
// queue.print();


const graphNodes = ['a', 'b', 'd', 'e', 'c', 'f', 'k', 'l', 'i', 'g', 'h'];
const graphData = new Map([
    ['a', [{node: 'b', weight: 1}, {node: 'd', weight: 2}]],
    ['b', [{node: 'c', weight: 10}]],
    ['d', [{node: 'e', weight: 3}]],
    ['e', [{node: 'c', weight: 4}]],
    ['c', [{node: 'f', weight: 5}]],
    ['f', [{node: 'k', weight: 3}, {node: 'i', weight: 4}, {node: 'g', weight: 2}]],
    ['k', [{node: 'l', weight: 1}]],
    ['g', [{node: 'h', weight: 11}]],
    ['l', [{node: 'h', weight: 8}]],
    ['i', [{node: 'h', weight: 2}]]
]);
const paths = shortestPath(graphData, graphNodes, 'a');

for (let node of paths) {
    console.log(node[0] + ': ' + node[1].value + (node[1].prev ? ', from ' + node[1].prev : ''));
}
