/**
 * This class provides a classic binary heap implementation.
 *
 * A binary heap is a complete binary tree that each node contains a value that is not greater than
 * that of its parent node, if present.
 *
 * - Binary heap can be constructed in O(N) time, in the sense that N is the number of elements.
 * - You can insert/delete a value to the binary heap in O(log(N)) time.
 * - You can query the minimum value of the binary heap in O(1) time.
 * - Binary heap requires O(N) space complexity.
 *
 * More about binary heap, see: http://en.wikipedia.org/wiki/Binary_heap
 *
 * @param {Array} values List of values to be used on O(n) initialization of the heap.
 * @param {Function?} orderTest The custom order test. Similar to C++'s operator < .
 * @constructor
 */
function BinaryHeap(values, orderTest) {
    if (typeof orderTest === 'undefined') {
        orderTest = function (a, b) {
            return a < b;
        }
    }
    this._lessTest = orderTest;

    if (typeof values !== 'undefined') {
        this._arr = values.slice(0);
        var arr = this._arr, i, ln = arr.length, parent;
        for (i = ln - 1; i >= 0; i--) {
            this._down(i);
        }
    } else {
        this._arr = [];
    }
}

var binaryHeap_prototype = BinaryHeap.prototype;

/**
 * Pull element up to the right place.
 * @param {Number} k Index of the number.
 * @private
 */
binaryHeap_prototype._up = function (k) {
    var arr = this._arr,
        value = arr[k],
        orderTest = this._lessTest,
        parent;
    do {
        parent = (k - 1) >> 1;
        if (orderTest(value, arr[parent])) {
            arr[k] = arr[parent];
            k = parent;
        } else {
            break;
        }
    } while (k > 0);
    arr[k] = value;
};

/**
 * Push element down to the right place.
 * @param {Number} k Index of the number.
 * @private
 */
binaryHeap_prototype._down = function (k) {
    var arr = this._arr,
        orderTest = this._lessTest,
        value = arr[k],
        left, right,
        ln = arr.length;
    do {
        left = k * 2 + 1;
        right = k * 2 + 2;
        if (right >= ln) {
            // No right child
            if (left < ln) {
                if (orderTest(arr[left], value)) {
                    arr[k] = arr[left];
                    k = left;
                }
            }
            break;
        } else {
            if (orderTest(arr[left], arr[right])) {
                if (orderTest(arr[left], value)) {
                    arr[k] = arr[left];
                    k = left;
                } else {
                    // k is in the right place
                    break;
                }
            } else if (orderTest(arr[right], value)) {
                arr[k] = arr[right];
                k = right;
            } else {
                // k is in the right place
                break;
            }
        }
    } while (true);
    arr[k] = value;
};

/**
 * Insert element into binary heap.
 * @param {*} el
 */
binaryHeap_prototype.push = function (el) {
    var arr = this._arr;
    if (arguments.length > 1) {
        for (var i = 0; i < arguments.length; i++) {
            arr.push(arguments[i]);
            this._up(arr.length - 1);
        }
    } else if (arr.length === 0) {
        arr.push(el);
    } else {
        arr.push(el);
        this._up(arr.length - 1);
    }
};

/**
 * Query the minimum element of the binary heap.
 * @returns {*} The minimum element of the binary heap.
 */
binaryHeap_prototype.peek = function () {
    return this._arr[0];
};

/**
 * Query the minimum element of the binary heap and remove it.
 * @returns {*} The minimum element of the binary heap.
 */
binaryHeap_prototype.pop = function () {
    var arr = this._arr,
        value = arr[0];
    if (arr.length > 1) {
        arr[0] = arr[arr.length - 1];
        arr.length--;
        this._down(0);
    } else {
        arr.length = 0;
    }
    return value;
};

/**
 * Remove an element from binary heap.
 * @param data
 * @returns {boolean} Indicates whether this operation succeeded or not.
 */
binaryHeap_prototype.remove = function (data) {
    var arr = this._arr,
        i = -1, ln = arr.length - 1;
    if (ln === -1) {
        return false;
    } else if (arr[ln] === data) {
        arr.length--;
        return true;
    } else {
        while (i++ < ln) {
            if (arr[i] === data) {
                arr[i] = arr[ln];
                arr.length--;
                this._down(i);
                return true;
            }
        }
    }
    return false;
};

/**
 * Get the size of the binary heap.
 * @returns {Number}
 */
binaryHeap_prototype.size = function () {
    return this._arr.length;
};

exports.BinaryHeap = BinaryHeap;
