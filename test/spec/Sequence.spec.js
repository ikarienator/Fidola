describe("Sequence Algorithm", function () {
    describe("Longest Increasing Subsequence", function () {
        var seed = 1.7;
        var LIS = fast.seq.longestIncreasingSubsequence;

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
        
        var lcs = fast.seq.longestCommonSubarrayDP,
            lcsStr = fast.seq.longestCommonSubstringDP,
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
            for (var i = 0; i < 2000; i++) {
                num1.push(Math.floor(random() * 3) % 3);
                num2.push(Math.floor(random() * 3) % 3);
            }
            var result = lcs(num1, num2).result;
            expect(result.length).to.eql(14);
        });
    });
});
