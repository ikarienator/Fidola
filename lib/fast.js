var fast = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}
var seq = fast.seq = {};
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

var ds = fast.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));

var mp = fast.mp = {};
includes(mp, require("./mp/BigInteger.js"));

var dsp = fast.dsp = {};
includes(dsp, require("./dsp/FFT.js"));
includes(dsp, require("./dsp/FNTT.js"));