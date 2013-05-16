/**
 * @namespace fast
 */
var fast = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}

/**
 * @namespace fast.seq
 */
var seq = fast.seq = {};
includes(seq, require("./sequence/BinarySearch"));
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

/**
 * @namespace fast.ds
 */
var ds = fast.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/CartesianTree.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
includes(ds, require("./datastructure/BinarySearchTree.js"));
includes(ds, require("./datastructure/LinkedList.js"));
includes(ds, require("./datastructure/ImmutableArray.js"));

/**
 * @namespace fast.nt
 */
var nt = fast.nt = {};
includes(nt, require("./numbertheory/Basics.js"));
includes(nt, require("./numbertheory/PrimalityTest.js"));
includes(nt, require("./numbertheory/FNTT.js"));

/**
 * @namespace fast.numeric
 */
var numeric = fast.numeric = {};
includes(numeric, require("./numeric/FastFourierTransform.js"));
includes(numeric, require("./numeric/CubicPolynomialSolver.js"));