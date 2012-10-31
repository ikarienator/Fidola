(function (global) {
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
            heads = [], k, l, target = [], lastElement,
            currB;
        for (i = 0; i < ln; i += 1) {
            currB = b[i];
            target = heads.slice(0);
            for (j = 0, k = -1, l = 0; j < ln2; j += 1) {
                if (eqTest(a[j], currB)) {
                    // max k that heads[k].indexA < j or -1 if 
                    // all heads[k].indexA >= j
                    while (k + 1 < heads.length && heads[k + 1].indexA < j) {
                        k += 1;
                    }
                    // min l that target[l].indexA >= j
                    // or l == target.length if all target[l] < j
                    while (l < target.length && target[l].indexA < j) {
                        l += 1;
                    }


                    if (!target[l] || target[l].indexA > j) {
                        target[l] = {
                            indexA: j,
                            indexB: i,
                            length: heads[k] ? heads[k].length + 1 : 1,
                            trackBack: heads[k] || null
                        };
                    }

                    // Jump to next change cause collision will not improve
                    // the result
                    if (heads[k + 1]) {
                        j = heads[k + 1].indexA;
                    } else {
                        j = ln2;
                    }
                }
                // do nothing else wise.
            }
            heads = target;
        }
        if (heads.length) {
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

        return {
            indicesA: [],
            indicesB: [],
            length: 0,
            result: []
        };
    }


    global.fast.seq.LCS = longestCommonSubsequenceDP;
}(global));