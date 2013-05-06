/**
 * Greatest common divisor of two integers
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
function gcd(a, b) {
    var temp, d;
    // Stein's algorithm
    a |= 0;
    b |= 0;
    if (a < 0) {
        a = -a;
    }
    if (b < 0) {
        b = -b;
    }
    if (a === 0) {
        return b;
    }
    if (b === 0) {
        return a;
    }
    if (a === b) {
        return a;
    }
    d = 0;
    while ((a & 1) === 0 && (b & 1) === 0) {
        d++;
        a >>= 1;
        b >>= 1;
    }
    while ((a & 1) === 0) {
        a >>= 1;
    }
    while ((b & 1) === 0) {
        b >>= 1;
    }
    while (a && b && a != b) {
        if (a < b) {
            temp = a;
            a = (b - a) >> 1;
            b = temp;
            while ((a & 1) === 0) {
                a >>= 1;
            }
        } else {
            temp = b;
            b = (a - b) >> 1;
            a = temp;
            while ((b & 1) === 0) {
                b >>= 1;
            }
        }
    }
    return a << d;
}

/**
 * Returns a * b % n concerning interger overflow.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} n
 * @returns {Number}
 */
function multMod(a, b, n) {
    a >>>= 0;
    b >>>= 0;
    n >>>= 0;
    a %= n;
    b %= n;
    if (a === 0) return 0;
    if (b === 0) return 0;
    if (n < 65536 || (2147483647 / a >= b)) {
        return a * b % n;
    }
    var result = 0;
    for (var r = 1; r <= b; r += r) {
        if (r & b) {
            result += a;
            result %= n;
        }
        a += a;
        a %= n;
    }
    return result;
}

/**
 * Returns pow(a,b) % n with exponentiation by squaring
 * algorithm.
 * @param a
 * @param b
 * @param n
 * @returns {number}
 */
function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    if (a == 0) {
        return 0;
    }
    if (b == 0) {
        return 1;
    }
    a %= n;
    var result = 1;
    while (b) {
        if (b & 1) {
            result = multMod(result, a, n);
        }
        a = multMod(a, a, n);
        b >>= 1;
    }
    return result;
}

exports.gcd = gcd;
exports.powerMod = powerMod;
exports.multMod = multMod;