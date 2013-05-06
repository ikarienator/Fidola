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

    describe("FNTT", function () {
        it("Load", function () {
            expect(fast.nt.FastNumberTheoreticTransform).not.to.eql(undefined);
            new fast.nt.FastNumberTheoreticTransform(6, 257, 81, 165);
        });
        it("Small", function () {
            var fntt = new fast.nt.FastNumberTheoreticTransform(2, 5, 2, 3);
            var data = [1, 3, 2, 4];
            var dataf = fntt.forward(data);
            expect(dataf).to.eql([ 0, 2, 1, 1]);
            dataf = fntt.backward(dataf);
            expect(dataf).to.eql(data);
        });
        it("Forward", function () {
            var fntt = new fast.nt.FastNumberTheoreticTransform(6, 257, 81, 165);
            var data = [191, 58, 178, 59, 112, 51, 190, 55, 51, 186, 182, 56, 50, 111, 112, 177, 242, 190, 192,
                126, 111, 244, 50, 64, 123, 124, 246, 115, 117, 182, 245, 185, 248, 192, 242, 244, 64, 57, 241,
                245, 58, 122, 52, 115, 127, 184, 49, 112, 181, 126, 179, 183, 177, 54, 119, 118, 59, 119, 251,
                114, 60, 189, 175, 48];
            var dataf = fntt.forward(data);
            expect(dataf).to.eql([141, 84, 210, 182, 72, 46, 110, 219, 104, 152, 85, 180, 40, 229, 156, 26, 98,
                7, 140, 214, 154, 87, 113, 256, 58, 79, 121, 1, 89, 139, 208, 153, 212, 133, 42, 99, 242, 159,
                182, 58, 191, 26, 81, 141, 81, 122, 186, 210, 237, 209, 87, 73, 173, 156, 134, 117, 216, 47, 225,
                199, 119, 44, 232, 240]);
            dataf = fntt.backward(dataf);
            expect(dataf).to.eql(data);
        });
    });
});