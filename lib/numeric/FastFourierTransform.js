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
    var n, k, i, c, rev, result = {};
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

/**
 * Convolution of two complex list of the same size n.
 * Will be zero padded in to two radix-2 list of size a least 2n-1.
 *
 * The two lists will be destroyed.
 *
 * @private
 * @param list1
 * @param list2
 */
function _conv(list1, list2) {
    // Log 2 of 2n - 1; list1.length == 2n since its a list of complex numbers.
    var minn = list1.length - 1,
        depth = Math.ceil(Math.log(list1.length - 1) * Math.LOG2E),
        length = 1 << depth,
        length2 = length << 1,
        i, r1, i1, r2, i2;
    for (i = list1.length; i < length2; i += 2) {
        list1[i] = 0;
        list1[i + 1] = 0;
        list2[i] = 0;
        list2[i + 1] = 0;
    }
    _fftcore(list1);
    _fftcore(list2);
    for (i = 0; i < length2; i += 2) {
        r1 = list1[i];
        i1 = list1[i + 1];
        r2 = list2[i];
        i2 = list2[i + 1];
        list1[i] = (r1 * r2 - i1 * i2) / length;
        list1[i + 1] = -(r1 * i2 + i1 * r2) / length;
    }
    _fftcore(list1);

    for (i = 0; i < minn * 2; i++) {
        list1[i] -= list1[i + minn + 1];
    }
    list1.length = minn + 1;
}

function _fftg(list) {
    var length2 = list.length,
        length = length2 / 2,
        an = [], bn = [], cn = [],
        ro, io, cos, sin,
        ang = Math.PI / length, a;
    for (var i = 0, j = 0; i < length2; i += 2, j++) {
        ro = list[i];
        io = list[i + 1];
        a = j * j * ang;
        cos = Math.cos(a);
        sin = -Math.sin(a);
        an[i] = cos * ro - sin * io;
        an[i + 1] = cos * io + sin * ro;
        bn[i] = cos;
        bn[i + 1] = -sin;
    }
    _conv(an, bn.slice(0));
    for (i = 0; i < length2; i += 2) {
        ro = an[i];
        io = an[i + 1];
        list[i] = ro * bn[i] - io * bn[i + 1];
        list[i + 1] = -ro * bn[i + 1] - io * bn[i];
    }
}

function fft(list) {
    var olen = list.length,
        n = olen >> 1,
        depth = Math.ceil(Math.log(n) * Math.LOG2E);
    if (n == (1 << depth)) {
        _fftcore(list);
    } else {
        _fftg(list);
    }
    return list;
}

function ifft(list) {
    var i,
        olen = list.length,
        n = olen >> 1,
        depth = Math.ceil(Math.log(n) * Math.LOG2E);
    for (i = 0; i < olen; i += 2) {
        list[i] = list[i] / n;
        list[i + 1] = -list[i + 1] / n;
    }
    if (n == (1 << depth)) {
        _fftcore(list);
    } else {
        _fftg(list);
    }
    return list;
}


exports.fft = fft;
exports.ifft = ifft;