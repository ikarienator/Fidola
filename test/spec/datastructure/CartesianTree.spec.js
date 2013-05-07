describe("Data Structure", function () {
    var small_data = [1, 3, 2, 4, 5, 7, 6, 8],
        data = [];
    for (var i = 0; i < 10000; i++) {
        data[i] = i;
    }
    fast.seq.shuffle(data);
    describe("Cartesian Tree", function () {
        it("Initialize", function () {
            expect(new fast.ds.CartesianTree().size()).to.eql(0);
            expect(new fast.ds.CartesianTree([]).size()).to.eql(0);
            expect(new fast.ds.CartesianTree(small_data).size()).to.eql(8);
        });

        it("Heapish", function () {
            function checkTopo(ct, data) {
                var orderTest = ct.orderTest;
                for (var i = 0; i < ct.array.length; i++) {
                    if (ct.array[i] != data[i]) {
                        expect(ct.array[i]).to.eql(data[i]);
                    }
                    if (ct.parent[i] != -1) {
                        var parent = ct.array[ct.parent[i]];
                        var value = ct.array[i];
                        if (orderTest(value, parent)) {
                            expect(orderTest(value, parent)).to.be(false);
                        } else if (!orderTest(parent, value)) {
                            if (ct.parent[i] > i) {
                                expect(ct.parent[i]).to.lessThan(i);
                            }
                        }
                        if (ct.parent[i] < i) {
                            if (ct.right[ct.parent[i]] != i) {
                                expect(ct.right[ct.parent[i]]).to.be(i);
                            }
                        } else {
                            if (ct.left[ct.parent[i]] != i) {
                                expect(ct.left[ct.parent[i]]).to.be(i);
                            }
                        }
                    }
                }
            }

            var ct = new fast.ds.CartesianTree(small_data);
            expect(ct.array).to.eql(small_data);
            expect(ct.parent).to.eql([-1, 2, 0, 2, 3, 6, 4, 6]);
            checkTopo(ct, small_data);
            ct = new fast.ds.CartesianTree(small_data, function (a, b) {
                return a > b;
            });
            expect(ct.array).to.eql(small_data);
            expect(ct.parent).to.eql([ 1, 3, 1, 4, 5, 7, 5, -1 ]);

            ct = new fast.ds.CartesianTree(data);
            checkTopo(ct, data);
        });

        it("RMQ Cartesian", function () {
            expect(new fast.ds.CartesianTree().rangeMinimum(0, 1)).to.be(null);
            expect(new fast.ds.CartesianTree([1]).rangeMinimum(0, 1)).to.be(1);
            expect(new fast.ds.CartesianTree([1, 2]).rangeMinimum(0, 1)).to.be(1);
            expect(new fast.ds.CartesianTree([1, 2]).rangeMinimum(1, 1)).to.be(null);
            expect(new fast.ds.CartesianTree([1, 2]).rangeMinimum(1, 2)).to.be(2);
            var ct = new fast.ds.CartesianTree(small_data);
            for (var i = 0; i < 8; i++) {
                for (var j = 0; j < 8; j++) {
                    var el = ct.rangeMinimum(i, j + 1);
                    for (var k = i; k <= j; k++) {
                        if (el > small_data[k]) {
                            expect(el).not.to.greaterThan(small_data[k]);
                        }
                    }
                }
            }

        })
    });
});