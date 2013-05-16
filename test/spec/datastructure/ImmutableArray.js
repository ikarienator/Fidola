describe("Data Structure", function () {
    describe("Immutable Array", function () {
        var data = [1, 3, 2, 4, 5, 7, 6, 8];
        it("Initialize", function () {
            expect(fidola.ds.ImmutableArray).not.to.be(undefined);
            var ll = new fidola.ds.ImmutableArray(1);
            expect(ll.head()).to.be(1);
            expect(ll.tail()).to.be(null);
            expect(ll.length()).to.be(1);
            ll = new fidola.ds.ImmutableArray(3, ll);
            expect(ll.head()).to.be(3);
            expect(ll.tail()).not.to.be(null);
            expect(ll.length()).to.be(2);
        });
        function toIA(data) {
            var arr = null;
            for (var i = data.length - 1; i >= 0; i--) {
                arr = new fidola.ds.ImmutableArray(data[i], arr);
            }
            return arr;
        }

        function testEq(ia, data) {
            var arr = ia, len = 0;
            while (arr) {
                expect(arr.head()).to.be(data[len]);
                arr = arr.tail();
                len++;
            }
            expect(len).to.be(data.length);
        }

        it("Concat", function () {

            var ll = toIA(data),
                ll2 = toIA(data),
                ll3 = ll.concat(ll2);
            expect(ll.length()).to.be(8);
            testEq(ll, data);
            expect(ll2.length()).to.be(8);
            testEq(ll2, data);
            expect(ll3.length()).to.be(16);
            testEq(ll3, data.concat(data));
        });

        it("Clone", function () {
            var ll = toIA(data);
            ll = ll.clone();
            expect(ll.length()).to.be(8);
            testEq(ll, data);
        });

        it("Get", function () {
            var ll = toIA(data);
            for (var i = 0; i < data.length; i++) {
                expect(ll.get(i)).to.be(data[i]);
            }
            expect(ll.get(-1)).to.be(null);
            expect(ll.get(8)).to.be(null);
        });

        it("Fold left", function () {
            var ll = toIA(data);
            expect(JSON.stringify(ll.foldLeft([], function (res, el) {
                return [res, el];
            }))).to.eql("[[[[[[[[[],1],3],2],4],5],7],6],8]");
        });


        it("Fold right", function () {
            var ll = toIA(data);
            expect(JSON.stringify(ll.foldRight([], function (el, res) {
                return [el, res];
            }))).to.eql("[1,[3,[2,[4,[5,[7,[6,[8,[]]]]]]]]]");
        });

        it("Map", function () {
            var ll = toIA(data);

            function negative(el) {
                return -el
            }

            testEq(ll.map(negative), data.map(negative));
        });

        it("Filter", function () {
            var ll = toIA(data);

            function filter(el) {
                return el > 4;
            }

            testEq(ll.filter(filter), data.filter(filter));
        });

        it("ToArray", function () {
            var ll = toIA(data);
            expect(ll.toArray()).to.eql(data);
        });
    });
});