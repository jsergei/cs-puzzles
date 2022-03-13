const inf = Number.POSITIVE_INFINITY;

const numOfCitiesA = 5;
const distancesA = [
    [inf, 3, 4, 5, 6],
    [7, inf, 6, 5, 4],
    [3, 2, inf, 1, 2],
    [3, 4, 5, inf, 6],
    [7, 6, 5, 4, inf]
];
// results: path: 1 -> 2 -> 5 -> 3 -> 4 -> 1, distance: 16

const numOfCitiesB = 4;
const distancesB = [
  [inf, 3, 1, 2],
  [5, inf, 7, 1],
  [8, 4, inf, 9],
  [10, 3, 5, inf]
];
// results: path-1: 1 -> 3 -> 2 -> 4 -> 1, distance: 16
// path-2: 1 -> 4 -> 3 -> 2 -> 1, distance: 16

const numOfCitiesC = 10;
const distancesC = [
    [inf, 1, 3, 3, 3, 3, 3, 3, 3, 3],
    [3, inf, 1, 3, 3, 3, 3, 3, 3, 3],
    [3, 3, inf, 1, 3, 3, 3, 3, 3, 3],
    [3, 3, 3, inf, 1, 3, 3, 3, 3, 3],
    [3, 3, 3, 3, inf, 1, 3, 3, 3, 3],
    [3, 3, 3, 3, 3, inf, 1, 3, 3, 3],
    [3, 3, 3, 3, 3, 3, inf, 1, 3, 3],
    [3, 3, 3, 3, 3, 3, 3, inf, 1, 3],
    [3, 3, 3, 3, 3, 3, 3, 3, inf, 1],
    [1, 3, 3, 3, 3, 3, 3, 3, 3, inf]
];
// results: path-1: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 1, distance: 10

function generateSubsets(from, maxNode, remainingSize, path, subsets) {
    for (let x = from; x <= maxNode - remainingSize + 1; x++) {
        path.push(x);
        if (remainingSize <= 1) {
            subsets.push([...path]);
        } else {
            generateSubsets(x + 1, maxNode, remainingSize - 1, path, subsets);
        }
        path.pop();
    }
}

function getAllSubsets(subsetSize, maxNode) {
    const subsets = [];
    generateSubsets(2, maxNode, subsetSize, [], subsets);
    return subsets;
}

function encodeSet(set, lastCity) {
    return (set.length ? set.toString() : '0') + '-' + lastCity;
}

function getDistance(distances, row, column) {
    return distances[row - 1][column - 1];
}

function findShortestPath(distances, numOfCities) {
    const cache = new Map();

    for (let k = 2; k <= numOfCities; k++) {
        cache.set(encodeSet([], k), {distance: getDistance(distances, 1, k), city: 1}); // technically city: 1 should be empty
    }

    for (let k = 1; k < numOfCities; k++) {
        for (let subset of getAllSubsets(k, numOfCities)) {
            const startCity = k + 1 === numOfCities ? 1 : 2;
            for (let remainingCity = startCity; remainingCity <= numOfCities; remainingCity++) {
                if (subset.includes(remainingCity)) {
                    continue;
                }
                let shortestToRemainingCity = {distance: inf, city: 2};
                for (let subsetCity of subset) {
                    const prevSubset = subset.filter(s => s !== subsetCity);
                    const shortestToSubsetCity = cache.get(encodeSet(prevSubset, subsetCity));
                    const distanceToRemainingCity =
                        shortestToSubsetCity.distance + getDistance(distances, subsetCity, remainingCity);
                    if (shortestToRemainingCity.distance > distanceToRemainingCity) {
                        shortestToRemainingCity.distance = distanceToRemainingCity;
                        shortestToRemainingCity.city = subsetCity;
                    }
                }
                cache.set(encodeSet(subset, remainingCity), shortestToRemainingCity);
            }
        }
    }

    // Unwind from the all-inclusive set to the set of 1 to reconstruct the shortest path
    let cities = [];
    for (let x = 2; x <= numOfCities; x++) {
        cities.push(x);
    }
    const shortestDistance = cache.get(encodeSet(cities, 1)).distance;
    let prevCity = 1;
    const shortestPath = [1];
    while (cities.length > 0) {
        prevCity = cache.get(encodeSet(cities, prevCity)).city
        shortestPath.unshift(prevCity);
        cities = cities.filter(s => s !== prevCity);
    }
    shortestPath.unshift(1);

    return  {
        distance: shortestDistance,
        path: shortestPath
    };
}



const result = findShortestPath(distancesC, numOfCitiesC);
console.log('distance: ' + result.distance);
console.log('path: ' + result.path);
