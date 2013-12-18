var fidola = require('../fidola'),
    RedBlackTree = fidola.ds.RedBlackTree,
    RedBlackTreeNode = RedBlackTree.NODE_TYPE;

/**
 * A compare based binary search tree (BST) data structure built on red black tree.
 *
 * - A BST is an ordered container. Values in BST must be defined with an order; you can define
 *   customized order using "less test" which is similar to C++'s operator < .
 *   Note: The elements must form a [strict partial order set](http://en.wikipedia.org/wiki/Partially_ordered_set#Strict_and_non-strict_partial_orders).
 * - You can insert/delete element in O(log(N)) time, in the sense that N is the number
 *   of elements in the BST.
 * - You can search the bound node of a given element in O(log(N)) time.
 * - You can find the maximum/minimum element less/greater than a given value in O(log(N)) time.
 * - BST requires O(N) space complexity. But the overhead is rather high. Consider
 *   using sorted array if performance is not an issue.
 *
 * More about BST, see: http://en.wikipedia.org/wiki/Binary_search_tree
 * @class
 * @extends RedBlackTree
 * @param {Function} lessTest
 * @constructor
 */
var BinarySearchTree = function (lessTest) {
    if (lessTest) {
        this.lessTest = lessTest;
    }
};

var BinarySearchTree_prototype = BinarySearchTree.prototype = new RedBlackTree();

/**
 * Default less test of BST.
 * Less test defines the order of values
 * @param a
 * @param b
 * @returns {boolean}
 */
BinarySearchTree_prototype.lessTest = function (a, b) {
    return a < b;
};

/**
 * Find value in tree and returns bound node.
 *
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of data, or null if search failed.
 */
BinarySearchTree_prototype.search = function (data) {
    return this._nodeSearch(this.root, data);
};

/**
 * Find node with maximum value strictly below <code>data</code>.
 *
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of maximum value below <code>data</code>.,
 * or null if there is no value in the tree less than <code>data</code>..
 */
BinarySearchTree_prototype.searchMaxSmallerThan = function (data) {
    return this._nodeSearchMaxSmallerThan(this.root, data);
};

/**
 * Find node with minimum value strictly above <code>data</code>.
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of minimum value above <code>data</code>.,
 * or null if there is no value in the tree greater than <code>data</code>..
 */
BinarySearchTree_prototype.searchMinGreaterThan = function (data) {
    return this._nodeSearchMinGreaterThan(this.root, data);
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearch = function (node, data) {
    var test = this.lessTest;
    while (node && node.data !== data) {
        if (test(data, node.data)) {
            node = node.left;
        } else {
            node = node.right;
        }
    }
    return node;
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearchMaxSmallerThan = function (node, data) {
    var test = this.lessTest,
        last = null;
    while (node) {
        if (test(node.data, data)) {
            last = node;
            node = node.right;
        } else {
            node = node.left;
        }
    }
    return last;
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearchMinGreaterThan = function (node, data) {
    var test = this.lessTest,
        last = null;
    while (node) {
        if (test(data, node.data)) {
            last = node;
            node = node.left;
        } else {
            node = node.right;
        }
    }
    return last;
};

/**
 * Insert data into BST.
 * @param {*} data Value to insert.
 * @return {RedBlackTreeNode}
 */
BinarySearchTree_prototype.insert = function (data) {
    if (this.length === 0) {
        this.length++;
        this.root = new RedBlackTreeNode(data);
        this.root.red = false;
        return this.root;
    } else {
        this.length++;
        return this._nodeInsert(this.root, data, this.lessTest);
    }
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param {*} data
 * @param {Function} lessTest
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeInsert = function (node, data, lessTest) {
    if (lessTest(data, node.data)) {
        if (!node.left) {
            return this.insertBefore(node, new RedBlackTreeNode(data));
        } else {
            return this._nodeInsert(node.left, data, lessTest);
        }
    } else {
        if (!node.right) {
            return this.insertAfter(node, new RedBlackTreeNode(data));
        } else {
            return this._nodeInsert(node.right, data, lessTest);
        }
    }
};

/**
 * Remove element from BST if it exists.
 * @param {*} data
 */
BinarySearchTree_prototype.remove = function (data) {
    if (this.length) {
        this.removeNode(this.search(data));
    }
};

exports.BinarySearchTree = BinarySearchTree;
