function RedBlackTree(lessTest) {
    if (lessTest) {
        this.lessTest = lessTest;
    }
}

function RedBlackTreeNode(data) {
    this.data = data;
}

RedBlackTreeNode.prototype = {
    parent: null,
    red: true,
    left: null,
    right: null,
    data: null
};

RedBlackTree.prototype = {
    lessTest: function (a, b) {
        return a < b;
    },

    root: null,

    length: 0,

    beforeNodeSwap: function (newNode, oldNode) {
    },

    /**
     *
     * @param {*} data
     * @return {RedBlackTreeNode} node
     */
    search: function (data) {
        return this._nodeSearch(this.root, data);
    },

    searchMaxSmallerThan: function (data) {
        return this._nodeSearchMaxSmallerThan(this.root, data);
    },

    searchMinGreaterThan: function (data) {
        return this._nodeSearchMinGreaterThan(this.root, data);
    },

    /**
     *
     * @param data
     */
    insert: function (data) {
        if (this.length === 0) {
            this.length++;
            this.root = new RedBlackTreeNode(data);
            this.root.red = false;
            return this.root;
        } else {
            this.length++;
            return this._nodeInsert(this.root, data, this.lessTest);
        }

    },

    first: function () {
        return this._nodeLeftMost(this.root);
    },

    last: function () {
        return this._nodeRightMost(this.root);
    },


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
     * @param data
     */
    remove: function (data) {
        if (this.length) {
            this.removeNode(this.search(data));
        }
    },

    removeNode: function (node) {
        var minNode;
        if (node) {
            if (node.right) {
                minNode = this._nodeLeftMost(node.right);
                this.swap(node, minNode);
                this._nodeRemoveMin(minNode);
            } else {
                this._nodeRemoveMin(node);
            }
            this.length--;
        }
    },

    swap: function (node1, node2) {
        var data1 = node1.data, data2 = node2.data;
        this.beforeNodeSwap(node1, node2);
        node1.data = data2;
        node2.data = data1;
    },

    _nodeLeftMost: function (node) {
        while (node && node.left) {
            node = node.left;
        }
        return node;
    },

    _nodeRightMost: function (node) {
        while (node && node.right) {
            node = node.right;
        }
        return node;
    },

    _nodeIsRed: function (node) {
        return node && node.red;
    },

    _nodeSibling: function (node) {
        if (node && node.parent) {
            return node == node.parent.left ? node.parent.right : node.parent.left;
        } else {
            return null;
        }
    },

    _nodeColorFlip: function (node) {
        node.red = !node.red;
        node.left.red = !node.left.red;
        node.right.red = !node.right.red;
    },

    _nodeRotateLeft: function (node) {
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

    _nodeRotateRight: function (node) {
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

    _nodeSearch: function (node, data) {
        var test = this.lessTest;
        while (node && node.data !== data) {
            if (test(data, node.data)) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return node;
    },

    _nodeSearchMaxSmallerThan: function (node, data) {
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
    },

    _nodeSearchMinGreaterThan: function (node, data) {
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
    },

    _nodeInsertFixUp: function (node) {
        // Case 1
        // assert node.red
        if (!node.parent) {
            node.red = false;
        } else if (node.parent.red) {
            // Case 2
            // Always has a grand parent
            var p = node.parent,
                g = p.parent,
                u = g.left === p ? g.right : g.left;
            if (this._nodeIsRed(u)) {
                // Case 3
                this._nodeColorFlip(g);
                this._nodeInsertFixUp(g);
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

    _nodeInsert: function (node, data, lessTest) {
        var result;
        // assert node !== null
        if (lessTest(data, node.data)) {
            if (!node.left) {
                result = node.left = new RedBlackTreeNode(data);
                node.left.parent = node;
                this._nodeInsertFixUp(node.left);
                return result;
            } else {
                return this._nodeInsert(node.left, data, lessTest);
            }
        } else {
            if (!node.right) {
                result = node.right = new RedBlackTreeNode(data);
                node.right.parent = node;
                this._nodeInsertFixUp(node.right);
                return result;
            } else {
                return this._nodeInsert(node.right, data, lessTest);
            }
        }
    },

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

    _nodeIterate: function (node, fn, arg) {
        if (node.left) {
            this._nodeIterate(node.left, fn, arg);
        }
        fn.call(arg || this, node.data, node);
        if (node.right) {
            this._nodeIterate(node.right, fn, arg);
        }
    },

    _nodeRemoveMin: function (node) {
        // Note: child is nullable.
        var child = node.left || node.right,
            sibling = this._nodeSibling(node);
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
fast.ds.RedBlackTree = RedBlackTree;