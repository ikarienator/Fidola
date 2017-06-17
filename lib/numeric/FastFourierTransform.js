var sinTable = [];
var cosTable = [];
var _TypedArray = Float64Array;

for (var i = 0; i < 32; i++) {
    sinTable[i] = Math.sin(-Math.PI / (1 << i));
    cosTable[i] = Math.cos(Math.PI / (1 << i));
}
var reverseTables = {
    1: new Int32Array(1),
    2: new Int32Array([0, 1]),
    4: new Int32Array([0, 2, 1, 3])
};

function _nextpo2(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v |= v >> 32;
    v++;
    return v;
}
/**
 * Generates auxiliary data for radix-2 fft.
 *
 * @param length
 * @return {Object} Auxiliary data.
 */
function GetBitReverseTable(length) {
    if (reverseTables[length]) return reverseTables[length];
    var prevTable = GetBitReverseTable(length >> 1);
    var i, half = length >> 1;
    var table = new Int32Array(length);
    for (i = 0; i < half; i++) {
        table[i + half] = (table[i] = prevTable[i] << 1) + 1;
    }
    return table;
}

/**
 * Radix-2 Cooley–Tukey FFT algorithm.
 *
 * @param {Array} list List of components of complex numbers.
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fft_r2(list, n, offset, step) {
    var i, m, iteration, k, omreal, omimag, oreal, oimag, id1, id2,
        tr, ti, tmpReal,
        rev, a,
        reverseTable = GetBitReverseTable(n),
        offset2 = offset << 1,
        step2 = step << 1;

    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i * step2 + offset2];
            list[i * step2 + offset2] = list[rev * step2 + offset2];
            list[rev * step2 + offset2] = a;
            a = list[i * step2 + 1 + offset2];
            list[i * step2 + 1 + offset2] = list[rev * step2 + 1 + offset2];
            list[rev * step2 + 1 + offset2] = a;
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
                id1 = i * step2 + offset2;
                id2 = id1 + m * step2;
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
 * @param n
 */
function _conv(list1, list2, n) {
    // Log 2 of 2n - 1; list1.length == 2n since its a list of complex numbers.
    var length2 = n << 1,
        i, r1, i1, r2, i2;
    _fft_r2(list1, n, 0, 1);
    _fft_r2(list2, n, 0, 1);
    for (i = 0; i < length2; i += 2) {
        r1 = list1[i];
        i1 = list1[i + 1];
        r2 = list2[i];
        i2 = list2[i + 1];
        list1[i] = (r1 * r2 - i1 * i2) / n;
        list1[i + 1] = -(r1 * i2 + i1 * r2) / n;
    }
    _fft_r2(list1, n, 0, 1);
    for (i = 1; i < length2 * 2; i += 2) {
        list1[i] = -list1[i];
    }
}

/**
 * Bluestein's algorithm to calculate non-radix 2 DFT in O(n log n) time.
 * @param list
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fft_bluestein(list, n, offset, step) {
    var length = _nextpo2(n) * 2,
        length2 = length * 2,
        an = new _TypedArray(length2),
        bn = new _TypedArray(length2),
        ro, io, cos, sin,
        offset2 = offset * 2,
        ang = Math.PI / n,
        a;
    for (var i = 0, j = 0; i < n * 2; i += 2, j++) {
        ro = list[i * step + offset2] || 0;
        io = list[i * step + offset2 + 1] || 0;
        a = j * j * ang;
        cos = Math.cos(a);
        sin = Math.sin(a);
        an[i] = cos * ro + sin * io;
        an[i + 1] = cos * io - sin * ro;
        bn[i] = cos;
        bn[i + 1] = sin;
        if (i > 0) {
          bn[length2 - i] = cos;
          bn[length2 - i + 1] = sin;
        }
    }
    _conv(an, new _TypedArray(bn), length);
    for (i = 0; i < n * 2; i += 2) {
        ro = an[i];
        io = an[i + 1];
        list[i * step + offset2] = ro * bn[i] + io * bn[i + 1];
        list[i * step + offset2 + 1] = -ro * bn[i + 1] + io * bn[i];
    }
}

/**
 * FFT of general size in O(n log n) time.
 * @param list
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fftcore(list, n, offset, step) {
    if (n === (n & -n)) { // Power of 2.
        _fft_r2(list, n, offset, step);
    } else {
        _fft_bluestein(list, n, offset, step);
    }
}

/**
 * Perform discrete Fourier transform of list of complex numbers in O(nlogn) time.
 *
 * The size of the list is not required to be a power of 2, whereas calculating
 * such a list is way faster than general case (normally about 4~5x).
 *
 * Discrete Fourier Transform & Inverse Discrete Fourier Transform
 * ===============================================================
 * Discrete Fourier transform (DFT) convert a list of time domain samples into a list of frequencies domain samples.
 * Pseudo C++ code to define DFT:
 *
 * vector<complex<double> > dft(const vector<complex<double> >& list) {
 *   vector<complex<double> > result;
 *   for (int freq = 0; freq < list.size(); freq++) {
 *     complex<double> amp(0, 0);
 *     for (int i = 0; i < list.size(); i++) {
 *       amp +=
 *           list[j] * exp(complex<double>(0, -2 * M_PI * i * freq / list.size()));
 *     }
 *     result.push_back(amp);
 *   }
 *   return result;
 * }
 *
 * Perform inverse discrete Fourier transform to recover the original list:
 * Pseudo C++ code to define IDFT:
 *
 * vector<complex<double> > idft(const vector<complex<double> >& list) {
 *   vector<complex<double> > result;
 *   for (int i = 0; i < list.size(); i++) {
 *     complex<double> amp(0, 0);
 *     for (int i = 0; i < list.size(); i++) {
 *       amp +=
 *           list[i] * exp(complex<double>(0, 2 * M_PI * i * freq / list.size()));
 *     }
 *     result.push_back(amp/list.size());
 *   }
 *   return result;
 * }
 *
 * The core part of DFT and IDFT are pretty similar, in fact we can preprocess a list
 * and use the dft program to perform idft:
 *
 * vector<complex<double> > idft(const vector<complex<double> >& list) {
 *   for (int i = 0; i < list.size(); i++) {
 *      list[i] = conj(list[i]) / list.size();
 *   }
 *   return dft(list);
 * }
 *
 * With this property we can share most of the code and focus only on DFT.
 *
 * fidola.numeric.fft/fidola.numeric.ifft
 * ======================================
 *
 * The algorithm we implemented in Fidola is the combination of Radix-2 Cooley-Tukey fast fourier
 * transform algorithm for lists of size of a power of 2, which will calculate the DFT in O(nlogn) time;
 * For other sizes, we use Bluestein's FFT algorithm which convert the problem into a problem of the first
 * case in O(n) time, then calculate in O(nlogn) time.
 *
 * For more about DFT, Cooley-Tukey algorithm and Bluestein's algorithm:
 *
 * 1. http://en.wikipedia.org/wiki/Discrete_Fourier_transform
 * 2. http://en.wikipedia.org/wiki/Fast_Fourier_transform
 * 3. http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
 * 4. http://en.wikipedia.org/wiki/Bluestein's_FFT_algorithm
 *
 * @param {Array|Float32Array|Float64Array} list List complex presented as [real0, imag0, real1, imag1 ... real[n-1], imag[n-1]].
 * @param {Number} [n] Number of complex numbers. Must be no larger than half of the length of `list`.
 * @returns {*}
 */
function fft(list, n) {
    n = n || list.length >> 1;
    _fftcore(list, n, 0, 1);
    return list;
}

/**
 * Perform inverse discrete Fourier transform of list of complex numbers in O(nlogn) time.
 *
 * Refer to {#fft} for more information.
 *
 * @param {Array|Float32Array|Float64Array} list List complex presented as [real0, imag0, real1, imag1 ... real[n-1], imag[n-1]].
 * @param {Number} [n] Number of complex numbers. Must be no larger than half of the length of `list`.
 * @returns {*}
 */
function ifft(list, n) {
    n = n || list.length >> 1;
    var i, n2 = n << 1;
    for (i = 0; i < n2; i += 2) {
        list[i] = list[i] / n;
        list[i + 1] = -list[i + 1] / n;
    }
    _fftcore(list, n, 0, 1);
    for (i = 0; i < n2; i += 2) {
        list[i + 1] = -list[i + 1];
    }
    return list;
}


function fft2d(list, m, n) {
    var i;
    for (i = 0; i < n; i++) {
        _fftcore(list, m, i * m, 1);
    }
    for (i = 0; i < m; i++) {
        _fftcore(list, n, i, m);
    }
    return list;
}

function ifft2d(list, m, n) {
    var i, area = m * n, area2 = area * 2;
    for (i = 0; i < area2; i += 2) {
        list[i] = list[i] / area;
        list[i + 1] = -list[i + 1] / area;
    }
    for (i = 0; i < n; i++) {
        _fftcore(list, m, i * m, 1);
    }
    for (i = 0; i < m; i++) {
        _fftcore(list, n, i, m);
    }
    for (i = 0; i < area2; i += 2) {
        list[i + 1] = -list[i + 1];
    }
    return list;
}

exports.GetBitReverseTable = GetBitReverseTable;
exports.fft = fft;
exports.ifft = ifft;
exports.fft2d = fft2d;
exports.ifft2d = ifft2d;
