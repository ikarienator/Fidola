export interface GeneralData {
}

export class RedBlackTreeNode {
  red:bool = true;
  parent:RedBlackTreeNode = null;
  left:RedBlackTreeNode = null;
  right:RedBlackTreeNode = null;

  constructor(public data:GeneralData) {
  }
}

export class RedBlackTree {
  root:RedBlackTreeNode = null;
  length = 0;
  beforeNodeSwap:{(newNode:RedBlackTreeNode, oldNode:RedBlackTreeNode):void;} = (a, b) => undefined;

  constructor() {
  }

  first():RedBlackTreeNode {
    return this.nodeLeftMost(this.root);
  }

  last():RedBlackTreeNode {
    return this.nodeRightMost(this.root);
  }

  insertBefore(node:RedBlackTreeNode, refNode:RedBlackTreeNode):RedBlackTreeNode {
    if (this.length == 0) {
      this.length = 1;
      this.root = node;
      this.root.red = false;
      return node;
    } else if (!refNode) {
      return this.insertAfter(node, this.nodeRightMost(this.root));
    } else if (!refNode.left) {
      this.length++;
      refNode.left = node;
      refNode.left.parent = refNode;
      this.nodeInsertFixUp(refNode.left);
      return node;
    } else {
      return this.insertAfter(node, this.nodeRightMost(node.left));
    }
  }

  insertAfter(node:RedBlackTreeNode, refNode:RedBlackTreeNode):RedBlackTreeNode {
    if (this.length == 0) {
      this.length = 1;
      this.root = node;
      this.root.red = false;
    } else if (!refNode) {
      return this.insertBefore(node, this.nodeLeftMost(this.root));
    } else if (!refNode.right) {
      this.length++;
      refNode.right = node;
      refNode.right.parent = refNode;
      this.nodeInsertFixUp(refNode.right);
      return node;
    } else {
      return this.insertBefore(node, this.nodeLeftMost(node.right));
    }
  }

  next(node:RedBlackTreeNode):RedBlackTreeNode {
    if (node.right) {
      return this.nodeLeftMost(node.right);
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
  }

  prev(node:RedBlackTreeNode):RedBlackTreeNode {
    if (node.left) {
      return this.nodeRightMost(node.left);
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
  }

  iterate(fn, thisObject):void {
    if (this.root) {
      this.nodeIterate(this.root, fn, thisObject);
    }
  }

  removeNode(node:RedBlackTreeNode) {
    var minNode;
    if (node) {
      if (node.right) {
        minNode = this.nodeLeftMost(node.right);
        this.swap(node, minNode);
        this.nodeRemoveMin(minNode);
      } else {
        this.nodeRemoveMin(node);
      }
      this.length--;
    }
  }

  swap(node1:RedBlackTreeNode, node2:RedBlackTreeNode) {
    var data1 = node1.data, data2 = node2.data;
    this.beforeNodeSwap(node1, node2);
    node1.data = data2;
    node2.data = data1;
  }

  private nodeLeftMost(node:RedBlackTreeNode):RedBlackTreeNode {
    while (node && node.left) {
      node = node.left;
    }
    return node;
  }

  private nodeRightMost(node:RedBlackTreeNode):RedBlackTreeNode {
    while (node && node.right) {
      node = node.right;
    }
    return node;
  }

  private nodeIsRed(node:RedBlackTreeNode):bool {
    return node && node.red;
  }

  private nodeSibling(node:RedBlackTreeNode):RedBlackTreeNode {
    if (node && node.parent) {
      return node == node.parent.left ? node.parent.right : node.parent.left;
    } else {
      return null;
    }
  }

  private nodeColorFlip(node:RedBlackTreeNode) {
    node.red = !node.red;
    node.left.red = !node.left.red;
    node.right.red = !node.right.red;
  }

  private nodeRotateLeft(node:RedBlackTreeNode) {
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
  }

  private nodeRotateRight(node:RedBlackTreeNode) {
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
  }

  private nodeInsertFixUp(node:RedBlackTreeNode):RedBlackTreeNode {
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
      if (this.nodeIsRed(u)) {
        // Case 3
        this.nodeColorFlip(g);
        this.nodeInsertFixUp(g);
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
          this.nodeRotateRight(g);
        } else {
          this.nodeRotateLeft(g);
        }
      }
    }
    return node;
  }

  private nodeRemoveFixUp(node:RedBlackTreeNode, parent:RedBlackTreeNode, sibling:RedBlackTreeNode):void {
    if (parent !== null) {
      // Case 2
      // sibling's black rank is 1 more than node's.
      // Always have a parent
      // Always have a sibling
      // Not always have the node.
      if (this.nodeIsRed(sibling)) {
        parent.red = true;
        sibling.red = false;
        if (node === parent.left) {
          this.nodeRotateLeft(parent);
          sibling = parent.right;
        } else {
          this.nodeRotateRight(parent);
          sibling = parent.left;
        }
      }

      // Now sibling is black
      if (!this.nodeIsRed(sibling.left) && !this.nodeIsRed(sibling.right)) {
        sibling.red = true;
        if (!this.nodeIsRed(parent)) {
          // Case 3
          this.nodeRemoveFixUp(parent, parent.parent, this.nodeSibling(parent));
        } else {
          // Case 4
          parent.red = false;
        }
      } else {
        // Case 5
        if (node === parent.left && !this.nodeIsRed(sibling.right) && this.nodeIsRed(sibling.left)) {
          sibling.red = true;
          sibling.left.red = false;
          this.nodeRotateRight(sibling);
          sibling = sibling.parent;
        } else if (node === parent.right && !this.nodeIsRed(sibling.left) && this.nodeIsRed(sibling.right)) {
          sibling.red = true;
          sibling.right.red = false;
          this.nodeRotateLeft(sibling);
          sibling = sibling.parent;
        }

        // Case 6
        // Now sibling's far child is red.
        // node, sibling, sibling's near child are black.
        sibling.red = parent.red;
        parent.red = false;
        if (node === parent.left) {
          this.nodeRotateLeft(parent);
          sibling.right.red = false;
        } else {
          this.nodeRotateRight(parent);
          sibling.left.red = false;
        }
      }
    }
  }

  private nodeIterate(node:RedBlackTreeNode, fn:(data:GeneralData, node:RedBlackTreeNode)=>void, thisObject:any) {
    if (node.left) {
      this.nodeIterate(node.left, fn, thisObject);
    }
    fn.call(thisObject || this, node.data, node);
    if (node.right) {
      this.nodeIterate(node.right, fn, thisObject);
    }
  }

  private nodeRemoveMin(node:RedBlackTreeNode) {
    // Note: child is nullable.
    var child = node.left || node.right,
        sibling = this.nodeSibling(node);
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
      if (this.nodeIsRed(child)) {
        child.red = false;
      } else {
        this.nodeRemoveFixUp(child, node.parent, sibling);
      }
    }
    node.left = node.right = node.parent = null;
    node.red = false;
  }
}

export class BinarySearchTree extends RedBlackTree {
  constructor(public lessTest:(a:GeneralData, b:GeneralData)=>bool = (a, b)=>(a < b)) {
    super();
  }

  search(data:GeneralData):RedBlackTreeNode {
    return this.nodeSearch(this.root, data);
  }

  searchMaxSmallerThan(data:GeneralData):RedBlackTreeNode {
    return this.nodeSearchMaxSmallerThan(this.root, data);
  }

  searchMinGreaterThan(data:GeneralData):RedBlackTreeNode {
    return this.nodeSearchMinGreaterThan(this.root, data);
  }

  insert(data):RedBlackTreeNode {
    if (this.length === 0) {
      this.length++;
      this.root = new RedBlackTreeNode(data);
      this.root.red = false;
      return this.root;
    } else {
      this.length++;
      return this.nodeInsert(this.root, data, this.lessTest);
    }
  }

  private nodeSearch(root:RedBlackTreeNode, data:GeneralData):RedBlackTreeNode {
    var test = this.lessTest;
    while (root && root.data !== data) {
      if (test(data, root.data)) {
        root = root.left;
      } else {
        root = root.right;
      }
    }
    return root;
  }

  private nodeSearchMaxSmallerThan(node:RedBlackTreeNode, data:GeneralData):RedBlackTreeNode {
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
  }

  private nodeSearchMinGreaterThan(root:RedBlackTreeNode, data:GeneralData):RedBlackTreeNode {
    var test = this.lessTest,
        last = null;
    while (root) {
      if (test(data, root.data)) {
        last = root;
        root = root.left;
      } else {
        root = root.right;
      }
    }
    return last;
  }

  private nodeInsert(refNode:RedBlackTreeNode, data:GeneralData,
                     lessTest:(a:GeneralData, b:GeneralData)=>bool):RedBlackTreeNode {
    var result;
    if (lessTest(data, refNode.data)) {
      if (!refNode.left) {
        return this.insertBefore(new RedBlackTreeNode(data), refNode);
      } else {
        return this.nodeInsert(refNode.left, data, lessTest);
      }
    } else {
      if (!refNode.right) {
        return this.insertAfter(new RedBlackTreeNode(data), refNode);
      } else {
        return this.nodeInsert(refNode.right, data, lessTest);
      }
    }
  }

  remove(data) {
    if (this.length) {
      this.removeNode(this.search(data));
    }
  }
}