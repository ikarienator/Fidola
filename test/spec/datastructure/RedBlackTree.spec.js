describe("Data Structure", function () {
    describe("Red-Black Tree", function () {
        it("Insert", function () {
            var Node = fidola.ds.RedBlackTreeNode,
                rbTree = new fidola.ds.RedBlackTree(),
                root = new Node(0),
                left = new Node(1),
                left_right = new Node(2),
                right = new Node(3),
                right_left = new Node(4);
            expect(rbTree.append(root)).to.be(root);
            expect(rbTree.insertBefore(root, left)).to.be(left);
            expect(rbTree.insertAfter(root, right)).to.be(right);
            expect(rbTree.insertBefore(root, left_right)).to.be(left_right);
            expect(rbTree.insertAfter(root, right_left)).to.be(right_left);
            expect(root.left).to.be(left);
            expect(root.right).to.be(right);
            expect(left.left).to.be(null);
            expect(left.right).to.be(left_right);
            expect(right.left).to.be(right_left);
            expect(right.right).to.be(null);
        });
        it("Remove", function () {
            var Node = fidola.ds.RedBlackTreeNode,
                rbTree = new fidola.ds.RedBlackTree(),
                root = new Node(0),
                nodes = [root];

            function ib(node) {
                nodes.push(rbTree.insertBefore(node, new Node(nodes.length)));
            }

            function ia(node, newNode) {
                nodes.push(rbTree.insertAfter(node, new Node(nodes.length)));
            }

            rbTree.append(root);
            ib(root); // 1
            ia(root); // 2
            ib(root); // 3
            ia(root); // 4
            rbTree.removeNode(null); // Test invalid argument
            rbTree.removeNode(nodes[3]);
            expect(root.left).to.be(nodes[1]);
            expect(root.right).to.be(nodes[2]);
            expect(nodes[1].left).to.be(null);
            expect(nodes[1].right).to.be(null);
            expect(nodes[2].left).to.be(nodes[4]);
            expect(nodes[2].right).to.be(null);
        });
        it("Swap", function () {
            var Node = fidola.ds.RedBlackTreeNode,
                rbTree = new fidola.ds.RedBlackTree(),
                index = [],
                root = new Node(0),
                l = new Node(1),
                r = new Node(2),
                ll = new Node(3),
                rr = new Node(4);
            rbTree.prepend(root);
            rbTree.prepend(l);
            rbTree.append(r);
            rbTree.prepend(ll);
            rbTree.append(rr);
            expect(root.left).to.be(l);
            expect(root.right).to.be(r);
            expect(l.left).to.be(ll);
            expect(l.right).to.be(null);
            expect(r.left).to.be(null);
            expect(r.right).to.be(rr);
            rbTree.swap(l, r);
            expect(root.left).to.be(r);
            expect(root.right).to.be(l);
            expect(r.left).to.be(ll);
            expect(r.right).to.be(null);
            expect(l.left).to.be(null);
            expect(l.right).to.be(rr);
            rbTree.swap(l, r);
            expect(root.left).to.be(l);
            expect(root.right).to.be(r);
            expect(l.left).to.be(ll);
            expect(l.right).to.be(null);
            expect(r.left).to.be(null);
            expect(r.right).to.be(rr);
            rbTree.swap(l, root);
            expect(l.left).to.be(root);
            expect(l.right).to.be(r);
            expect(root.left).to.be(ll);
            expect(root.right).to.be(null);
            expect(r.left).to.be(null);
            expect(r.right).to.be(rr);
        });
    });
});