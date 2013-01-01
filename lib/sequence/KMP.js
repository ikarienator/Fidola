/**
 * http://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
 *
 * @param {Array} array
 * @param {Function} [eqTest]
 * @return {Array}
 */
function KMPPreprocess(array, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    var jump, i = 2, j, ln = array.length;
    if (ln === 0) {
        return[];
    }
    if (ln === 1) {
        return [-1];
    }
    i = 0;
    jump = [-1];
    j = -1;
    while (i < ln) {
        while (j > -1 && !eqTest(array[i], array[j])) {
            j = jump[j];
        }
        i += 1;
        j += 1;
        if (eqTest(array[i], array[j])) {
            jump[i] = jump[j];
        } else {
            jump[i] = j;
        }
    }
    return jump;
}

/**
 * http://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
 * Find b in a.
 * Assuming b.length << a.length
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @param {Array} [jump]
 * @return {Number}
 */
function KMP(a, b, eqTest, jump) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }

    var i = 0, j = 0, la = a.length, lb = b.length;
    if (la < lb) {
        return -1;
    }
    if (lb === 0) {
        return 0;
    }
    if (la === lb) {
        for (i = 0; i < la; i += 1) {
            if (!eqTest(a[i], b[i])) {
                return -1;
            }
        }
        return 0;
    }

    jump = jump || KMPPreprocess(b, eqTest);

    while (j < la) {
        while (i > -1 && !eqTest(a[j], b[i])) {
            i = jump[i];
        }
        i += 1;
        j += 1;
        if (i >= lb) {
            return j - i;
        }
    }

    return -1;
}

exports.KMPPreProcess = KMPPreprocess;
exports.KMP = KMP;