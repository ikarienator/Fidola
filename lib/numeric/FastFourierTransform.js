/**
 * A fast fourier transformer to transform/inverse transform
 * fixed sized complex array.
 *
 * This class implements radix-2 Cooley–Tukey FFT algorithm.
 * @param length
 * @constructor
 */
function FastFourierTransform(length) {
    var n, k, d, i, c, rev;
    n = this.length = length;
    this.sinTable = {};
    this.cosTable = {};
    for (d = 1; d < n; d <<= 1) {
        if (!(d in this.sinTable)) {
            this.sinTable[d] = Math.sin(-Math.PI / d);
            this.cosTable[d] = Math.cos(Math.PI / d);
        }
    }
    this.reverseTable = [];
    for (i = 0; i < n; i++) {
        c = n >> 1;
        k = i;
        rev = 0;
        while (c) {
            rev <<= 1;
            rev |= k & 1;
            c >>= 1;
            k >>= 1;
        }
        this.reverseTable[i] = rev;
    }
}

FastFourierTransform.prototype = {
    _fftcore: function (list) {
        var n = this.length,
            i, m, k, omreal, omimag, oreal, oimag, id1, id2,
            tr, ti, tmpReal,
            sinTable = this.sinTable,
            cosTable = this.cosTable,
            rev, reverseTable = this.reverseTable, a;
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
        while (m < n) {
            omreal = cosTable[m];
            omimag = sinTable[m];
            oreal = 1;
            oimag = 0;
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
        }
    },

    /**
     * Perform fast Fourier transform.
     * @param {Array} list The number array to be transformed. The element should be presented as a list of
     * 2 * fft.length numbers. The real and imag part of each complex number are placed together.
     * @returns {Array}
     */
    forward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            return list;
        } else {
            this._fftcore(list);
        }
        return list;
    },

    /**
     * Perform fast inverse Fourier transform.
     * @param {Array} list The number array to be transformed. The element should be presented as a list of
     * 2 * fft.length numbers. The real and imag part of each complex number are placed together.
     * @returns {Array}
     */
    backward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            return list;
        } else {
            for (i = 0; i < this.length; i++) {
                list[i * 2] = list[i * 2] / n;
                list[i * 2 + 1] = -list[i * 2 + 1] / n;
            }
            this._fftcore(list);
            return list;
        }
    }
};

function fft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        expn = 1 << Math.ceil(Math.log(n) / Math.log(2));
    list.length = expn;
    for (i = len; i < expn; i++) {
        list[i] = 0;
    }
    if (!FastFourierTransform[expn / 2]) {
        FastFourierTransform[expn / 2] = new FastFourierTransform(expn / 2);
    }
    return FastFourierTransform[expn / 2].forward(list);
}

function ifft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        expn = 1 << Math.ceil(Math.log(n) / Math.log(2));
    list.length = expn;
    for (i = len; i < expn; i++) {
        list[i] = 0;
    }
    if (!FastFourierTransform[expn / 2]) {
        FastFourierTransform[expn / 2] = new FastFourierTransform(expn / 2);
    }
    return FastFourierTransform[expn / 2].backward(list);
}

exports.fft = fft;
exports.ifft = ifft;