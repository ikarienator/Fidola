/**
 * Created with JetBrains WebStorm.
 * User: Bei ZHANG
 * Date: 12/28/12
 * Time: 1:51 AM
 * To change this template use File | Settings | File Templates.
 */


function FastFourierTransform(length) {
    var n, k, d, i, c, rev;
    n = this.length = length;
    this.sinTable = FastFourierTransform.sinTable;
    this.cosTable = FastFourierTransform.cosTable;
    for (d = 1; d < n; d <<= 1) {
        if (!(d in this.sinTable)) {
            this.sinTable[d] = Math.sin(-Math.PI / d);
            this.cosTable[d] = Math.cos(Math.PI / d);
        }
    }
    this.reverseTable = FastFourierTransform.reverseTable[n];
    if (!this.reverseTable) {
        FastFourierTransform.reverseTable[n] = this.reverseTable = [];
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
}

FastFourierTransform.sinTable = {};

FastFourierTransform.cosTable = {};

FastFourierTransform.reverseTable = {};

FastFourierTransform.prototype = {
    _fftcore: function (list) {
        var n = this.length,
            i, m, k, omreal, omimag, oreal, oimag, id1, id2,
            tr, ti, tmpReal,
            sinTable = this.sinTable,
            cosTable = this.cosTable;
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
    forward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            list.push(0);
            return list;
        } else {
            for (i = 0; i < n; i++) {
                rev = reverseTable[i];
                if (rev < i) {
                    a = list[i];
                    list[i] = list[rev];
                    list[rev] = a;
                }
            }
            // Expand to complex
            list.length = n * 2;
            for (i = n - 1; i >= 0; i--) {
                list[i * 2 + 1] = 0;
                list[i * 2] = list[i];
            }
            this._fftcore(list);
        }
        return list;
    },
    backward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            list.length = 1;
            return list;
        } else {
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
            for (i = 0; i < n; i++) {
                list[i * 2 + 1] = -list[i * 2 + 1];
            }
            this._fftcore(list);
            for (i = 0; i < n; i++) {
                list[i] = list[i << 1] / n;
            }
            list.length = n;
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
    if (!FastFourierTransform[expn]) {
        FastFourierTransform[expn] = new FastFourierTransform(expn);
    }
    return FastFourierTransform[expn].forward(list);
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