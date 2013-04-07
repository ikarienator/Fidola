/**
 * @class
 * @constructor
 * @property {*} data
 * @param {*} data
 */
function RedBlackTreeNode(data) {
    this.data = data;
}

RedBlackTreeNode.prototype = {
    /**
     * @property {RedBlackTreeNode} parent
     */
    parent: null,

    /**
     * @property {RedBlackTreeNode} left
     */
    left: null,

    /**
     * @property {RedBlackTreeNode} right
     */
    right: null,

    /**
     * @property {boolean} red
     */
    red: true,
    data: null
};

/**
 * @class
 * @property {RedBlackTreeNode} root
 * @property {Number} length
 * @constructor
 */
function RedBlackTree() {
    this.root = null;
}

RedBlackTree.prototype = {
    root: null,

    length: 0,

    /**
     *
     * @param {RedBlackTreeNode} newNode
     * @param {RedBlackTreeNode} oldNode
     */
    beforeNodeSwap: function (newNode, oldNode) {
    },

    /**
     * @returns {RedBlackTreeNode}
     */
    first: function () {
        return this._nodeLeftMost(this.root);
    },

    /**
     *
     * @returns {RedBlackTreeNode}
     */
    last: function () {
        return this._nodeRightMost(this.root);
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    next: function (node) {
        if (node.right) {
            return this._nodeLeftMost(node.right);
        } else if (node.parent) {
            var curr = node;
            while (curr.parent && curr.parent.left !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            // Root is right most
            return null;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    prev: function (node) {
        if (node.left) {
            return this._nodeRightMost(node.left);
        } else if (node.parent) {
            var curr = node;
            while (curr.parent && curr.parent.right !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            // Root is left most
            return null;
        }
    },

    /**
     *
     * @param {Function} fn Function accepts node.data and node.
     * @param {*} [arg] Overrides this
     */
    iterate: function (fn, arg) {
        if (this.root) {
            this._nodeIterate(this.root, fn, arg);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     */
    removeNode: function (node) {
        var minNode;
        if (node) {
            if (node.right) {
                minNode = this._nodeLeftMost(node.right);
                this.swap(node, minNode);
                this._nodeRemoveLeftMost(minNode);
            } else {
                this._nodeRemoveLeftMost(node);
            }
            this.length--;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node1
     * @param {RedBlackTreeNode} node2
     */
    swap: function (node1, node2) {
        var data1 = node1.data, data2 = node2.data;
        this.beforeNodeSwap(node1, node2);
        node1.data = data2;
        node2.data = data1;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeLeftMost: function (node) {
        while (node && node.left) {
            node = node.left;
        }
        return node;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeRightMost: function (node) {
        while (node && node.right) {
            node = node.right;
        }
        return node;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {boolean}
     * @private
     */
    _nodeIsRed: function (node) {
        return !!(node && node.red);
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {*}
     * @private
     */
    _nodeSibling: function (node) {
        if (node && node.parent) {
            return node == node.parent.left ? node.parent.right : node.parent.left;
        } else {
            return null;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeColorFlip: function (node) {
        node.red = !node.red;
        node.left.red = !node.left.red;
        node.right.red = !node.right.red;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRotateLeft: function (node) {
        /**
         *
         * @type {null|RedBlackTreeNode}
         */
        var target = node.right;
        target.parent = node.parent;
        if (node.parent) {
            if (node.parent.left == node) {
                node.parent.left = target;
            } else {
                node.parent.right = target;
            }
        } else {
            this.root = target;
        }
        node.right = target.left;
        if (node.right) {
            node.right.parent = node;
        }
        target.left = node;
        node.parent = target;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRotateRight: function (node) {
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var target = node.left;
        target.parent = node.parent;
        if (node.parent) {
            if (node.parent.right === node) {
                node.parent.right = target;
            } else {
                node.parent.left = target;
            }
        } else {
            this.root = target;
        }
        node.left = target.right;
        if (node.left) {
            node.left.parent = node;
        }
        target.right = node;
        node.parent = target;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertBefore: function (node, newNode) {
        if (!node.left) {
            node.left = newNode;
            newNode.parent = node;
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertAfter(this._nodeRightMost(node.left), newNode);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertAfter: function (node, newNode) {

        if (!node.right) {
            node.right = newNode;
            newNode.parent = node;
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertBefore(this._nodeLeftMost(node.right), newNode);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeInsertFixUp: function (node) {
        // Case 1
        // assert node.red
        if (!node.parent) {
            node.red = false;
        } else if (node.parent.red) {
            // Case 2
            // Always has a grand parent
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var p = node.parent;
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var g = p.parent;
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var u = g.left === p ? g.right : g.left;
            if (this._nodeIsRed(u)) {
                // Case 3
                this._nodeColorFlip(g);
                return this._nodeInsertFixUp(g);
            } else {
                // Case 4
                if (node === p.right && p === g.left) {
                    g.left = node;
                    node.parent = g;
                    if ((p.right = node.left)) {
                        p.right.parent = p;
                    }
                    node.left = p;
                    p.parent = node;
                    p = node;
                    node = node.left;
                } else if (node === p.left && p === g.right) {
                    g.right = node;
                    node.parent = g;
                    if ((p.left = node.right)) {
                        p.left.parent = p;
                    }
                    node.right = p;
                    p.parent = node;
                    p = node;
                    node = node.right;
                }
                // Case 5
                p.red = false;
                g.red = true;
                if (node == p.left) {
                    this._nodeRotateRight(g);
                } else {
                    this._nodeRotateLeft(g);
                }
            }
        }
        return node;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} parent
     * @param {RedBlackTreeNode} sibling
     * @private
     */
    _nodeRemoveFixUp: function (node, parent, sibling) {
        if (parent !== null) {
            // Case 2
            // sibling's black rank is 1 more than node's.
            // Always have a parent
            // Always have a sibling
            // Not always have the node.
            if (this._nodeIsRed(sibling)) {
                parent.red = true;
                sibling.red = false;
                if (node === parent.left) {
                    this._nodeRotateLeft(parent);
                    sibling = parent.right;
                } else {
                    this._nodeRotateRight(parent);
                    sibling = parent.left;
                }
            }

            // Now sibling is black
            if (!this._nodeIsRed(sibling.left) && !this._nodeIsRed(sibling.right)) {
                sibling.red = true;
                if (!this._nodeIsRed(parent)) {
                    // Case 3
                    this._nodeRemoveFixUp(parent, parent.parent, this._nodeSibling(parent));
                } else {
                    // Case 4
                    parent.red = false;
                }
            } else {
                // Case 5
                if (node === parent.left && !this._nodeIsRed(sibling.right) && this._nodeIsRed(sibling.left)) {
                    sibling.red = true;
                    sibling.left.red = false;
                    this._nodeRotateRight(sibling);
                    sibling = sibling.parent;
                } else if (node === parent.right && !this._nodeIsRed(sibling.left) && this._nodeIsRed(sibling.right)) {
                    sibling.red = true;
                    sibling.right.red = false;
                    this._nodeRotateLeft(sibling);
                    sibling = sibling.parent;
                }

                // Case 6
                // Now sibling's far child is red.
                // node, sibling, sibling's near child are black.
                sibling.red = parent.red;
                parent.red = false;
                if (node === parent.left) {
                    this._nodeRotateLeft(parent);
                    sibling.right.red = false;
                } else {
                    this._nodeRotateRight(parent);
                    sibling.left.red = false;
                }
            }
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {Function} fn
     * @param arg
     * @private
     */
    _nodeIterate: function (node, fn, arg) {
        if (node.left) {
            this._nodeIterate(node.left, fn, arg);
        }
        fn.call(arg || this, node.data, node);
        if (node.right) {
            this._nodeIterate(node.right, fn, arg);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRemoveLeftMost: function (node) {
        // Note: child is nullable.
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var child = node.left || node.right;
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var sibling = this._nodeSibling(node);
        if (child) {
            child.parent = node.parent;
        }
        if (node.parent) {
            if (node.parent.left === node) {
                node.parent.left = child;
            } else {
                node.parent.right = child;
            }
        } else {
            this.root = child;
        }

        if (!node.red) {
            if (this._nodeIsRed(child)) {
                child.red = false;
            } else {
                this._nodeRemoveFixUp(child, node.parent, sibling);
            }
        }
        node.left = node.right = node.parent = null;
        node.red = false;
    }
};

/**
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
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
BinarySearchTree_prototype.lessTest = function (a, b) {
    return a < b;
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
 */
BinarySearchTree_prototype.search = function (data) {
    return this._nodeSearch(this.root, data);
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
 */
BinarySearchTree_prototype.searchMaxSmallerThan = function (data) {
    return this._nodeSearchMaxSmallerThan(this.root, data);
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
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
 *
 * @param data
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
 * @param data
 * @param lessTest
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
 *
 * @param data
 */
BinarySearchTree_prototype.remove = function (data) {
    if (this.length) {
        this.removeNode(this.search(data));
    }
};

exports.BinarySearchTree = BinarySearchTree;
exports.RedBlackTree = RedBlackTree;