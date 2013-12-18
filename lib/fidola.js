/**
 * @namespace fidola
 */
var fidola = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}

/**
 * @namespace fidola.seq
 */
var seq = fidola.seq = {};
includes(seq, require("./sequence/BinarySearch"));
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

/**
 * @namespace fidola.ds
 */
var ds = fidola.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/CartesianTree.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
includes(ds, require("./datastructure/BinarySearchTree.js"));
includes(ds, require("./datastructure/LinkedList.js"));
includes(ds, require("./datastructure/ImmutableArray.js"));

/**
 * @namespace fidola.nt
 */
var nt = fidola.nt = {};
includes(nt, require("./numbertheory/Basics.js"));
includes(nt, require("./numbertheory/PrimalityTest.js"));
includes(nt, require("./numbertheory/FNTT.js"));
includes(nt, require("./arithmatic/Unsigned.js"));
includes(nt, require("./arithmatic/Integer.js"));

/**
 * @namespace fidola.numeric
 */
var numeric = fidola.numeric = {};
includes(numeric, require("./numeric/FastFourierTransform.js"));
includes(numeric, require("./numeric/CubicPolynomialSolver.js"));
