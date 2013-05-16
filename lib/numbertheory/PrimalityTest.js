var fidola = require('../fidola');
/**
 * Miller-Rabin Primality Test with base a, odd index d and modular n,
 * and n = 2^s * d.
 * @param a
 * @param s
 * @param d
 * @param n
 * @returns {boolean}
 */
function millerRabinPrimalityTest(a, s, d, n) {
    var c = fidola.nt.powerMod(a, d, n);
    if (c === 1) {
        return true;
    }
    for (var r = 0; r < s; r++) {
        if (c === n - 1) {
            return true;
        }
        c = fidola.nt.multMod(c, c, n);
    }
    return false;
}

var SMALL_PRIMES = null;

/**
 * Generates all primes less than 1M using Sieve of
 * Eratosthenes algorithm.
 */
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
}

/**
 * Test if a small number (i.e. number can be fit into a 31-bit integer)
 * is a prime number.
 *
 * Using Miller-Rabin Primality test with base 2, 7 and 61 which covers
 * all positive integer less than 4759123141 with no false positive.
 *
 * @param {Number} small_number
 * @returns {Boolean}
 */
function primeQ(small_number) {
    small_number |= 0;
    if (small_number <= 0) {
        return false;
    }
    if (!SMALL_PRIMES) {
        preparePrimes();
    }
    if (small_number < 1048576) {
        return fidola.seq.binarySearch(SMALL_PRIMES, small_number) !== -1;
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