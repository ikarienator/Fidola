var fast = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}
var seq = fast.seq = {};
includes(seq, require("./sequence/BinarySearch"));
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

var ds = fast.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/CartesianTree.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
includes(ds, require("./datastructure/BinarySearchTree.js"));

var nt = fast.nt = {};
includes(nt, require("./numbertheory/Basics.js"));
includes(nt, require("./numbertheory/PrimalityTest.js"));
includes(nt, require("./numbertheory/FNTT.js"));

var numeric = fast.numeric = {};
includes(numeric, require("./numeric/FastFourierTransform.js"));
includes(numeric, require("./numeric/CubicPolynomialSolver.js"));