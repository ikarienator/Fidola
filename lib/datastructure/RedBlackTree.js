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

    /**
     * @property {number} count Count of nodes of this subtree.
     */
    count: 1,

    data: null,

    /**
     * Get the left most node in the subtree.
     * @returns {RedBlackTreeNode}
     */
    leftMost: function () {
        var node = this;
        while (node.left) {
            node = node.left;
        }
        return node;
    },

    /**
     * Get the right most node in the subtree.
     * @returns {RedBlackTreeNode}
     */
    rightMost: function () {
        var node = this;
        while (node.right) {
            node = node.right;
        }
        return node;
    }
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

RedBlackTree.NODE_TYPE = RedBlackTreeNode;

RedBlackTree.prototype = {
    root: null,

    length: 0,

    /**
     * @returns {RedBlackTreeNode}
     */
    first: function () {
        return this.root && this.root.leftMost();
    },

    /**
     *
     * @returns {RedBlackTreeNode}
     */
    last: function () {
        return this.root && this.root.rightMost();
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    next: function (node) {
        if (node.right) {
            return node.right.leftMost();
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
            return node.left.rightMost();
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
        if (node) {
            if (node.right) {
                this.swap(node, node.right.leftMost());
            }
            this._nodeRemoveLeftMost(node);
            this.length--;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node1
     * @param {RedBlackTreeNode} node2
     */
    swap: function (node1, node2) {
        var nodes = [node1.left, node2.left, node1.right, node2.right, node1.parent, node2.parent],
            isLeft1 = node1.parent && node1.parent.left === node1,
            isLeft2 = node2.parent && node2.parent.left === node2,
            red1 = node1.red,
            count1 = node1.count;
        node1.red = node2.red;
        node2.red = red1;
        node1.count = node2.count;
        node2.count = count1;
        for (var i = 0; i < 6; i++) {
            if (nodes[i] === node1) {
                nodes[i] = node2;
            } else if (nodes[i] === node2) {
                nodes[i] = node1;
            }
        }
        node2.left = nodes[0];
        node1.left = nodes[1];
        node2.right = nodes[2];
        node1.right = nodes[3];
        node2.parent = nodes[4];
        node1.parent = nodes[5];
        if (nodes[0]) {
            nodes[0].parent = node2;
        }
        if (nodes[1]) {
            nodes[1].parent = node1;
        }
        if (nodes[2]) {
            nodes[2].parent = node2;
        }
        if (nodes[3]) {
            nodes[3].parent = node1;
        }
        if (nodes[4]) {
            if (isLeft1) {
                nodes[4].left = node2;
            } else {
                nodes[4].right = node2;
            }
        } else {
            this.root = node2;
        }
        if (nodes[5]) {
            if (isLeft2) {
                nodes[5].left = node1;
            } else {
                nodes[5].right = node1;
            }
        } else {
            this.root = node1;
        }
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
        target.count = node.count;
        node.count -= target.right ? target.right.count + 1 : 1;
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
        target.count = node.count;
        node.count -= target.left ? target.left.count + 1 : 1;
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
     * @returns {RedBlackTreeNode}
     */
    prepend: function (node) {
        return this.insertAfter(null, node)
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    append: function (node) {
        return this.insertBefore(null, node)
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertBefore: function (node, newNode) {
        if (this.length == 0) {
            this.root = newNode;
            this.length = 1;
            newNode.red = false;
            return newNode;
        } else if (!node) {
            return this.insertAfter(this.last(), newNode);
        } else if (!node.left) {
            node.left = newNode;
            newNode.parent = node;
            var parent = node;
            while (parent) {
                parent.count++;
                parent = parent.parent;
            }
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertAfter(node.left && node.left.rightMost(), newNode);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertAfter: function (node, newNode) {
        if (this.length == 0) {
            this.root = newNode;
            this.length = 1;
            newNode.red = false;
            return newNode;
        } else if (!node) {
            return this.insertBefore(this.first(), newNode);
        } else if (!node.right) {
            node.right = newNode;
            newNode.parent = node;
            var parent = node;
            while (parent) {
                parent.count++;
                parent = parent.parent;
            }
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertBefore(node.right && node.right.leftMost(), newNode);
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
                    node.count = p.count;
                    p.count -= node.right ? node.right.count + 1 : 1;
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
                    node.count = p.count;
                    p.count -= node.left ? node.left.count + 1 : 1;
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

        var parent = node.parent;
        while (parent) {
            parent.count--;
            parent = parent.parent;
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

exports.RedBlackTreeNode = RedBlackTreeNode;
exports.RedBlackTree = RedBlackTree;