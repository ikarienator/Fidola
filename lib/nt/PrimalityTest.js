function sqrMult(a, b, n) {
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    b %= n;
    if (n < 65536 || (4294967296 / a >= b)) {
        return a * b % n;
    }
    var result = 0;
    for (var r = 1; r <= b; r <<= 1) {
        if (r & b) {
            result += a;
            result %= n;
        }
        a <<= 1;
        a %= n;
    }
    return result;
}

function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    if (n === 1) {
        return 0;
    }
    if (b === 0) {
        return 1;
    }
    if (a === 0) {
        return 0;
    }
    if (a === 1) {
        return 1;
    }
    var result = 1;
    while (b) {
        if (b & 1) {
            result = sqrMult(result, a, n);
        }
        a = sqrMult(a, a, n);
        b >>= 1;
    }
    return result;
}

function millerRabinPrimalityTest(a, s, d, n) {
    var c = powerMod(a, d, n);
    if (c === 1) {
        return true;
    }
    for (var r = 0; r < s; r++) {
        if (c === n - 1) {
            return true;
        }
        c = sqrMult(c, c, n);
        if (c == 1) {
            return false;
        }
    }
    return false;
}

var SMALL_PRIMES = null;

function preparePrimes() {
    SMALL_PRIMES = new Uint32Array(82025);
    SMALL_PRIMES[0] = 2;
    var index = 1;
    var bitmap = new Uint32Array(32768);
    for (var i = 3; i <= 1024; i += 2) {
        if (0 == (bitmap[i >> 5] & (1 << (i & 31)))) {
            SMALL_PRIMES[index++] = i;
            for (var j = i * i | 0, i2 = i + i; j < 1048576; j += i2) {
                bitmap[j >> 5] |= (1 << (j & 31));
            }
        }
    }
    for (; i < 1048576; i += 2) {
        if (0 == (bitmap[i >> 5] & (1 << (i & 31)))) {
            SMALL_PRIMES[index++] = i;
        }
    }
    SMALL_PRIMES.indexOf = function (a) {
        var lo = 0, hi = SMALL_PRIMES.length;
        while (lo + 1 < hi) {
            var mid = (lo + hi) >> 1;
            if (this[mid] === a) {
                return mid;
            } else if (this[mid] < a) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if (this[lo] == a) {
            return lo;
        }
        return -1;
    };
}

/**
 *
 * @param {Number} small_number
 * @returns {Boolean}
 */
function primeQ(small_number) {
    small_number = small_number | 0;
    if (small_number <= 0) {
        return false;
    }
    if (!SMALL_PRIMES) {
        preparePrimes();
    }
    if (small_number < 1048576) {
        return SMALL_PRIMES.indexOf(small_number) !== -1;
    }
    if ((small_number & 1) == 0) {
        return false;
    }
    var d = (small_number - 1) >> 1;
    var s = 1;
    while ((d & 1) === 0) {
        s++;
        d >>= 1;
    }
    return millerRabinPrimalityTest(2, s, d, small_number) &&
        millerRabinPrimalityTest(7, s, d, small_number) &&
        millerRabinPrimalityTest(61, s, d, small_number);
}


exports.primeQ = primeQ;