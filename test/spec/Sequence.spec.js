describe("Sequence Algorithm", function () {
    describe("Longest Increasing Subsequence", function () {
        var seed = 1.7;
        var LIS = fast.seq.LIS;

        function random() {
            seed *= 12422.4234;
            seed -= Math.floor(seed);
            return seed;
        }

        it("Empty Array", function () {
            expect(LIS([])).to.eql([]);
        });

        it("Single Element Array", function () {
            expect(LIS([15])).to.eql([15]);
        });

        it("General Cases", function () {
            expect(LIS([15, 16])).to.eql([15, 16]);
            expect(LIS([15, 16, 17])).to.eql([15, 16, 17]);
            expect(LIS([15, 17, 16])).to.eql([15, 16]);
            expect(LIS([1, 3, 5, 7, 2, 3, 4, 5, 9])).to.eql([1, 2, 3, 4, 5, 9]);
            // http://en.wikipedia.org/wiki/Longest_increasing_subsequence#Example
            expect(LIS([0, 8, 4, 12, 2, 10, 6, 14, 1, 9, 5, 13, 3, 11, 7, 15])).to.eql([0, 2, 6, 9, 11, 15]);
        });

        it("Random Array", function () {
            var num = [];
            seed = 1.7;
            for (var i = 0; i < 1000; i++) {
                num.push(random());
            }
            var result = LIS(num);
            for (var i = 1; i < result.length; i++) {
                expect(result[i]).to.above(result[i - 1]);
            }
        });

        it("Stress Test", function () {
            var num = [];
            seed = 1.7;
            for (var i = 0; i < 100000; i++) {
                num.push(random());
            }
            var result = LIS(num);
            expect(result.length).to.eql(626);
        });
    });

    describe("Longest Common SubString (DP)", function () {
        var seed = 1.7;

        function random() {
            seed *= 12422.4234;
            seed -= Math.floor(seed);
            return seed;
        }

        var lcs = fast.seq.LCStr,
            lcsStr = fast.seq.LCStrStr,
            empty = { startA: 0, startB: 0, length: 0, result: [] };
        it("Empty Array", function () {
            expect(lcs([], [])).to.eql(empty);
            expect(lcs([], [1, 2, 3])).to.eql(empty);
            expect(lcs([1, 2, 3], [])).to.eql(empty);
        });
        it("Single Element Array", function () {
            expect(lcs([1], [])).to.eql(empty);
            expect(lcs([], [1])).to.eql(empty);
            expect(lcs([1], [2])).to.eql(empty);
            expect(lcs([1], [1])).to.eql({ startA: 0, startB: 0, length: 1, result: [1] });
        });
        it("General Cases", function () {
            expect(lcs([1, 2, 1, 1], [1, 1])).to.eql({ startA: 2, startB: 0, length: 2, result: [1, 1] });
            expect(lcs([1, 2, 3, 4], [1, 3])).to.eql({ startA: 0, startB: 0, length: 1, result: [1] });
            expect(lcs([1, 2, 3, 4], [1, 3, 4])).to.eql({ startA: 2, startB: 1, length: 2, result: [ 3, 4 ] });
            expect(lcs([1, 2, 3, 4], [4, 3, 2, 1])).to.eql({ startA: 3, startB: 0, length: 1, result: [ 4 ] });
            expect(lcs([1, 2, 3, 5], [4, 3, 5, 1])).to.eql({ startA: 2, startB: 1, length: 2, result: [ 3, 5 ]});
            expect(lcs([1, 1, 2, 3, 5, 8], [0, 1, 1, 2, 3, 5, 8])).to.eql({
                startA: 0,
                startB: 1,
                length: 6,
                result: [1, 1, 2, 3, 5, 8]
            });
        });
        it("String", function () {
            expect(lcsStr('abcdef', 'acabacdefabcef')).to.eql('cdef');
        });

        it("Stress Test", function () {
            var num1 = [], num2 = [];
            seed = 1.7;
            for (var i = 0; i < 1000; i++) {
                num1.push(Math.floor(random() * 3) % 3);
                num2.push(Math.floor(random() * 3) % 3);
            }
            var result = lcs(num1, num2).result;
            expect(result.length).to.eql(12);
        });
    });

    describe("Longest Common SubSequence (DP)", function () {
        var lcs = fast.seq.LCS,
            empty = { indicesA: [], indicesB: [], length: 0, result: [] };

        it("Empty Array", function () {
            expect(lcs([], [])).to.eql(empty);
            expect(lcs([], [1, 2, 3])).to.eql(empty);
            expect(lcs([1, 2, 3], [])).to.eql(empty);
        });

        it("Single Element Array", function () {
            expect(lcs([1], [])).to.eql(empty);
            expect(lcs([], [1])).to.eql(empty);
            expect(lcs([1], [2])).to.eql(empty);
            expect(lcs([1], [1])).to.eql({
                indicesA: [ 0 ],
                indicesB: [ 0 ],
                length: 1,
                result: [ 1 ]});
        });

        it("General Cases", function () {
            expect(lcs([1, 2, 1, 1], [1, 1])).to.eql({ indicesA: [0, 2], indicesB: [0, 1], length: 2, result: [1, 1] });
            expect(lcs([1, 2, 3, 4], [1, 3])).to.eql({ indicesA: [0, 2], indicesB: [0, 1], length: 2, result: [1, 3] });
            expect(lcs([1, 2, 3, 4], [1, 3, 4])).to.eql({ indicesA: [0, 2, 3], indicesB: [0, 1, 2], length: 3, result: [1, 3, 4] });
            expect(lcs([1, 2, 3, 4], [4, 3, 2, 1])).to.eql({ indicesA: [0], indicesB: [3], length: 1, result: [ 1 ] });
            expect(lcs([1, 2, 3, 5], [4, 3, 4, 5, 1])).to.eql({ indicesA: [2, 3], indicesB: [1, 3], length: 2, result: [ 3, 5 ]});
            expect(lcs([1, 1, 2, 3, 5, 8], [0, 1, 1, 2, 3, 5, 8])).to.eql({
                indicesA: [0, 1, 2, 3, 4, 5],
                indicesB: [1, 2, 3, 4, 5, 6],
                length: 6,
                result: [1, 1, 2, 3, 5, 8]
            });
            expect(lcs([1, 2, 1, 2, 3, 3, 3, 3, 1, 2], [1, 2, 1, 3, 4, 4, 4, 3, 2, 1, 2])).to.eql({
                indicesA: [ 0, 1, 2, 4, 5, 8, 9 ],
                indicesB: [ 0, 1, 2, 3, 7, 9, 10 ],
                length: 7,
                result: [ 1, 2, 1, 3, 3, 1, 2 ] });
            expect(lcs("1234567".split(''), '6138472'.split('')).result).to.eql(['1', '3', '4', '7']);
        });

        it("Stress Test", function () {
            var num1 = [], num2 = [];
            for (var i = 0; i < 3000; i++) {
                num1.push(i);
                num2.push(i * 3);
            }
            var result = lcs(num1, num2).result;
            expect(result.length).to.eql(1000);
        });
    });

    describe("KMP", function () {
        var seed = 1.7;

        function random() {
            seed *= 12422.4234;
            seed -= Math.floor(seed);
            return seed;
        }

        it("Preprocessing", function () {
            expect(fast.seq.KMPPreProcess([])).to.eql([]);
            expect(fast.seq.KMPPreProcess([1])).to.eql([-1]);
            expect(fast.seq.KMPPreProcess('GCAGAGAG')).to.eql([-1, 0, 0, -1, 1, -1, 1, -1, 1]);
        });
        it("Empty", function () {
            expect(fast.seq.KMP('', '')).to.equal(0);
            expect(fast.seq.KMP('a', '')).to.equal(0);
            expect(fast.seq.KMP('', 'a')).to.equal(-1);
            expect(fast.seq.KMP('a', 'a')).to.equal(0);
            expect(fast.seq.KMP('a', 'b')).to.equal(-1);
        });
        it("Matching", function () {
            expect(fast.seq.KMP('ACDACG', 'ACG', function (a, b) {
                return a === b;
            })).to.equal(3);
            expect(fast.seq.KMP('In this context, some properties of the UCS become relevant and have to be addressed. It should be noted that such properties also exist in legacy encodings, and in many cases have been inherited  by the UCS in one way or another from such legacy encodings. In particular, these properties are:', 'UCS')).to.equal(40);
            expect(fast.seq.KMP('In this context, some properties of the UCS become relevant and have to be addressed. It should be noted that such properties also exist in legacy encodings, and in many cases have been inherited  by the UCS in one way or another from such legacy encodings. In particular, these properties are:', 'UCSUCSUCS')).to.equal(-1);
            expect(fast.seq.KMP('In this context, some properties of the UCS become relevant and have to be addressed. It should be noted that such properties also exist in legacy encodings, and in many cases have been inherited  by the UCS in one way or another from such legacy encodings. In particular, these properties are:', 'UCS-4UCS')).to.equal(-1);
        });
        it("Stress Test", function () {
            var a = [],
                b = [],
                savedSeed;
            seed = 1.7;
            for (var i = 0; i < 1000; i++) {
                a.push(Math.floor(random() * 1000) % 1000);
            }
            savedSeed = seed;
            for (var i = 0; i < 1000000; i++) {
                a.push(Math.floor(random() * 1000) % 1000);
            }
            seed = savedSeed;
            for (var i = 0; i < 10000; i++) {
                b.push(Math.floor(random() * 1000) % 1000);
            }
            expect(fast.seq.KMP(a, b)).to.equal(1000);
            b.push(0);
            expect(fast.seq.KMP(a, b)).to.equal(-1);
        });
        it("Binary Search", function () {
            var array = [];
            for (var i = 0, j = 0; i < 1000; i++) {
                j += (Math.random() * 30 >> 0) + 1;
                array.push(j);
            }
            expect(fast.seq.binarySearch(array, array[55])).to.equal(55);
            expect(fast.seq.binarySearchWithCompare(array, array[55], function (a, b) {
                return a - b;
            })).to.equal(55);
            expect(fast.seq.binarySearchWithCompare(array, array[0], function (a, b) {
                return a - b;
            })).to.equal(0);
            expect(fast.seq.binarySearchWithCompare(array, array[55] + 0.5, function (a, b) {
                return a - b;
            })).to.equal(-1);
        });
    });
});
