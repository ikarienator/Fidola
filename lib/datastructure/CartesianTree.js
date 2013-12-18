/**
 * Cartesian tree is a valued binary tree generated from a sequence of objects
 * with there properties:
 * * It's a heap. i.e. value on parent node , if present, is not greater than its children's.
 * * Its in-order traversal recovers the original sequence.
 *
 * - Values in BST must be defined with an order; you can define customized order using "less test"
 *   which is similar to C++'s operator < .
 * - Like other heaps, creating a cartesian tree needs O(N) time where N is the number of elements.
 * - Searching for the minimum element in given range of indices is an O(log(N)) operation.
 * - You can add element to the end of the heap. This operation is O(N) worse case time and O(1) amortized time.
 * - Given two nodes in the tree, the minimum element between them in the original sequence is their
 *   lowest common ancestor.
 * - Cartesian tree is used in linear RMQ algorithm to convert general data in to ±1 data.
 *
 * More about Cartesian Tree, see: http://en.wikipedia.org/wiki/Cartesian_tree
 *
 * @param {Array} values The elements to initialize CartesianTree with.
 * @param {Function?} lessTest
 * @constructor
 */
function CartesianTree(values, lessTest) {
    if (typeof lessTest === 'undefined') {
        lessTest = function (a, b) {
            return a < b;
        }
    }

    this.lessTest = lessTest;
    this.array = [];
    this.parent = [];
    this.left = [];
    this.right = [];
    this.root = -1;

    if (typeof values === 'undefined') {
        return;
    }

    var length = values.length;
    if (length == 0) {
        return;
    }
    for (var i = 0; i < length; i++) {
        this.push(values[i]);
    }
}

var cartesianTree_prototype = CartesianTree.prototype;

/**
 * Insert value to the end of the tree.
 * @param {*} value
 */
cartesianTree_prototype.push = function (value) {
    var orderTest = this.lessTest;
    var len = this.array.length;
    if (len == 0) {
        this.array.push(value);
        this.parent.push(-1);
        this.left.push(-1);
        this.right.push(-1);
        this.root = 0;
        return;
    }
    var parent = len - 1;
    var last_parent = -1;
    while (parent != -1 && orderTest(value, this.array[parent])) {
        last_parent = parent;
        parent = this.parent[parent];
    }
    if (last_parent === -1) {
        this.parent.push(len - 1);
        this.right[len - 1] = len;
        this.left.push(-1);
    } else if (parent == -1) {
        this.parent[last_parent] = len;
        this.parent.push(-1);
        this.left.push(last_parent);
        this.root = len;
    } else {
        this.parent[last_parent] = len;
        this.parent.push(parent);
        this.right[parent] = len;
        this.left.push(last_parent);
    }
    this.right.push(-1);
    this.array.push(value);
};

/**
 * Get the minimum value in [from, to).
 * @param {Number} from
 * @param {Number} to
 */
cartesianTree_prototype.rangeMinimum = function (from, to) {
    if (this.array.length == 0) {
        return null;
    }
    if (from < 0 || to <= from || from >= this.array.length || to > this.array.length) {
        return null;
    }
    return this._rangeMinimum(this.root, from, to);
};

cartesianTree_prototype._rangeMinimum = function (root, from, to) {
    if (root < from) {
        return this._rangeMinimum(this.right[root], from, to);
    } else if (root >= to) {
        return this._rangeMinimum(this.left[root], from, to);
    } else {
        return this.array[root];
    }
};

/**
 * Get the size of the tree.
 * @returns {Number}
 */
cartesianTree_prototype.size = function () {
    return this.array.length;
};

exports.CartesianTree = CartesianTree;
