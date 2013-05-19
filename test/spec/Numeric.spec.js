describe("Digital Signal Processing", function () {
    var fft = fidola.numeric.fft,
        ifft = fidola.numeric.ifft;

    function num_test_arr(a, b) {
        var i, len = a.length, diff = [], exp = [];
        for (i = 0; i < len; i++) {
            diff[i] = Math.round(Math.abs(a[i] - b[i]));
            exp[i] = 0;
        }
        expect(diff).to.eql(exp);
    }

    describe("FFT", function () {
        it("Small fft", function () {
            expect(fft([1, 0])).to.eql([1, 0]);
            num_test_arr(fft([1, 0, 2, 0, 3, 0]), [6, 0, -1.5 , 0.8660254037844386 , -1.5 , -0.8660254037844386]);
            num_test_arr(fft([6, 4, 3, 1, 2, 8, 4, 9, 7, 3]),
                [22, 25, 1.74617, -3.53742, -0.460582, 6.46625, -0.011554, 5.56819, 6.72597, -13.497]);

            num_test_arr(fft([10, 0, 20, 0, 30, 0, 40, 0]), [100, 0, -20, 20, -20, 0, -20, -20]);

            var data = [];
            var len = 16;
            for (var i = 0; i < len; i++) {
                data[i * 2] = Math.cos(i / len * Math.PI * 2);
                data[i * 2 + 1] = Math.sin(i / len * Math.PI * 2);
            }
            data = fft(data);
            num_test_arr(data, [0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]);
        });
        it("Small ifft", function () {
            expect(ifft([1, 0])).to.eql([1, 0]);
            expect(ifft([1, 0, 0, 0])).to.eql([0.5, 0, 0.5, 0]);
            num_test_arr(ifft([1, 0, 0, 0, 0, 0]), [1 / 3, 0, 1 / 3, 0, 1 / 3, 0]);
            var data = [100, 0, -20, 20, -20, 0, -20, -20];
            num_test_arr(ifft(data), [10, 0, 20, 0, 30, 0, 40, 0]);
            num_test_arr(fft(data), [100, 0, -20, 20, -20, 0, -20, -20]);
        });
        it("Huge fft (64k elements)", function () {
            var data = [], i, len = 65536, amp = 32, amp2 = 18, freq = 32, freq2 = 37, diff, esp = 1e-5;
            for (i = 0; i < len; i++) {
                data[i * 2] = amp * Math.cos(freq * i / len * Math.PI * 2) + amp2 * Math.cos(freq2 * i / len * Math.PI * 2);
                data[i * 2 + 1] = amp * Math.sin(freq * i / len * Math.PI * 2) + amp2 * Math.sin(freq2 * i / len * Math.PI * 2);
            }
            data = fft(data);
            for (i = 0; i < len; i++) {
                diff = Math.abs(data[i * 2] - (i == freq ? amp * len : (i == freq2 ? amp2 * len : 0)));
                if (diff > esp) {
                    expect(diff).to.lessThan(esp);
                    break;
                }
                diff = Math.abs(data[i * 2 + 1]);
                if (diff > esp) {
                    expect(diff).to.lessThan(esp);
                    break;
                }
            }
        });
    });

    describe("Solvers", function () {
        var linearFunction = fidola.numeric.linearFunction;
        var quadraticFunction = fidola.numeric.quadraticFunction;
        var cubicFunction = fidola.numeric.cubicFunction;
        it("Linear equation", function () {
            var solver = cubicFunction(0, 0, -15, -4);
            expect(solver(-1 / 3)).to.eql(1);
            expect(solver.solve(1)).to.eql([-1 / 3]);
            expect(solver.solve(3)).to.eql([-7 / 15]);

            solver = linearFunction(0, -1);
            expect(solver(0)).to.eql(-1);
            expect(solver.solve(1)).to.eql([]);
            expect(solver.solve(3)).to.eql([]);
        });

        it("Quadratic equation", function () {
            var solver = cubicFunction(0, 1, -15, -4),
                k = 13242,
                roots = solver.solve(k);
            expect(roots.length).to.be(2);
            expect(Math.abs(solver(roots[0]) - k)).to.eql(0);
            expect(Math.abs(solver(roots[1]) - k)).to.eql(0);
            expect(solver.solve(-k).length).to.be(0);
        });

        describe("Cubic equation", function () {
            it("Discriminant1 == 0", function () {
                var solver = cubicFunction(1, 3, 3, 1);
                var roots = solver.solve(-1);
                expect(roots.length).to.be(1);
                expect(Math.abs(solver(roots[0]))).to.eql(1);
            });

            it("Single real root", function () {
                var solver = cubicFunction(1, 2, 3, 1),
                    roots = solver.solve(0);
                expect(roots.length).to.be(1);
                expect(Math.abs(solver(roots[0]))).to.eql(0);
            });

            it("Triple real roots", function () {
                var cases = [
                    [1, 0, -15, -4, 0],
                    [1, 10, -15, -4, 0],
                    [-1, 10, -15, -4, 0],
                    [1, 9, 15, -4, 21],
                    [-1, 9, -15, -4, 21]
                ];
                cases.forEach(function (kase) {
                    var solver = cubicFunction.apply(null, kase);
                    var roots = solver.solve(kase[4]);
                    expect(roots.length).to.be(3);
                    expect(roots[0]).to.not.greaterThan(roots[1]);
                    expect(roots[1]).to.not.greaterThan(roots[2]);
                    expect(Math.abs(solver(roots[0]) - kase[4])).to.lessThan(1e-7);
                    expect(Math.abs(solver(roots[1]) - kase[4])).to.lessThan(1e-7);
                    expect(Math.abs(solver(roots[2]) - kase[4])).to.lessThan(1e-7);
                });
            });
        });
    });
});