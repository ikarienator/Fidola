describe("Data Structure", function () {
    describe("BinaryHeap", function () {
        var data = [1, 3, 3, 4, 4, 2, 4, 5, 6, 7, 11, 25, 23, -3],
            sorted = data.slice(0).sort(function (a, b) {
                return a - b;
            });

        it("Initialize", function () {
            var pq = new fidola.ds.BinaryHeap(data);
            var arr = pq._arr;
            expect(pq.size()).to.eql(data.length);
            expect(arr.length).to.eql(data.length);
            for (var i = 1; i < arr.length; i++) {
                expect(arr[(i - 1) >> 1]).not.to.greaterThan(arr[i]);
            }


        });

        it("Push", function () {
            var pq = new fidola.ds.BinaryHeap();
            var arr = pq._arr, i;
            for (i = 0; i < data.length; i++) {
                pq.push(data[i]);
            }
            expect(pq.size()).to.eql(data.length);
            expect(arr.length).to.eql(data.length)
            for (i = 1; i < arr.length; i++) {
                expect(arr[(i - 1) >> 1]).not.to.greaterThan(arr[i]);
            }

            pq.push(3);
            expect(pq.size()).to.eql(data.length + 1);
            pq.push(3);
            expect(pq.size()).to.eql(data.length + 2);
            pq.push(3, 3, 3);
            expect(pq.size()).to.eql(data.length + 5);
        });

        it("Inverted", function () {
            var pq = new fidola.ds.BinaryHeap(data.slice(), function (a, b) {
                return a > b;
            });
            expect(pq.pop()).to.be(sorted[sorted.length - 1]);
        });

        it("Remove", function () {
            var pq = new fidola.ds.BinaryHeap(data),
                arr = pq._arr, i, j;
            for (i = 0; i < data.length / 2; i++) {
                expect(pq.remove(data[i])).to.be(true);
            }
            expect(pq.remove(data[0])).to.be(false);
            for (j = 1; j < arr.length; j++) {
                expect(arr[(j - 1) >> 1]).not.to.greaterThan(arr[j]);
            }
            for (; i < data.length; i++) {
                expect(pq.remove(data[i])).to.be(true);
            }
            expect(pq.remove(data[0])).to.be(false);
        });

        it("Pop", function () {
            var pq = new fidola.ds.BinaryHeap(data);
            for (var i = 0; pq.size(); i++) {
                expect(pq.size()).to.eql(data.length - i);
                expect(pq.pop()).to.eql(sorted[i]);
            }
            expect(pq.pop()).to.be(undefined);
            pq.push(14);
            expect(pq.pop()).to.eql(14);
        });

        it("Peek", function () {
            var pq = new fidola.ds.BinaryHeap(data);
            pq.push(3);
            pq.push(5);
            for (var i = 0; pq.size(); i++) {
                var peek = pq.peek();
                expect(peek).to.eql(pq.pop());
            }
            expect(pq.peek()).to.be(undefined);
            pq.push(14);
            expect(pq.peek()).to.eql(14);
            expect(pq.peek()).to.eql(14);
            pq.pop();
            expect(pq.peek()).to.be(undefined);

        })
    });
});