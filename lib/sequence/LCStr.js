/**
 * http://en.wikipedia.org/wiki/Longest_common_substring_problem
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @return {Object}
 */
function longestCommonSubarrayDP(a, b, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    if (a.length > b.length) {
        // Swap a, b
        var result = longestCommonSubarrayDP(b, a, function (a, b) {
            return eqTest(b, a);
        });
        return {
            startA: result.startB,
            startB: result.startA,
            length: result.length,
            result: result.result
        };
    }
    if (a.length === 0) {
        return {
            startA: 0,
            startB: 0,
            length: 0,
            result: []
        };
    }

    // dp is a sorted array of non-zero values.
    var i, ln = b.length, j, ln2 = a.length, k, ln3 = 0, dp, dp2 = [],
        currB, longest = 0, longestAIdx = -1, longestBIdx = -1;
    for (i = 0; i < ln; i += 1) {
        currB = b[i];
        if (eqTest(a[0], currB)) {
            dp2.push(0, 1);
            if (longest === 0) {
                longest = 1;
                longestAIdx = 0;
                longestBIdx = i;
            }
        }
        for (j = 1, k = 0; j < ln2; j += 1) {
            if (eqTest(a[j], currB)) {
                while (k < ln3 && dp[k] < j - 1) {
                    k += 2;
                }
                if (k < ln3 && dp[k] === j - 1) {
                    dp2.push(j, dp[k + 1] + 1);
                    if (dp[k + 1] + 1 > longest) {
                        longest = dp[k + 1] + 1;
                        longestAIdx = j;
                        longestBIdx = i;
                    }
                    k += 2;
                } else {
                    dp2.push(j, 1);
                    if (longest === 0) {
                        longest = 1;
                        longestAIdx = j;
                        longestBIdx = i;
                    }
                }
            }
        }
        dp = dp2;
        dp2 = [];
        ln3 = dp.length;
    }
    return {
        startA: longestAIdx - longest + 1,
        startB: longestBIdx - longest + 1,
        length: longest,
        result: a.slice(longestAIdx - longest + 1, longestAIdx + 1)
    };
}

/**
 *
 * @param {String} a
 * @param {String} b
 * @return {String}
 */
function longestCommonSubstringDP(a, b) {
    return longestCommonSubarrayDP(a.split(''), b.split(''),function (a, b) {
        return a === b;
    }).result.join('');
}

exports.LCStr = longestCommonSubarrayDP;
exports.LCStrStr = longestCommonSubstringDP;