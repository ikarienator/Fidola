describe("Data Structure", function () {
    describe("LinkedList (doubly)", function () {
        var data = [1, 3, 2, 4, 5, 7, 6, 8];
        it("Initialize", function () {
            expect(fidola.ds.LinkedList).not.to.be(undefined);
            var ll = new fidola.ds.LinkedList;
            expect(ll.head).to.be(null);
            expect(ll.tail).to.be(null);
        });

        function checkTopo(node) {
            if (!node) {
                return;
            }
            if (node.next) {
                expect(node.next.prev).to.be(node);
                checkTopo(node.next);
            }
            if (node.prev) {
                expect(node.prev.next).to.be(node);
            }
        }

        it("Push", function () {
            var ll = new fidola.ds.LinkedList();
            data.forEach(function (item) {
                ll.push(item);
            });
            expect(ll.head).not.to.be(null);
            expect(ll.tail).not.to.be(null);
            expect(ll.head.data).to.be(1);
            expect(ll.tail.data).to.be(8);
            expect(ll.length).to.be(8);
            checkTopo(ll.head);
        });

        it("Pop", function () {
            var ll = new fidola.ds.LinkedList();
            expect(ll.pop()).to.be(null);
            expect(ll.length).to.be(0);
            data.forEach(function (item) {
                ll.push(item);
            });
            checkTopo(ll.head);
            for (var i = 0; i < 8; i++) {
                var node = ll.pop();
                expect(node.data).to.be(data[7 - i]);
                expect(node.prev).to.be(null);
                expect(node.next).to.be(null);
            }
            expect(ll.head).to.be(null);
            expect(ll.tail).to.be(null);
            checkTopo(ll.head);
        });

        it("Unshift", function () {
            var ll = new fidola.ds.LinkedList();
            data.forEach(function (item) {
                ll.unshift(item);
            });
            expect(ll.head).not.to.be(null);
            expect(ll.tail).not.to.be(null);
            expect(ll.head.data).to.be(8);
            expect(ll.tail.data).to.be(1);
            expect(ll.length).to.be(8);
            checkTopo(ll.head);
        });

        it("Shift", function () {
            var ll = new fidola.ds.LinkedList();
            expect(ll.shift()).to.be(null);
            expect(ll.length).to.be(0);
            data.forEach(function (item) {
                ll.push(item);
            });
            checkTopo(ll.head);
            for (var i = 0; i < 8; i++) {
                var node = ll.shift();
                expect(node.data).to.be(data[i]);
                expect(node.prev).to.be(null);
                expect(node.next).to.be(null);
            }
            expect(ll.head).to.be(null);
            expect(ll.tail).to.be(null);
            checkTopo(ll.head);
        });

        it("ForEach", function () {
            var ll = new fidola.ds.LinkedList();
            ll.forEach(function () {
                expect(true).to.be(false);
            });
            var node;
            data.forEach(function (item, i) {
                var ret = ll.push(item);
                if (i == 4) {
                    node = ret;
                }
            });
            expect(node.data).to.be(5);
            ll.forEach(function (item, i, node, list) {
                expect(item).to.be(data[i]);
                expect(!!node).to.be(true);
                expect(node.data).to.be(item);
                expect(list).to.be(ll);
            });
        });
        it("Remove", function () {
            var ll = new fidola.ds.LinkedList();
            ll.forEach(function () {
                expect(true).to.be(false);
            });
            var node;
            data.forEach(function (item, i) {
                var ret = ll.push(item);
                if (i == 4) {
                    node = ret;
                }
            });
            expect(!!node).to.be(true);
            checkTopo(ll.head);
            ll.remove(node);
            checkTopo(ll.head);
            expect(node.prev).to.be(null);
            expect(node.next).to.be(null);
            ll.remove(ll.head);
            checkTopo(ll.head);
            ll.remove(ll.tail);
            checkTopo(ll.head);
            ll.remove(ll.head);
            checkTopo(ll.head);
            ll.remove(ll.head);
            checkTopo(ll.head);
            ll.remove(ll.head);
            checkTopo(ll.head);
            ll.remove(ll.head);
            checkTopo(ll.head);
            ll.remove(ll.head);
            checkTopo(ll.head);
        });
    });
});