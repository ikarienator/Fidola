var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var RedBlackTreeNode = (function () {
    function RedBlackTreeNode(data) {
        this.data = data;
        this.red = true;
        this.parent = null;
        this.left = null;
        this.right = null;
    }
    return RedBlackTreeNode;
})();
exports.RedBlackTreeNode = RedBlackTreeNode;
var RedBlackTree = (function () {
    function RedBlackTree() {
        this.root = null;
        this.length = 0;
        this.beforeNodeSwap = function (a, b) {
            return undefined;
        };
    }
    RedBlackTree.prototype.first = function () {
        return this.nodeLeftMost(this.root);
    };
    RedBlackTree.prototype.last = function () {
        return this.nodeRightMost(this.root);
    };
    RedBlackTree.prototype.insertBefore = function (node, refNode) {
        if(this.length == 0) {
            this.length = 1;
            this.root = node;
            this.root.red = false;
            return node;
        } else if(!refNode) {
            return this.insertAfter(node, this.nodeRightMost(this.root));
        } else if(!refNode.left) {
            this.length++;
            refNode.left = node;
            refNode.left.parent = refNode;
            this.nodeInsertFixUp(refNode.left);
            return node;
        } else {
            return this.insertAfter(node, this.nodeRightMost(node.left));
        }
    };
    RedBlackTree.prototype.insertAfter = function (node, refNode) {
        if(this.length == 0) {
            this.length = 1;
            this.root = node;
            this.root.red = false;
        } else if(!refNode) {
            return this.insertBefore(node, this.nodeLeftMost(this.root));
        } else if(!refNode.right) {
            this.length++;
            refNode.right = node;
            refNode.right.parent = refNode;
            this.nodeInsertFixUp(refNode.right);
            return node;
        } else {
            return this.insertBefore(node, this.nodeLeftMost(node.right));
        }
    };
    RedBlackTree.prototype.next = function (node) {
        if(node.right) {
            return this.nodeLeftMost(node.right);
        } else if(node.parent) {
            var curr = node;
            while(curr.parent && curr.parent.left !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            return null;
        }
    };
    RedBlackTree.prototype.prev = function (node) {
        if(node.left) {
            return this.nodeRightMost(node.left);
        } else if(node.parent) {
            var curr = node;
            while(curr.parent && curr.parent.right !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            return null;
        }
    };
    RedBlackTree.prototype.iterate = function (fn, thisObject) {
        if(this.root) {
            this.nodeIterate(this.root, fn, thisObject);
        }
    };
    RedBlackTree.prototype.removeNode = function (node) {
        var minNode;
        if(node) {
            if(node.right) {
                minNode = this.nodeLeftMost(node.right);
                this.swap(node, minNode);
                this.nodeRemoveMin(minNode);
            } else {
                this.nodeRemoveMin(node);
            }
            this.length--;
        }
    };
    RedBlackTree.prototype.swap = function (node1, node2) {
        var data1 = node1.data, data2 = node2.data;
        this.beforeNodeSwap(node1, node2);
        node1.data = data2;
        node2.data = data1;
    };
    RedBlackTree.prototype.nodeLeftMost = function (node) {
        while(node && node.left) {
            node = node.left;
        }
        return node;
    };
    RedBlackTree.prototype.nodeRightMost = function (node) {
        while(node && node.right) {
            node = node.right;
        }
        return node;
    };
    RedBlackTree.prototype.nodeIsRed = function (node) {
        return node && node.red;
    };
    RedBlackTree.prototype.nodeSibling = function (node) {
        if(node && node.parent) {
            return node == node.parent.left ? node.parent.right : node.parent.left;
        } else {
            return null;
        }
    };
    RedBlackTree.prototype.nodeColorFlip = function (node) {
        node.red = !node.red;
        node.left.red = !node.left.red;
        node.right.red = !node.right.red;
    };
    RedBlackTree.prototype.nodeRotateLeft = function (node) {
        var target = node.right;
        target.parent = node.parent;
        if(node.parent) {
            if(node.parent.left == node) {
                node.parent.left = target;
            } else {
                node.parent.right = target;
            }
        } else {
            this.root = target;
        }
        node.right = target.left;
        if(node.right) {
            node.right.parent = node;
        }
        target.left = node;
        node.parent = target;
    };
    RedBlackTree.prototype.nodeRotateRight = function (node) {
        var target = node.left;
        target.parent = node.parent;
        if(node.parent) {
            if(node.parent.right === node) {
                node.parent.right = target;
            } else {
                node.parent.left = target;
            }
        } else {
            this.root = target;
        }
        node.left = target.right;
        if(node.left) {
            node.left.parent = node;
        }
        target.right = node;
        node.parent = target;
    };
    RedBlackTree.prototype.nodeInsertFixUp = function (node) {
        if(!node.parent) {
            node.red = false;
        } else if(node.parent.red) {
            var p = node.parent, g = p.parent, u = g.left === p ? g.right : g.left;
            if(this.nodeIsRed(u)) {
                this.nodeColorFlip(g);
                this.nodeInsertFixUp(g);
            } else {
                if(node === p.right && p === g.left) {
                    g.left = node;
                    node.parent = g;
                    if((p.right = node.left)) {
                        p.right.parent = p;
                    }
                    node.left = p;
                    p.parent = node;
                    p = node;
                    node = node.left;
                } else if(node === p.left && p === g.right) {
                    g.right = node;
                    node.parent = g;
                    if((p.left = node.right)) {
                        p.left.parent = p;
                    }
                    node.right = p;
                    p.parent = node;
                    p = node;
                    node = node.right;
                }
                p.red = false;
                g.red = true;
                if(node == p.left) {
                    this.nodeRotateRight(g);
                } else {
                    this.nodeRotateLeft(g);
                }
            }
        }
        return node;
    };
    RedBlackTree.prototype.nodeRemoveFixUp = function (node, parent, sibling) {
        if(parent !== null) {
            if(this.nodeIsRed(sibling)) {
                parent.red = true;
                sibling.red = false;
                if(node === parent.left) {
                    this.nodeRotateLeft(parent);
                    sibling = parent.right;
                } else {
                    this.nodeRotateRight(parent);
                    sibling = parent.left;
                }
            }
            if(!this.nodeIsRed(sibling.left) && !this.nodeIsRed(sibling.right)) {
                sibling.red = true;
                if(!this.nodeIsRed(parent)) {
                    this.nodeRemoveFixUp(parent, parent.parent, this.nodeSibling(parent));
                } else {
                    parent.red = false;
                }
            } else {
                if(node === parent.left && !this.nodeIsRed(sibling.right) && this.nodeIsRed(sibling.left)) {
                    sibling.red = true;
                    sibling.left.red = false;
                    this.nodeRotateRight(sibling);
                    sibling = sibling.parent;
                } else if(node === parent.right && !this.nodeIsRed(sibling.left) && this.nodeIsRed(sibling.right)) {
                    sibling.red = true;
                    sibling.right.red = false;
                    this.nodeRotateLeft(sibling);
                    sibling = sibling.parent;
                }
                sibling.red = parent.red;
                parent.red = false;
                if(node === parent.left) {
                    this.nodeRotateLeft(parent);
                    sibling.right.red = false;
                } else {
                    this.nodeRotateRight(parent);
                    sibling.left.red = false;
                }
            }
        }
    };
    RedBlackTree.prototype.nodeIterate = function (node, fn, thisObject) {
        if(node.left) {
            this.nodeIterate(node.left, fn, thisObject);
        }
        fn.call(thisObject || this, node.data, node);
        if(node.right) {
            this.nodeIterate(node.right, fn, thisObject);
        }
    };
    RedBlackTree.prototype.nodeRemoveMin = function (node) {
        var child = node.left || node.right, sibling = this.nodeSibling(node);
        if(child) {
            child.parent = node.parent;
        }
        if(node.parent) {
            if(node.parent.left === node) {
                node.parent.left = child;
            } else {
                node.parent.right = child;
            }
        } else {
            this.root = child;
        }
        if(!node.red) {
            if(this.nodeIsRed(child)) {
                child.red = false;
            } else {
                this.nodeRemoveFixUp(child, node.parent, sibling);
            }
        }
        node.left = node.right = node.parent = null;
        node.red = false;
    };
    return RedBlackTree;
})();
exports.RedBlackTree = RedBlackTree;
var BinarySearchTree = (function (_super) {
    __extends(BinarySearchTree, _super);
    function BinarySearchTree(lessTest) {
        if (typeof lessTest === "undefined") { lessTest = function (a, b) {
            return (a < b);
        }; }
        _super.call(this);
        this.lessTest = lessTest;
    }
    BinarySearchTree.prototype.search = function (data) {
        return this.nodeSearch(this.root, data);
    };
    BinarySearchTree.prototype.searchMaxSmallerThan = function (data) {
        return this.nodeSearchMaxSmallerThan(this.root, data);
    };
    BinarySearchTree.prototype.searchMinGreaterThan = function (data) {
        return this.nodeSearchMinGreaterThan(this.root, data);
    };
    BinarySearchTree.prototype.insert = function (data) {
        if(this.length === 0) {
            this.length++;
            this.root = new RedBlackTreeNode(data);
            this.root.red = false;
            return this.root;
        } else {
            this.length++;
            return this.nodeInsert(this.root, data, this.lessTest);
        }
    };
    BinarySearchTree.prototype.nodeSearch = function (root, data) {
        var test = this.lessTest;
        while(root && root.data !== data) {
            if(test(data, root.data)) {
                root = root.left;
            } else {
                root = root.right;
            }
        }
        return root;
    };
    BinarySearchTree.prototype.nodeSearchMaxSmallerThan = function (node, data) {
        var test = this.lessTest, last = null;
        while(node) {
            if(test(node.data, data)) {
                last = node;
                node = node.right;
            } else {
                node = node.left;
            }
        }
        return last;
    };
    BinarySearchTree.prototype.nodeSearchMinGreaterThan = function (root, data) {
        var test = this.lessTest, last = null;
        while(root) {
            if(test(data, root.data)) {
                last = root;
                root = root.left;
            } else {
                root = root.right;
            }
        }
        return last;
    };
    BinarySearchTree.prototype.nodeInsert = function (refNode, data, lessTest) {
        var result;
        if(lessTest(data, refNode.data)) {
            if(!refNode.left) {
                return this.insertBefore(new RedBlackTreeNode(data), refNode);
            } else {
                return this.nodeInsert(refNode.left, data, lessTest);
            }
        } else {
            if(!refNode.right) {
                return this.insertAfter(new RedBlackTreeNode(data), refNode);
            } else {
                return this.nodeInsert(refNode.right, data, lessTest);
            }
        }
    };
    BinarySearchTree.prototype.remove = function (data) {
        if(this.length) {
            this.removeNode(this.search(data));
        }
    };
    return BinarySearchTree;
})(RedBlackTree);
exports.BinarySearchTree = BinarySearchTree;
