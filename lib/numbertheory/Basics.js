/**
 * Greatest common divisor of two integers
 * @name fidola.nt.gcd
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
function gcd(a, b) {
    var temp, d;
    // Stein's algorithm (binary Euclidean algorithm)
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
    if (a < b) {
        return gcd(b, a);
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
 * Extended greatest common divisor algorithm.
 * Given two integers a and b, solves the linear Diophantine equation:
 *
 *   a * s + b * t = gcd(a, b)
 *
 * where gcd(a, b) is the greatest common divisor of a and b;
 * then returns [gcd(a, b), s, t].
 *
 * @param a
 * @param b
 * @returns {Array}
 */
function egcd(a, b) {
    // Extended binary Euclidean algorithm
    // http://maths-people.anu.edu.au/~brent/pd/rpb096i.pdf
    /**
     * @type {Array}
     */
    var result;
    if (a < 0) {
        result = egcd(-a, b);
        return [result[0], -result[1], result[2]];
    }
    if (b < 0) {
        result = egcd(a, -b);
        return [result[0], result[1], -result[2]];
    }
    if (a === 0) {
        return [b, 0, 1];
    }
    if (b === 0) {
        return [a, 1, 0];
    }
    if (a === b) {
        return [a, 0, 1];
    }

    var d = 0, e = 0;
    while ((a & 1) === 0 && (b & 1) === 0) {
        d++;
        a >>= 1;
        b >>= 1;
    }
    if ((b & 1) == 0) {
        result = egcd(b, a);
        return [result[0] << d, result[2], result[1]];
    }
    while ((a & 1) == 0) {
        e++;
        a >>= 1;
    }
    result = _egcd_odd(a, b);
    while (e) {
        if ((result[1] & 1)) {
            result[1] -= b;
            result[2] += a;
        }
        result[1] >>= 1;
        e--;
    }
    return [result[0] << d, result[1], result[2]];
}

function _egcd_odd(a, b) {
    var a0 = a;
    var b0 = b;
    var m11 = 1, m12 = 0, m21 = 0, m22 = 1, temp;
    do {
        if (b < a) {
            temp = a;
            a = b;
            b = temp;
            temp = m11;
            m11 = m21;
            m21 = temp;
            temp = m12;
            m12 = m22;
            m22 = temp;
        }

        temp = a;
        a = b - a;
        b = temp;
        temp = m11;
        m11 = m21 - m11;
        m21 = temp;
        temp = m12;
        m12 = m22 - m12;
        m22 = temp;

        if (a == 0) {
            return [b, m21, m22];
        }

        while ((a & 1) == 0) {
            // Transform M_1;
            a >>= 1;
            if ((m11 & 1)) {
                m11 -= b0;
                m12 += a0;
            }
            m11 >>= 1;
            m12 >>= 1;
        }
    } while (1);
}

function multInv(a, n) {
    if (a == 0) {
        return NaN;
    }
    var e = egcd(a, n);
    if (e[0] == 1) {
        return (e[1] % n + n) % n;
    }
    return NaN;
}

/**
 * Returns a * b % n concerning interger overflow.
 * @name fidola.nt.multMod
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
 * @name fidola.nt.powerMod
 * @param {Number} a
 * @param {Number} b
 * @param {Number} n
 * @returns {Number}
 */
function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    if (b < 0) {
        a = multInv(a, n);
        if (isNaN(a)) {
            return NaN;
        }
        return powerMod(a, -b, n);
    }
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
exports.egcd = egcd;
exports.multInv = multInv;
exports.powerMod = powerMod;
exports.multMod = multMod;
