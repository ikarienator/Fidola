describe("Data Structure", function () {
    describe("Binary Search Tree", function () {
        var data = [],
            seed = 1.17;

        function random() {
            seed *= 12.521;
            seed -= Math.floor(seed);
            return seed;
        }

        for (var i = 0; i < 80; i++) {
            data.push(i);
        }
        fast.seq.shuffle(data, random);
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
            checkBlackCount(tree);
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

        it("Initialize", function () {
            new fast.ds.RedBlackTree();
            new fast.ds.BinarySearchTree();
        });

        it("Insert", function () {
            var bst = new fast.ds.BinarySearchTree(), node;
            for (var i = 0; i < data.length; i++) {
                checkTopo(bst);
                node = bst.insert(data[i]);
                if (i % 30 == 0) {
                    if (node.data !== data[i]) {
                        expect(node.data).to.be(data[i]);
                    }
                }
            }
            checkTopo(bst);
            checkBlackCount(bst);
        });

        it("Search", function () {
            var bst = new fast.ds.BinarySearchTree();
            for (var i = 0; i < data.length; i++) {
                bst.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                if (bst.search(data[i]) === null) {
                    expect(bst.search(data[i])).not.to.be(null);
                }
            }

            for (var i = 0; i < 40; i++) {
                if (bst.search(data[i] + 300000) !== null) {
                    expect(bst.search(data[i] + 300000)).to.be(null);
                }
            }
            for (var i = 0; i < 40; i++) {
                if (bst.search(data[i] - 300000) !== null) {
                    expect(bst.search(data[i] - 300000)).to.be(null);
                }
            }
        });

        it("Iterate", function () {
            var bst = new fast.ds.BinarySearchTree(), i, curr;

            i = 0;
            bst.iterate(function (item, node) {
                if (i < data.length) {
                    if (node.data != sorted[i]) {
                        expect(node.data).eql(sorted[i]);
                    }
                }
                i++;
            });
            expect(i).to.be(0);

            bst.insert(data[0]);
            expect(bst.first().data).eql(data[0]);
            expect(bst.prev(bst.first())).to.be(null);
            expect(bst.next(bst.first())).to.be(null);
            for (i = 1; i < data.length; i++) {
                bst.insert(data[i]);
            }
            i = 0;
            bst.iterate(function (item, node) {
                if (i < data.length) {
                    if (node.data != sorted[i]) {
                        expect(node.data).eql(sorted[i]);
                    }
                }
                i++;
            });

            for (curr = bst.first(), i = 0; curr && i < data.length; curr = bst.next(curr), i++) {
                if (curr.data != sorted[i]) {
                    expect(curr.data).eql(sorted[i]);
                }
            }
            expect(i).eql(data.length);
            expect(curr).to.be(null);
            for (curr = bst.last(), i = data.length - 1; curr && i < data.length + 10; curr = bst.prev(curr), i--) {
                if (curr.data != sorted[i]) {
                    expect(curr.data).eql(sorted[i]);
                }
            }
            expect(curr).to.be(null);
        });

        it("Inverted less test", function () {
            var bst = new fast.ds.BinarySearchTree(function (a, b) {
                return a > b;
            }), i, curr;
            for (var i = 0; i < data.length; i++) {
                bst.insert(data[i]);
            }

            for (var i = 0; i < data.length; i++) {
                if (bst.search(data[i]) === null) {
                    expect(bst.search(data[i])).not.to.be(null);
                }
            }

            for (var i = 0; i < 40; i++) {
                if (bst.search(data[i] + 300000) !== null) {
                    expect(bst.search(data[i] + 300000)).to.be(null);
                }
            }
            for (var i = 0; i < 40; i++) {
                if (bst.search(data[i] - 300000) !== null) {
                    expect(bst.search(data[i] - 300000)).to.be(null);
                }
            }

            i = 0;
            bst.iterate(function (item, node) {
                if (i < data.length) {
                    if (node.data != sorted[data.length - i - 1]) {
                        expect(node.data).eql(sorted[data.length - i - 1]);
                    }
                }
                i++;
            });
        });

        it("Inexact search", function () {
            var bst = new fast.ds.BinarySearchTree();
            var node;
            for (var i = 0; i < data.length; i++) {
                bst.insert(data[i]);
            }
            node = bst.searchMaxSmallerThan(sorted[0]);
            if (node === null) {
                expect(node).to.be(null);
            }
            for (var i = 1; i < data.length; i++) {
                node = bst.searchMaxSmallerThan((sorted[i - 1] + sorted[i]) / 2);
                if (node.data != sorted[i - 1]) {
                    expect(node.data).to.eql(sorted[i - 1]);
                }
                node = bst.searchMaxSmallerThan(sorted[i]);
                if (node.data != sorted[i - 1]) {
                    expect(node.data).to.eql(sorted[i - 1]);
                }
                node = bst.searchMinGreaterThan((sorted[i - 1] + sorted[i]) / 2);
                if (node.data != sorted[i]) {
                    expect(node.data).to.eql(sorted[i]);
                }
                node = bst.searchMinGreaterThan(sorted[i - 1]);
                if (node.data != sorted[i]) {
                    expect(node.data).to.eql(sorted[i]);
                }
            }
            expect(bst.searchMinGreaterThan(sorted[i - 1])).to.be(null);
        });

        it("Remove", function () {
            var bst = new fast.ds.BinarySearchTree(),
                index = [];
            bst.remove(data[0]);
            for (var i = 0; i < data.length; i++) {
                bst.insert(data[i]);
                index[i] = i;
                checkTopo(bst);
            }

            fast.seq.shuffle(index);

            for (i = 0; i < data.length / 2; i++) {
                bst.remove(data[index[i]]);
                checkTopo(bst);
            }
            checkTopo(bst);
            for (; i < data.length; i++) {
                bst.remove(data[index[i]]);
                checkTopo(bst);
            }
        });

        it("Balance", function () {
            var bst = new fast.ds.BinarySearchTree(),
                n = Math.min(data.length, 30);
            for (var i = 0; i < data.length; i++) {
                bst.insert(data[i]);
                checkTopo(bst);
            }

            expect(getDepth(bst)).to.lessThan(Math.ceil(Math.log(bst.length + 1) / Math.log(2) * 2));
            for (var i = 0; i < n; i++) {
                bst.remove(data[i]);
                checkTopo(bst);
            }
            checkTopo(bst);
            checkBlackCount(bst);

            for (var i = 0; i < n; i++) {
                if (bst.search(data[i]) !== null) {
                    expect(bst.search(data[i])).to.be(null);
                }
            }

            for (var i = 0; i < n; i++) {
                bst.insert(data[i]);
                checkTopo(bst);
            }

            for (var i = 0; i < n; i++) {
                if (bst.search(data[i]) === null) {
                    expect(bst.search(data[i])).not.to.be(null);
                }
            }
            expect(getDepth(bst)).to.lessThan(Math.ceil(Math.log(bst.length + 1) / Math.log(2) * 2));
        });
    });
});