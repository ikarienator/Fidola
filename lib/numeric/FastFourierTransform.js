var sinTable = [];
var cosTable = [];
for (var i = 0; i < 32; i++) {
    sinTable[i] = Math.sin(-Math.PI / (1 << i));
    cosTable[i] = Math.cos(Math.PI / (1 << i));
}
var reverseTables = {};

/**
 * Generates auxiliary data for radix-2 fft.
 *
 * @param length
 * @return {Object} Auxiliary data.
 */
function _generateReverseTable(length) {
    var n, k, d, i, c, rev, result = {};
    n = result.length = length;
    var table = new Int32Array(length);
    for (i = 1; i < n; i++) {
        if (table[i] === 0) {
            c = n >> 1;
            k = i;
            rev = 0;
            while (c) {
                rev <<= 1;
                rev |= k & 1;
                c >>= 1;
                k >>= 1;
            }
            table[i] = rev;
            table[rev] = i;
        }
    }
    return table;
}

/**
 * Radix-2 Cooley–Tukey FFT algorithm.
 *
 * @param {Array} list List of components of complex numbers.
 * @private
 */
function _fftcore(list) {
    var n = list.length >> 1;
    if (!reverseTables[n]) {
        reverseTables[n] = _generateReverseTable(n);
    }

    var i, m, iteration, k, omreal, omimag, oreal, oimag, id1, id2,
        tr, ti, tmpReal,
        rev, a,
        reverseTable = reverseTables[n];

    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i * 2];
            list[i * 2] = list[rev * 2];
            list[rev * 2] = a;
            a = list[i * 2 + 1];
            list[i * 2 + 1] = list[rev * 2 + 1];
            list[rev * 2 + 1] = a;
        }
    }

    m = 1;
    iteration = 0;
    while (m < n) {
        // Omega step.
        omreal = cosTable[iteration];
        omimag = sinTable[iteration];
        // Original omega.
        oreal = 1;
        oimag = 0;
        // Position in a stripe.
        for (k = 0; k < m; k++) {
            for (i = k; i < n; i += m << 1) {
                id1 = i << 1;
                id2 = (i + m) << 1;
                tr = (oreal * list[id2]) - (oimag * list[id2 + 1]);
                ti = (oreal * list[id2 + 1]) + (oimag * list[id2]);
                list[id2] = list[id1] - tr;
                list[id2 + 1] = list[id1 + 1] - ti;
                list[id1] += tr;
                list[id1 + 1] += ti;
            }
            tmpReal = oreal;
            oreal = (tmpReal * omreal) - (oimag * omimag);
            oimag = (tmpReal * omimag) + (oimag * omreal);
        }
        m = m << 1;
        iteration++;
    }
}

function fft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        depth = Math.ceil(Math.log(n) * Math.LOG2E) - 1,
        expn = 1 << depth;
    for (i = len; i < expn * 2; i++) {
        list[i] = 0;
    }
    _fftcore(list);
    return list;
}

function ifft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        depth = Math.ceil(Math.log(n) * Math.LOG2E) - 1,
        expn = 1 << depth;
    // Congruence of the list divided by the size of the list.
    for (i = 0; i < len; i += 2) {
        list[i] = list[i] / expn;
        list[i + 1] = -list[i + 1] / expn;
    }
    for (; i < expn * 2; i++) {
        list[i] = 0;
    }
    _fftcore(list);
    return list;
}

exports.fft = fft;
exports.ifft = ifft;