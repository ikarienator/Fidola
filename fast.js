(function(root, factory) {
  "use strict";
  if (typeof define === "function" && define.amd) {
    define([ "exports" ], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    factory(root.fast = {});
  }
})(this, function(fast) {
  function KMPPreprocess(array, eqTest) {
    if (!eqTest) {
      eqTest = function(a, b) {
        return a === b;
      };
    }
    var jump, i = 2, j, ln = array.length;
    if (ln === 0) {
      return [];
    }
    if (ln === 1) {
      return [ -1 ];
    }
    i = 0;
    jump = [ -1 ];
    j = -1;
    while (i < ln) {
      while (j > -1 && !eqTest(array[i], array[j])) {
        j = jump[j];
      }
      i += 1;
      j += 1;
      if (eqTest(array[i], array[j])) {
        jump[i] = jump[j];
      } else {
        jump[i] = j;
      }
    }
    return jump;
  }
  function KMP(a, b, eqTest, jump) {
    if (!eqTest) {
      eqTest = function(a, b) {
        return a === b;
      };
    }
    var i = 0, j = 0, la = a.length, lb = b.length;
    if (la < lb) {
      return -1;
    }
    if (lb === 0) {
      return 0;
    }
    if (la === lb) {
      for (i = 0; i < la; i += 1) {
        if (!eqTest(a[i], b[i])) {
          return -1;
        }
      }
      return 0;
    }
    jump = jump || KMPPreprocess(b, eqTest);
    while (j < la) {
      while (i > -1 && !eqTest(a[j], b[i])) {
        i = jump[i];
      }
      i += 1;
      j += 1;
      if (i >= lb) {
        return j - i;
      }
    }
    return -1;
  }
  function longestCommonSubsequenceDP(a, b, eqTest) {
    if (!eqTest) {
      eqTest = function(a, b) {
        return a === b;
      };
    }
    if (a.length > b.length) {
      var flipResult = longestCommonSubsequenceDP(b, a, function(a, b) {
        return eqTest(b, a);
      });
      return {
        indicesA: flipResult.indicesB,
        indicesB: flipResult.indicesA,
        length: flipResult.length,
        result: flipResult.result
      };
    }
    if (a.length === 0) {
      return {
        indicesA: [],
        indicesB: [],
        length: 0,
        result: []
      };
    }
    var i, ln = b.length, j, ln2 = a.length, ln3 = 0, heads = [], ln3, k, l, target = [], lastElement, currB;
    for (i = 0; i < ln; i += 1) {
      currB = b[i];
      ln3 = heads.length;
      target = heads.slice(0);
      for (j = 0, k = 0, l = 0; j < ln2; j += 1) {
        if (eqTest(a[j], currB)) {
          while (k < ln3 && heads[k].indexA < j) {
            k += 1;
          }
          while (l < ln3 && target[l].indexA < j) {
            l += 1;
          }
          if (!target[l] || target[l].indexA > j) {
            target[l] = {
              indexA: j,
              indexB: i,
              length: heads[k - 1] ? heads[k - 1].length + 1 : 1,
              trackBack: heads[k - 1] || null
            };
          }
          if (heads[k]) {
            j = heads[k].indexA;
          } else {
            j = ln2;
          }
        }
      }
      heads = target;
    }
    var indicesA = [], indicesB = [], length = heads.length, element = heads[length - 1], result = [];
    for (i = length - 1; i >= 0; i -= 1) {
      result[i] = a[indicesA[i] = element.indexA];
      indicesB[i] = element.indexB;
      element = element.trackBack;
    }
    return {
      indicesA: indicesA,
      indicesB: indicesB,
      length: length,
      result: result
    };
  }
  function longestCommonSubarrayDP(a, b, eqTest) {
    if (!eqTest) {
      eqTest = function(a, b) {
        return a === b;
      };
    }
    if (a.length > b.length) {
      var result = longestCommonSubarrayDP(b, a, function(a, b) {
        return eqTest(b, a);
      });
      return {
        startA: result.startB,
        startB: result.startA,
        length: result.length,
        result: result.result
      };
    }
    if (a.length === 0) {
      return {
        startA: 0,
        startB: 0,
        length: 0,
        result: []
      };
    }
    var i, ln = b.length, j, ln2 = a.length, k, ln3 = 0, dp, dp2 = [], currB, longest = 0, longestAIdx = -1, longestBIdx = -1;
    for (i = 0; i < ln; i += 1) {
      currB = b[i];
      if (eqTest(a[0], currB)) {
        dp2.push(0, 1);
        if (longest === 0) {
          longest = 1;
          longestAIdx = 0;
          longestBIdx = i;
        }
      }
      for (j = 1, k = 0; j < ln2; j += 1) {
        if (eqTest(a[j], currB)) {
          while (k < ln3 && dp[k] < j - 1) {
            k += 2;
          }
          if (k < ln3 && dp[k] === j - 1) {
            dp2.push(j, dp[k + 1] + 1);
            if (dp[k + 1] + 1 > longest) {
              longest = dp[k + 1] + 1;
              longestAIdx = j;
              longestBIdx = i;
            }
            k += 2;
          } else {
            dp2.push(j, 1);
            if (longest === 0) {
              longest = 1;
              longestAIdx = j;
              longestBIdx = i;
            }
          }
        }
      }
      dp = dp2;
      dp2 = [];
      ln3 = dp.length;
    }
    return {
      startA: longestAIdx - longest + 1,
      startB: longestBIdx - longest + 1,
      length: longest,
      result: a.slice(longestAIdx - longest + 1, longestAIdx + 1)
    };
  }
  function longestCommonSubstringDP(a, b) {
    return longestCommonSubarrayDP(a.split(""), b.split(""), function(a, b) {
      return a === b;
    }).result.join("");
  }
  function longestIncreasingSubsequence(array) {
    var st = [], prev = [], result = [];
    if (array.length === 0) {
      return result;
    }
    st[1] = 0;
    prev[0] = -1;
    for (var i = 1; i < array.length; i++) {
      var curr = array[i];
      if (array[st[1]] > curr) {
        prev[i] = -1;
        st[1] = i;
      } else if (array[st[st.length - 1]] < curr) {
        prev[i] = st[st.length - 1];
        st.push(i);
      } else {
        for (var left = 1, right = st.length - 1, mid = left + right >> 1; right > left + 1; mid = left + right >> 1) {
          if (array[st[mid]] < curr) {
            left = mid;
          } else {
            right = mid;
          }
        }
        prev[i] = st[left];
        st[right] = i;
      }
    }
    for (var tb = st.length - 1, cursor = st[tb]; cursor >= 0; tb--, cursor = prev[cursor]) {
      result[tb - 1] = array[cursor];
    }
    return result;
  }
  function shuffle(array, rng) {
    var i, n = array.length, pivot, temp;
    if (!rng) {
      rng = Math.random;
    }
    for (i = n - 2; i > 0; i--) {
      pivot = rng() * (i + 1);
      if (pivot >= i) {
        continue;
      }
      temp = array[i];
      array[i] = array[pivot];
      array[pivot] = temp;
    }
  }
  function PriorityQueue(values, orderTest) {
    if (orderTest === undefined) {
      orderTest = function(a, b) {
        return a < b;
      };
    }
    this._lessTest = orderTest;
    if (values !== undefined) {
      this._arr = values.slice(0);
      var arr = this._arr, i, ln = arr.length, parent;
      for (i = ln - 1; i >= 0; i--) {
        this._down(i);
      }
    } else {
      this._arr = [];
    }
  }
  function RedBlackTree(lessTest) {
    if (lessTest) {
      this.lessTest = lessTest;
    }
  }
  function RedBlackTreeNode(data) {
    this.data = data;
  }
  fast.seq = {};
  fast.ds = {};
  fast.seq.KMPPreProcess = KMPPreprocess;
  fast.seq.KMP = KMP;
  fast.seq.LCS = longestCommonSubsequenceDP;
  fast.seq.LCStr = longestCommonSubarrayDP;
  fast.seq.LCStrStr = longestCommonSubstringDP;
  fast.seq.LIS = longestIncreasingSubsequence;
  fast.seq.shuffle = shuffle;
  PriorityQueue.prototype = {
    _up: function(k) {
      var arr = this._arr, value = arr[k], orderTest = this._lessTest, parent;
      do {
        parent = k - 1 >> 1;
        if (orderTest(value, arr[parent])) {
          arr[k] = arr[parent];
          k = parent;
        } else {
          break;
        }
      } while (k > 0);
      arr[k] = value;
    },
    _down: function(k) {
      var arr = this._arr, orderTest = this._lessTest, value = arr[k], left, right, ln = arr.length;
      do {
        left = k * 2 + 1;
        right = k * 2 + 2;
        if (right >= ln) {
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
              break;
            }
          } else if (orderTest(arr[right], value)) {
            arr[k] = arr[right];
            k = right;
          } else {
            break;
          }
        }
      } while (true);
      arr[k] = value;
    },
    push: function(el) {
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
    },
    peek: function() {
      return this._arr[0];
    },
    pop: function() {
      var arr = this._arr, value = arr[0];
      if (arr.length > 1) {
        arr[0] = arr[arr.length - 1];
        arr.length--;
        this._down(0);
      } else {
        arr.length = 0;
      }
      return value;
    },
    remove: function(data) {
      var arr = this._arr, i = -1, ln = arr.length - 1;
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
    },
    size: function() {
      return this._arr.length;
    }
  };
  fast.ds.PriorityQueue = PriorityQueue;
  RedBlackTreeNode.prototype = {
    parent: null,
    red: true,
    left: null,
    right: null,
    data: null
  };
  RedBlackTree.prototype = {
    lessTest: function(a, b) {
      return a < b;
    },
    root: null,
    length: 0,
    beforeNodeSwap: function(newNode, oldNode) {},
    search: function(data) {
      return this._nodeSearch(this.root, data);
    },
    searchMaxSmallerThan: function(data) {
      return this._nodeSearchMaxSmallerThan(this.root, data);
    },
    searchMinGreaterThan: function(data) {
      return this._nodeSearchMinGreaterThan(this.root, data);
    },
    insert: function(data) {
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
    first: function() {
      return this._nodeLeftMost(this.root);
    },
    last: function() {
      return this._nodeRightMost(this.root);
    },
    next: function(node) {
      if (node.right) {
        return this._nodeLeftMost(node.right);
      } else if (node.parent) {
        var curr = node;
        while (curr.parent && curr.parent.left !== curr) {
          curr = curr.parent;
        }
        return curr.parent;
      } else {
        return null;
      }
    },
    prev: function(node) {
      if (node.left) {
        return this._nodeRightMost(node.left);
      } else if (node.parent) {
        var curr = node;
        while (curr.parent && curr.parent.right !== curr) {
          curr = curr.parent;
        }
        return curr.parent;
      } else {
        return null;
      }
    },
    iterate: function(fn, arg) {
      if (this.root) {
        this._nodeIterate(this.root, fn, arg);
      }
    },
    remove: function(data) {
      if (this.length) {
        this.removeNode(this.search(data));
      }
    },
    removeNode: function(node) {
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
    swap: function(node1, node2) {
      var data1 = node1.data, data2 = node2.data;
      this.beforeNodeSwap(node1, node2);
      node1.data = data2;
      node2.data = data1;
    },
    _nodeLeftMost: function(node) {
      while (node && node.left) {
        node = node.left;
      }
      return node;
    },
    _nodeRightMost: function(node) {
      while (node && node.right) {
        node = node.right;
      }
      return node;
    },
    _nodeIsRed: function(node) {
      return node && node.red;
    },
    _nodeSibling: function(node) {
      if (node && node.parent) {
        return node == node.parent.left ? node.parent.right : node.parent.left;
      } else {
        return null;
      }
    },
    _nodeColorFlip: function(node) {
      node.red = !node.red;
      node.left.red = !node.left.red;
      node.right.red = !node.right.red;
    },
    _nodeRotateLeft: function(node) {
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
    _nodeRotateRight: function(node) {
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
    _nodeSearch: function(node, data) {
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
    _nodeSearchMaxSmallerThan: function(node, data) {
      var test = this.lessTest, last = null;
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
    _nodeSearchMinGreaterThan: function(node, data) {
      var test = this.lessTest, last = null;
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
    _nodeInsertFixUp: function(node) {
      if (!node.parent) {
        node.red = false;
      } else if (node.parent.red) {
        var p = node.parent, g = p.parent, u = g.left === p ? g.right : g.left;
        if (this._nodeIsRed(u)) {
          this._nodeColorFlip(g);
          this._nodeInsertFixUp(g);
        } else {
          if (node === p.right && p === g.left) {
            g.left = node;
            node.parent = g;
            if (p.right = node.left) {
              p.right.parent = p;
            }
            node.left = p;
            p.parent = node;
            p = node;
            node = node.left;
          } else if (node === p.left && p === g.right) {
            g.right = node;
            node.parent = g;
            if (p.left = node.right) {
              p.left.parent = p;
            }
            node.right = p;
            p.parent = node;
            p = node;
            node = node.right;
          }
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
    _nodeInsert: function(node, data, lessTest) {
      var result;
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
    _nodeRemoveFixUp: function(node, parent, sibling) {
      if (parent !== null) {
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
        if (!this._nodeIsRed(sibling.left) && !this._nodeIsRed(sibling.right)) {
          sibling.red = true;
          if (!this._nodeIsRed(parent)) {
            this._nodeRemoveFixUp(parent, parent.parent, this._nodeSibling(parent));
          } else {
            parent.red = false;
          }
        } else {
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
    _nodeIterate: function(node, fn, arg) {
      if (node.left) {
        this._nodeIterate(node.left, fn, arg);
      }
      fn.call(arg || this, node.data, node);
      if (node.right) {
        this._nodeIterate(node.right, fn, arg);
      }
    },
    _nodeRemoveMin: function(node) {
      var child = node.left || node.right, sibling = this._nodeSibling(node);
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
});