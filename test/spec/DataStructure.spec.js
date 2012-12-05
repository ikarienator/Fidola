describe("Data Structure", function () {
    describe("Red-Black Tree", function () {
        var data = [],
            seed = 1.72;

        function random() {
            seed *= 12421;
            seed -= Math.floor(seed);
            return seed;
        }

        for (var i = 0; i < 33; i++) {
            data.push(random());
        }
        var sorted = data.slice(0).sort(function (a, b) {
            return a - b;
        });

        function checkTopo(tree) {
            var revision = Math.random();

            function testTopo(node, parent, collection) {
                if (node.revision == revision) {
                    expect("Revision").to.be(false);
                }
                node.revision = revision;
                expect(node.parent).to.be(parent);
                if (node.left) {
                    expect(node.left.data).not.to.greaterThan(node.data);
                    testTopo(node.left, node);
                }
                if (node.right) {
                    expect(node.data).not.to.greaterThan(node.right.data);
                    testTopo(node.right, node);
                }
            }

            if (tree.root) {
                testTopo(tree.root, null);
            }
        }

        function checkBlackCount(tree) {
            if (tree.root) {
                var count = null;

                function blackCount(node, depth) {
                    depth += !node.red;
                    if (node.left) {
                        blackCount(node.left, depth);
                    }
                    if (node.right) {
                        blackCount(node.right, depth);
                    }
                    if (!node.left && !node.right) {
                        if (count === null) {
                            count = depth;
                        } else {
                            expect(depth).eql(count);
                        }
                    }
                }

                blackCount(tree.root, 1);
            }
        }

        function getDepth(tree) {
            var maxDepth = 0;

            function updateDepth(node, depth) {
                if (maxDepth < depth) {
                    maxDepth = depth;
                }
                if (node.left) {
                    updateDepth(node.left, depth + 1);
                }
                if (node.right) {
                    updateDepth(node.right, depth + 1);
                }
            }

            if (tree.root) {
                updateDepth(tree.root, 1);
            }
            return maxDepth;
        }

        it("initialize", function () {
            new fast.ds.RedBlackTree();
        });

        it("insert", function () {
            var rbTree = new fast.ds.RedBlackTree(), node;
            for (var i = 0; i < data.length; i++) {
                node = rbTree.insert(data[i]);
                expect(node.data).to.be(data[i]);
            }
            checkTopo(rbTree.root);
            checkBlackCount(rbTree);
        });

        it("search", function () {
            var rbTree = new fast.ds.RedBlackTree();
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                expect(rbTree.search(data[i])).not.to.be(null);
            }

            for (var i = 0; i < 40; i++) {
                expect(rbTree.search(data[i] + 300000)).to.be(null);
            }
            for (var i = 0; i < 40; i++) {
                expect(rbTree.search(data[i] - 300000)).to.be(null);
            }
        });

        it("iterate", function () {
            var rbTree = new fast.ds.RedBlackTree(), i, curr;
            rbTree.insert(data[0]);
            expect(rbTree.first().data).eql(data[0]);
            expect(rbTree.prev(rbTree.first())).to.be(null);
            expect(rbTree.next(rbTree.first())).to.be(null);
            for (i = 1; i < data.length; i++) {
                rbTree.insert(data[i]);
            }
            i = 0;
            rbTree.iterate(function (item, node) {
                if (i < data.length) {
                    expect(node.data).eql(sorted[i]);
                }
                i++;
            });

            for (curr = rbTree.first(), i = 0; curr && i < data.length; curr = rbTree.next(curr), i++) {
                expect(curr.data).eql(sorted[i]);
            }
            expect(i).eql(data.length);
            expect(curr).to.be(null);
            for (curr = rbTree.last(), i = data.length - 1; curr && i < data.length + 10; curr = rbTree.prev(curr), i--) {
                expect(curr.data).eql(sorted[i]);
            }
            expect(curr).to.be(null);
        });

        it("inversed less test", function () {
            var rbTree = new fast.ds.RedBlackTree(function (a, b) {
                return a > b;
            }), i, curr;
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                expect(rbTree.search(data[i])).not.to.be(null);
            }

            for (var i = 0; i < 40; i++) {
                expect(rbTree.search(data[i] + 300000)).to.be(null);
            }
            for (var i = 0; i < 40; i++) {
                expect(rbTree.search(data[i] - 300000)).to.be(null);
            }

            i = 0;
            rbTree.iterate(function (item, node) {
                if (i < data.length) {
                    expect(node.data).eql(sorted[data.length - i - 1]);
                }
                i++;
            });
        });

        it("inexact search", function () {
            var rbTree = new fast.ds.RedBlackTree();
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }
            expect(rbTree.searchMaxSmallerThan(sorted[0])).to.be(null);
            for (var i = 1; i < data.length; i++) {
                expect(rbTree.searchMaxSmallerThan((sorted[i - 1] + sorted[i]) / 2).data).to.eql(sorted[i - 1]);
                expect(rbTree.searchMaxSmallerThan(sorted[i]).data).to.eql(sorted[i - 1]);
                expect(rbTree.searchMinGreaterThan((sorted[i - 1] + sorted[i]) / 2).data).to.eql(sorted[i]);
                expect(rbTree.searchMinGreaterThan(sorted[i - 1]).data).to.eql(sorted[i]);
            }
            expect(rbTree.searchMinGreaterThan(sorted[i - 1])).to.be(null);
        });

        it("remove", function () {
            var rbTree = new fast.ds.RedBlackTree(),
                index = [];
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
                index[i] = i;
            }

            fast.seq.shuffle(index);

            for (i = 0; i < data.length / 2; i++) {
                rbTree.remove(data[index[i]]);
            }
            checkTopo(rbTree);
            for (; i < data.length; i++) {
                rbTree.remove(data[index[i]]);
            }
        });

        it("balance", function () {
            var rbTree = new fast.ds.RedBlackTree();
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            expect(getDepth(rbTree)).to.lessThan(Math.ceil(Math.log(rbTree.length + 1) / Math.log(2) * 2));
            for (var i = 0; i < 30; i++) {
                rbTree.remove(data[i]);
            }
            checkTopo(rbTree);
            checkBlackCount(rbTree);

            for (var i = 0; i < 30; i++) {
                expect(rbTree.search(data[i])).to.be(null);
            }

            for (var i = 0; i < 30; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < 30; i++) {
                expect(rbTree.search(data[i])).not.to.be(null);
            }
            expect(getDepth(rbTree)).to.lessThan(Math.ceil(Math.log(rbTree.length + 1) / Math.log(2) * 2));
        });
    });

    describe("PriorityQueue", function () {
        var data = [1, 3, 3, 4, 4, 2, 4, 5, 6, 7, 11, 25, 23, -3],
            sorted = data.slice(0).sort(function (a, b) {
                return a - b;
            });

        it("initialize", function () {
            var pq = new fast.ds.PriorityQueue(data);
            var arr = pq._arr;
            expect(pq.size()).to.eql(data.length);
            expect(arr.length).to.eql(data.length);
            for (var i = 1; i < arr.length; i++) {
                expect(arr[(i - 1) >> 1]).not.to.greaterThan(arr[i]);
            }


        });

        it("push", function () {
            var pq = new fast.ds.PriorityQueue();
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

        it("pop", function () {
            var pq = new fast.ds.PriorityQueue(data);
            for (var i = 0; pq.size(); i++) {
                expect(pq.size()).to.eql(data.length - i);
                expect(pq.pop()).to.eql(sorted[i]);
            }
            expect(pq.pop()).to.be(undefined);
            pq.push(14);
            expect(pq.pop()).to.eql(14);
        });

        it("peek", function () {
            var pq = new fast.ds.PriorityQueue(data);
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