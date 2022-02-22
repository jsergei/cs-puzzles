export class MinPriorityQueue {
    constructor() {
        this._storage = [];
    }

    add(value, data) {
        this._storage.push({value, data});
        this._bubbleUp(this._storage.length - 1);
    }

    peek() {
        return this._storage[0] || null;
    }

    poll() {
        if (this._storage.length === 0) {
            throw new Error('The queue is empty');
        } else if (this._storage.length === 1) {
            return this._storage.pop();
        } else {
            const top = this._storage[0];
            this._storage[0] = this._storage.pop();
            this._bubbleDown(0);
            return top;
        }
    }

    print(index = 0, indent = 0) {
        if (index < this._storage.length) {
            console.log(' '.repeat(3 * indent) + this._storage[index].value + ', ' + this._storage[index].data);
            this.print(2 * index + 1, indent + 1);
            this.print(2 * index + 2, indent + 1);
        }
    }

    isEmpty() {
        return this._storage.length === 0;
    }

    // PRIVATE

    _bubbleUp(index) {
        if (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this._storage[index].value < this._storage[parentIndex].value) {
                const copy = this._storage[parentIndex];
                this._storage[parentIndex] = this._storage[index];
                this._storage[index] = copy;
                this._bubbleUp(parentIndex);
            }
        }
    }

    _bubbleDown(index) {
        if (index >= this._storage.length) {
            return;
        }
        const leftIndex = 2 * index + 1;
        const rightIndex = 2 * index + 2;
        let childIndex;
        if (leftIndex < this._storage.length && rightIndex < this._storage.length) {
            childIndex = this._storage[leftIndex].value < this._storage[rightIndex].value ? leftIndex : rightIndex;
        } else if (leftIndex < this._storage.length) {
            childIndex = leftIndex;
        } else if (rightIndex < this._storage.length) {
            childIndex = rightIndex;
        } else {
            return;
        }

        if (this._storage[childIndex].value < this._storage[index].value) {
            const parentCopy = this._storage[index];
            this._storage[index] = this._storage[childIndex];
            this._storage[childIndex] = parentCopy;
            this._bubbleDown(childIndex);
        }
    }
}
