/**
 * Disjoint-set data structure is a set of disjoint sets that forms a partition of the
 * objects (thus we use integers here). This class implements Tarjan's rank based union algorithm.
 *
 * Sets are represented by an element it contains, called representative. Each element can
 * become the representative of its containing sets. When you query the containing set
 * of a element, the representative of the set will be returned.
 *
 * Initially, each objects is contained in a set that contains only it (thus becoming the
 * representative). Then two sets can be "joined" together, i.e. representative of one set
 * becomes the representative of the other set as well.  Sets can be joined together, but
 * one set cannot be split.
 *
 * It is a particularly fast operation to join two sets. Amortized time complexity is almost
 * constant. Thus disjoint-set data structure is useful in many graph algorithms to detect
 * connectivity of two components.
 *
 * More about disjoint-set data structure, see: http://en.wikipedia.org/wiki/Disjoint-set_data_structure
 *
 * @param {Number} n Number of elements in the disjoint set.
 * @constructor
 */
function DisjointSet(n) {
    this.parent = [];
    this.rank = [];
    this.parent.length = n;
    this.rank.length = n;
    var i,
        parent = this.parent,
        rank = this.rank;
    for (i = 0; i < n; i++) {
        parent[i] = i;
        rank[i] = 0;
    }
}
var disjointSet_prototype = DisjointSet.prototype;

/**
 * Get classification number of the the given object.
 * @param {Number} a Number of the object.
 * @returns {Number} Classification number of the object.
 */
disjointSet_prototype.get = function (a) {
    if (this.parent[a] === a) {
        return a;
    }
    return this.parent[a] = this.get(this.parent[a]);
};

/**
 * Join two sets and make them share the same classification number.
 * @param {Number} a Number of the object.
 */
disjointSet_prototype.join = function (a, b) {
    a = this.get(a);
    b = this.get(b);
    if (a === b) {
        return;
    }
    var rank = this.rank,
        parent = this.parent;

    if (rank[a] < rank[b]) {
        parent[a] = b;
    } else if (rank[a] > rank[b]) {
        parent[b] = a;
    } else {
        parent[b] = a;
        rank[a] = rank[a] + 1;
    }
};

exports.DisjointSet = DisjointSet;
