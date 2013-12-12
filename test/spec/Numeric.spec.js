describe("Numeric Analysis", function () {
    var fft = fidola.numeric.fft,
        ifft = fidola.numeric.ifft,
        fft2d = fidola.numeric.fft2d,
        ifft2d = fidola.numeric.ifft2d;

    function num_test_arr(a, b) {
        var i, len = a.length, diff = [];
        for (i = 0; i < len; i++) {
            a[i] = Math.round(a[i] * 1e4) / 1e4;
            b[i] = Math.round(b[i] * 1e4) / 1e4;
        }
        expect(b).to.eql(a);
    }

    describe("FFT", function () {
        function dft(list) {
            var len = list.length / 2;
            var res = new Array(list.length);
            for (var i = 0; i < len; i++) {
                var ar = 0;
                var ai = 0;
                for (var j = 0; j < len; j++) {
                    var s = 2 * Math.PI * j * i / len;
                    ar += list[j * 2] * Math.cos(s) + list[j * 2 + 1] * Math.sin(s);
                    ai += -list[j * 2] * Math.sin(s) + list[j * 2 + 1] * Math.cos(s);
                }
                res[i * 2] = ar;
                res[i * 2 + 1] = ai;
            }
            return res;
        }

        function idft(list) {
            var len = list.length / 2;
            var res = new Array(list.length);
            for (var i = 0; i < len; i++) {
                var ar = 0;
                var ai = 0;
                for (var j = 0; j < len; j++) {
                    var s = 2 * Math.PI * j * i / len;
                    ar += list[j * 2] * Math.cos(s) - list[j * 2 + 1] * Math.sin(s);
                    ai += list[j * 2] * Math.sin(s) + list[j * 2 + 1] * Math.cos(s);
                }
                res[i * 2] = ar / len;
                res[i * 2 + 1] = ai / len;
            }
            return res;
        }

        function dft2d(list, m, n) {
            var res = new Array(m * n * 2);
            for (var u = 0, uv = 0; u < n; u++) {
                for (var v = 0; v < m; v++, uv += 2) {
                    res[uv] = 0;
                    res[uv + 1] = 0;
                    for (var x = 0, xy = 0; x < n; x++) {
                        for (var y = 0; y < m; y++, xy += 2) {
                            var s = 2 * Math.PI * (x * u / n + y * v / m);
                            res[uv] += list[xy] * Math.cos(s) + list[xy + 1] * Math.sin(s);
                            res[uv + 1] += -list[xy] * Math.sin(s) + list[xy + 1] * Math.cos(s);
                        }
                    }
                }
            }
            return res;
        }

        function idft2d(list, m, n) {
            var res = new Array(m * n * 2);
            for (var u = 0, uv = 0; u < n; u++) {
                for (var v = 0; v < m; v++, uv += 2) {
                    res[uv] = 0;
                    res[uv + 1] = 0;
                    for (var x = 0, xy = 0; x < n; x++) {
                        for (var y = 0; y < m; y++, xy += 2) {
                            var s = 2 * Math.PI * (x * u / n + y * v / m);
                            res[uv] += (list[xy] * Math.cos(s) - list[xy + 1] * Math.sin(s)) / m / n;
                            res[uv + 1] += (list[xy] * Math.sin(s) + list[xy + 1] * Math.cos(s)) / m / n;
                        }
                    }
                }
            }
            return res;
        }

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
            expect(ifft([1, 0])).to.eql(idft([1, 0]));
            expect(ifft([1, 0, 0, 0])).to.eql(idft([1, 0, 0, 0]));
            num_test_arr(ifft([1, 0, 0, 0, 0, 0]), idft([1, 0, 0, 0, 0, 0]));
            var data = [1, 3, 2, 4, 5, 7, 6, 8];
            num_test_arr(fft(data), dft([1, 3, 2, 4, 5, 7, 6, 8]));
            num_test_arr(ifft(data), [1, 3, 2, 4, 5, 7, 6, 8]);
            num_test_arr(ifft(data), idft([1, 3, 2, 4, 5, 7, 6, 8]));
            num_test_arr(fft(data), [1, 3, 2, 4, 5, 7, 6, 8]);
        });
        (function () {
            function makeMat(m, n) {
                var res = [];
                for (var i = 0; i < m * n; i++) {
                    res.push(i, m * n - i);
                }
                return res;
            }

            var m1 = 1, n1 = 1;
            var mat1 = makeMat(m1, n1);
            var dft2d1 = dft2d(mat1, m1, n1);
            var idft2d1 = idft2d(mat1, m1, n1);

            var m2 = 4, n2 = 2;
            var mat2 = makeMat(m2, n2);
            var dft2d2 = dft2d(mat2, m2, n2);
            var idft2d2 = idft2d(mat2, m2, n2);

            var m3 = 31, n3 = 31;
            var mat3 = makeMat(m3, n3);
            var dft2d3 = dft2d(mat3, m3, n3);
            var idft2d3 = idft2d(mat3, m3, n3);

            it("fft2d", function () {
                expect(fft2d([1, 0], 1, 1)).to.eql([1, 0]);
                expect(ifft2d([1, 0], 1, 1)).to.eql([1, 0]);

                num_test_arr(fft2d(mat1.slice(), m1, n1), dft2d1);
                num_test_arr(ifft2d(mat1.slice(), m1, n1), idft2d1);

                num_test_arr(fft2d(mat2.slice(), m2, n2), dft2d2);
                num_test_arr(ifft2d(mat2.slice(), m2, n2), idft2d2);

                num_test_arr(fft2d(mat3.slice(), m3, n3), dft2d3);
                num_test_arr(ifft2d(mat3.slice(), m3, n3), idft2d3);
            });
        })();
        (function () {
            var huge_data, i, len = 65536, amp = 32, amp2 = 18, freq = 32, freq2 = 37, diff, esp = 1e-5;
            huge_data = new (Float64Array || Float32Array)(len * 2);
            for (i = 0; i < len; i++) {
                huge_data[i * 2] = amp * Math.cos(freq * i / len * Math.PI * 2) + amp2 * Math.cos(freq2 * i / len * Math.PI * 2);
                huge_data[i * 2 + 1] = amp * Math.sin(freq * i / len * Math.PI * 2) + amp2 * Math.sin(freq2 * i / len * Math.PI * 2);
            }
            it("Huge fft (64k elements)", function () {
                huge_data = fft(huge_data);
                for (i = 0; i < len; i++) {
                    diff = Math.abs(huge_data[i * 2] - (i == freq ? amp * len : (i == freq2 ? amp2 * len : 0)));
                    if (diff > esp) {
                        expect(diff).to.lessThan(esp);
                        break;
                    }
                    diff = Math.abs(huge_data[i * 2 + 1]);
                    if (diff > esp) {
                        expect(diff).to.lessThan(esp);
                        break;
                    }
                }
            });
        })();
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
            var solver = quadraticFunction(1, -15, -4),
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