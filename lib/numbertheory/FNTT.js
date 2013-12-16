var GetBitReverseTable = require('../numeric/FastFourierTransform').GetBitReverseTable;

/**
 *
 * @param depth
 * @param mod
 * @param root
 * @param iroot
 * @constructor
 */
function FastNumberTheoreticTransform(depth, mod, root, iroot) {
    var n = this.length = 1 << depth, c, k, rev;
    this.root = root;
    this.mod = mod;
    this.rootTable = {};
    this.inverseRootTable = {};
    for (var i = 0; i < depth; i++) {
        this.rootTable[n >> i + 1] = root;
        this.inverseRootTable[n >> i + 1] = iroot;
        root *= root;
        root %= mod;
        iroot *= iroot;
        iroot %= mod;
    }
    this.rootTable[1] = 1;
    this.inverseRootTable[1] = 1;
    this.reverseTable = GetBitReverseTable(n);
    // Find smallest prime length * k + 1 > mod
    // Using BLS test: http://www.math.dartmouth.edu/~carlp/PDF/110.pdf
}

FastNumberTheoreticTransform.reverseTable = {};

FastNumberTheoreticTransform.prototype.forward = function (list) {
    var n = this.length, i, rev, reverseTable = this.reverseTable, a;
    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i];
            list[i] = list[rev];
            list[rev] = a;
        }
    }
    this.__fnttcore(list, this.rootTable);
    return list;
};

FastNumberTheoreticTransform.prototype.backward = function (list) {
    var n = this.length, i, rev, reverseTable = this.reverseTable, a;
    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i];
            list[i] = list[rev];
            list[rev] = a;
        }
    }
    this.__fnttcore(list, this.inverseRootTable);
    for (i = 0; i < n; i++) {
        list[i] *= 253;
        list[i] %= this.mod;
    }
    return list;
};

FastNumberTheoreticTransform.prototype.__fnttcore = function (list, rootTable) {
    var n = this.length,
        mod = this.mod,
        i, m, k, om, o, t;
    m = 1;
    while (m < n) {
        om = rootTable[m];
        o = 1;
        for (k = 0; k < m; k++) {
            for (i = k; i < n; i += m << 1) {
                t = o * list[i + m];
                list[i + m] = list[i] - t;
                list[i] += t;
            }
            o *= om;
            o %= mod;
        }
        m = m << 1;
    }
    for (i = 0; i < n; i++) {
        list[i] %= mod;
        list[i] += mod;
        list[i] %= mod;
    }
};

exports.FastNumberTheoreticTransform = FastNumberTheoreticTransform;