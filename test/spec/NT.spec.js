describe("Number Theory Algorithm", function () {
    describe("Small Integers Primality Test", function () {
        it("117 is not prime", function () {
            expect(fast.nt.primeQ(117)).to.eql(false);
        });
        it("119 is not prime", function () {
            expect(fast.nt.primeQ(117)).to.eql(false);
        });
        it("1048571 is prime", function () {
            expect(fast.nt.primeQ(1048571)).to.eql(true);
        });
        it("1048573 is prime", function () {
            expect(fast.nt.primeQ(1048573)).to.eql(true);
        });
        it("1048577 is not prime", function () {
            expect(fast.nt.primeQ(1048577)).to.eql(false);
        });
        it("142523471 is prime", function () {
            expect(fast.nt.primeQ(142523471)).to.eql(true);
        });
        it("142523473 is not prime", function () {
            expect(fast.nt.primeQ(142523473)).to.eql(false);
        });
        it("142523479 is not prime", function () {
            expect(fast.nt.primeQ(142523479)).to.eql(false);
        });
        it("761920933 is prime", function () {
            expect(fast.nt.primeQ(761920933)).to.eql(true);
        });
        it("761920913 is not prime", function () {
            expect(fast.nt.primeQ(761920913)).to.eql(false);
        })
    });
});