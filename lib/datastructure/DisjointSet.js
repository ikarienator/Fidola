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

disjointSet_prototype.get = function (a) {
    if (this.parent[a] === a) {
        return a;
    }
    return this.parent[a] = this.get(this.parent[a]);
};

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