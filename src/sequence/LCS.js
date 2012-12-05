/**
 * http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @return {Object}
 */
function longestCommonSubsequenceDP(a, b, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    if (a.length > b.length) {
        // Swap a, b
        var flipResult = longestCommonSubsequenceDP(b, a, function (a, b) {
            return eqTest(b, a);
        });
        return {
            indicesA: flipResult.indicesB,
            indicesB: flipResult.indicesA,
            length: flipResult.length,
            result: flipResult.result
        };
    }
    if (a.length === 0) {
        return {
            indicesA: [],
            indicesB: [],
            length: 0,
            result: []
        };
    }

    var i, ln = b.length, j, ln2 = a.length, ln3 = 0,
        heads = [], ln3, k, l, target = [], lastElement,
        currB;
    for (i = 0; i < ln; i += 1) {
        currB = b[i];
        ln3 = heads.length;
        target = heads.slice(0);
        for (j = 0, k = 0, l = 0; j < ln2; j += 1) {
            if (eqTest(a[j], currB)) {
                // max k that heads[k + 1].indexA < j or -1 if 
                // all heads[k + 1].indexA >= j
                while (k < ln3 && heads[k].indexA < j) {
                    k += 1;
                }
                // min l that target[l].indexA >= j
                // or l == target.length if all target[l] < j
                while (l < ln3 && target[l].indexA < j) {
                    l += 1;
                }

                if (!target[l] || target[l].indexA > j) {
                    target[l] = {
                        indexA: j,
                        indexB: i,
                        length: heads[k - 1] ? heads[k - 1].length + 1 : 1,
                        trackBack: heads[k - 1] || null
                    };
                }

                // Jump to next change cause collision will not improve
                // the result
                if (heads[k]) {
                    j = heads[k].indexA;
                } else {
                    j = ln2;
                }
            }
            // do nothing else wise.
        }
        heads = target;
    }

    var indicesA = [],
        indicesB = [],
        length = heads.length,
        element = heads[length - 1],
        result = [];

    for (i = length - 1; i >= 0; i -= 1) {
        result[i] = a[indicesA[i] = element.indexA];
        indicesB[i] = element.indexB;
        element = element.trackBack;
    }

    return {
        indicesA: indicesA,
        indicesB: indicesB,
        length: length,
        result: result
    };
}

fast.seq.LCS = longestCommonSubsequenceDP;