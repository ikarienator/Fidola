describe("Data Structure", function () {
    describe("Red-Black Tree", function () {
        var data = [],
            seed = 1.15;

        function random() {
            seed *= 124.21;
            seed -= Math.floor(seed);
            return seed;
        }

        for (var i = 0; i < 20; i++) {
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
                if (node.parent != parent) {
                    expect(node.parent).to.be(parent);
                }
                var count = 1;
                if (node.left) {
                    count += node.left.count;
                    if (node.left.data > node.data) {
                        expect(node.left.data).not.to.greaterThan(node.data);
                    }
                    testTopo(node.left, node);
                }
                if (node.right) {
                    count += node.right.count;
                    if (node.data > node.right.data) {
                        expect(node.data).not.to.greaterThan(node.right.data);
                    }
                    testTopo(node.right, node);
                }
                if (count != node.count) {
                    expect(node.count).to.be(count);
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
                            if (depth != count) {
                                expect(depth).eql(count);
                            }
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
            new fast.ds.BinarySearchTree();
        });

        it("insert", function () {
            var rbTree = new fast.ds.BinarySearchTree(), node;
            for (var i = 0; i < data.length; i++) {
                checkTopo(rbTree);
                node = rbTree.insert(data[i]);
                if (i % 30 == 0) {
                    if (node.data !== data[i]) {
                        expect(node.data).to.be(data[i]);
                    }
                }
            }
            checkTopo(rbTree);
            checkBlackCount(rbTree);
        });

        it("search", function () {
            var rbTree = new fast.ds.BinarySearchTree();
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                if (rbTree.search(data[i]) === null) {
                    expect(rbTree.search(data[i])).not.to.be(null);
                }
            }

            for (var i = 0; i < 40; i++) {
                if (rbTree.search(data[i] + 300000) !== null) {
                    expect(rbTree.search(data[i] + 300000)).to.be(null);
                }
            }
            for (var i = 0; i < 40; i++) {
                if (rbTree.search(data[i] - 300000) !== null) {
                    expect(rbTree.search(data[i] - 300000)).to.be(null);
                }
            }
        });

        it("iterate", function () {
            var rbTree = new fast.ds.BinarySearchTree(), i, curr;

            i = 0;
            rbTree.iterate(function (item, node) {
                if (i < data.length) {
                    if (node.data != sorted[i]) {
                        expect(node.data).eql(sorted[i]);
                    }
                }
                i++;
            });
            expect(i).to.be(0);
            
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
                    if (node.data != sorted[i]) {
                        expect(node.data).eql(sorted[i]);
                    }
                }
                i++;
            });

            for (curr = rbTree.first(), i = 0; curr && i < data.length; curr = rbTree.next(curr), i++) {
                if (curr.data != sorted[i]) {
                    expect(curr.data).eql(sorted[i]);
                }
            }
            expect(i).eql(data.length);
            expect(curr).to.be(null);
            for (curr = rbTree.last(), i = data.length - 1; curr && i < data.length + 10; curr = rbTree.prev(curr), i--) {
                if (curr.data != sorted[i]) {
                    expect(curr.data).eql(sorted[i]);
                }
            }
            expect(curr).to.be(null);
        });

        it("inversed less test", function () {
            var rbTree = new fast.ds.BinarySearchTree(function (a, b) {
                return a > b;
            }), i, curr;
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                if (rbTree.search(data[i]) === null) {
                    expect(rbTree.search(data[i])).not.to.be(null);
                }
            }

            for (var i = 0; i < 40; i++) {
                if (rbTree.search(data[i] + 300000) !== null) {
                    expect(rbTree.search(data[i] + 300000)).to.be(null);
                }
            }
            for (var i = 0; i < 40; i++) {
                if (rbTree.search(data[i] - 300000) !== null) {
                    expect(rbTree.search(data[i] - 300000)).to.be(null);
                }
            }

            i = 0;
            rbTree.iterate(function (item, node) {
                if (i < data.length) {
                    if (node.data != sorted[data.length - i - 1]) {
                        expect(node.data).eql(sorted[data.length - i - 1]);
                    }
                }
                i++;
            });
        });

        it("inexact search", function () {
            var rbTree = new fast.ds.BinarySearchTree();
            var node;
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }
            node = rbTree.searchMaxSmallerThan(sorted[0]);
            if (node === null) {
                expect(node).to.be(null);
            }
            for (var i = 1; i < data.length; i++) {
                node = rbTree.searchMaxSmallerThan((sorted[i - 1] + sorted[i]) / 2);
                if (node.data != sorted[i - 1]) {
                    expect(node.data).to.eql(sorted[i - 1]);
                }
                node = rbTree.searchMaxSmallerThan(sorted[i]);
                if (node.data != sorted[i - 1]) {
                    expect(node.data).to.eql(sorted[i - 1]);
                }
                node = rbTree.searchMinGreaterThan((sorted[i - 1] + sorted[i]) / 2);
                if (node.data != sorted[i]) {
                    expect(node.data).to.eql(sorted[i]);
                }
                node = rbTree.searchMinGreaterThan(sorted[i - 1]);
                if (node.data != sorted[i]) {
                    expect(node.data).to.eql(sorted[i]);
                }
            }
            expect(rbTree.searchMinGreaterThan(sorted[i - 1])).to.be(null);
        });

        it("remove", function () {
            var rbTree = new fast.ds.BinarySearchTree(),
                index = [];
            rbTree.remove(data[0]);
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
            var rbTree = new fast.ds.BinarySearchTree(),
                n = Math.min(data.length, 30);
            for (var i = 0; i < data.length; i++) {
                rbTree.insert(data[i]);
            }

            expect(getDepth(rbTree)).to.lessThan(Math.ceil(Math.log(rbTree.length + 1) / Math.log(2) * 2));
            for (var i = 0; i < n; i++) {
                rbTree.remove(data[i]);
            }
            checkTopo(rbTree);
            checkBlackCount(rbTree);

            for (var i = 0; i < n; i++) {
                if (rbTree.search(data[i]) !== null) {
                    expect(rbTree.search(data[i])).to.be(null);
                }
            }

            for (var i = 0; i < n; i++) {
                rbTree.insert(data[i]);
            }

            for (var i = 0; i < n; i++) {
                if (rbTree.search(data[i]) === null) {
                    expect(rbTree.search(data[i])).not.to.be(null);
                }
            }
            expect(getDepth(rbTree)).to.lessThan(Math.ceil(Math.log(rbTree.length + 1) / Math.log(2) * 2));
        });
    });

    describe("BinaryHeap", function () {
        var data = [1, 3, 3, 4, 4, 2, 4, 5, 6, 7, 11, 25, 23, -3],
            sorted = data.slice(0).sort(function (a, b) {
                return a - b;
            });

        it("initialize", function () {
            var pq = new fast.ds.BinaryHeap(data);
            var arr = pq._arr;
            expect(pq.size()).to.eql(data.length);
            expect(arr.length).to.eql(data.length);
            for (var i = 1; i < arr.length; i++) {
                expect(arr[(i - 1) >> 1]).not.to.greaterThan(arr[i]);
            }


        });

        it("push", function () {
            var pq = new fast.ds.BinaryHeap();
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

        it("remove", function () {
            var pq = new fast.ds.BinaryHeap(data),
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

        it("pop", function () {
            var pq = new fast.ds.BinaryHeap(data);
            for (var i = 0; pq.size(); i++) {
                expect(pq.size()).to.eql(data.length - i);
                expect(pq.pop()).to.eql(sorted[i]);
            }
            expect(pq.pop()).to.be(undefined);
            pq.push(14);
            expect(pq.pop()).to.eql(14);
        });

        it("peek", function () {
            var pq = new fast.ds.BinaryHeap(data);
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