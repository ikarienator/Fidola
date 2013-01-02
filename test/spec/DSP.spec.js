describe("Digital Signal Processing", function () {
    var fft = fast.dsp.fft,
        ifft = fast.dsp.ifft;

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
            var data = [10, 20, 30, 40];
            expect(fft(data)).to.eql([100, 0, -20, 20, -20, 0, -20, -20]);

            data = [];
            var len = 16;
            for (var i = 0; i < len; i++) {
                data[i] = Math.cos(i / len * Math.PI * 2);
            }
            fft(data);
            num_test_arr(data, [0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0 ]);
        });
        it("Small ifft", function () {
            var data = [100, 0, -20, 20, -20, 0, -20, -20];
            expect(ifft(data)).to.eql([10, 20, 30, 40]);
        });
        it("Huge fft (64k elements)", function () {
            var data = [], i, len = 65536, amp = 32, amp2 = 18, freq = 32, freq2 = 37, diff, esp = 1e-5;
            for (i = 0; i < len; i++) {
                data[i] = amp * Math.cos(freq * i / len * Math.PI * 2) + amp2 * Math.cos(freq2 * i / len * Math.PI * 2);
            }
            fft(data);
            for (i = 0; i < len; i++) {
                diff = Math.abs(data[i * 2] - ((i == freq) || (len - i == freq) ? amp * len / 2 : (
                    (i == freq2) || (len - i == freq2) ? amp2 * len / 2 : 0
                    )));
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
});