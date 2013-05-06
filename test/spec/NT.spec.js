describe("Number Theory Algorithm", function () {
    describe("Basics", function () {
        it("GCD", function () {
            expect(fast.nt.gcd(0, 1)).to.eql(1);
            expect(fast.nt.gcd(1, 0)).to.eql(1);
            expect(fast.nt.gcd(0, -1)).to.eql(1);
            expect(fast.nt.gcd(-1, 0)).to.eql(1);
            expect(fast.nt.gcd(3, 3)).to.eql(3);
            expect(fast.nt.gcd(8, 16)).to.eql(8);
            expect(fast.nt.gcd(16, 8)).to.eql(8);
            expect(fast.nt.gcd(5, 2)).to.eql(1);
            expect(fast.nt.gcd(3, 7)).to.eql(1);
            expect(fast.nt.gcd(6, 21)).to.eql(3);
        });
        it("MultMod", function () {
            expect(fast.nt.multMod(2543234, 2543234, 2000000011)).to.eql(39143182);
            expect(fast.nt.multMod(232398676, 232398676, 761920913)).to.eql(490012389);
        });
        it("PowerMod", function () {
            expect(fast.nt.powerMod(0, 1, 19)).to.eql(0);
            expect(fast.nt.powerMod(23, 0, 19)).to.eql(1);
            expect(fast.nt.powerMod(3, 5, 1)).to.eql(0);
            expect(fast.nt.powerMod(3, 18, 19)).to.eql(1);
            expect(fast.nt.powerMod(3, 152, 257)).to.eql(60);
            expect(fast.nt.powerMod(3, 65536, 65537)).to.eql(1);
            expect(fast.nt.powerMod(2543234, 2543234, 2000000011)).to.eql(1783755070);
        });
    });
    describe("Small Integers Primality Test", function () {
        it("Trivial cases", function () {
            expect(fast.nt.primeQ(-5)).to.eql(false);
            expect(fast.nt.primeQ(0)).to.eql(false);
            expect(fast.nt.primeQ(1)).to.eql(false);
            expect(fast.nt.primeQ(2)).to.eql(true);
            expect(fast.nt.primeQ(4)).to.eql(false);
            expect(fast.nt.primeQ(761920934)).to.eql(false);
        });
        it("Non-trivial cases", function () {
            expect(fast.nt.primeQ(117)).to.eql(false);
            expect(fast.nt.primeQ(117)).to.eql(false);
            expect(fast.nt.primeQ(1048571)).to.eql(true);
            expect(fast.nt.primeQ(1048573)).to.eql(true);
            expect(fast.nt.primeQ(1048577)).to.eql(false);
            expect(fast.nt.primeQ(142523471)).to.eql(true);
            expect(fast.nt.primeQ(142523473)).to.eql(false);
            expect(fast.nt.primeQ(142523479)).to.eql(false);
            expect(fast.nt.primeQ(761920933)).to.eql(true);
            expect(fast.nt.primeQ(761920913)).to.eql(false);
        })
    });
});