/**
 *
 * @param data
 * @constructor
 */
function LinkedListNode(data) {
    this.data = data;
    this.next = this.prev = null;
}

LinkedListNode.prototype = {
    data: null,
    prev: null,
    next: null
};

function LinkedList() {

}

LinkedList.prototype = {
    head: null,
    tail: null,
    length: 0,

    push: function (data) {
        if (this.head === null) {
            this.length++;
            return this.head = this.tail = new LinkedListNode(data);
        } else {
            var node = new LinkedListNode(data);
            node.prev = this.tail;
            this.tail.next = node;
            this.tail = node;
            this.length++;
            return node;
        }
    },

    pop: function () {
        var node = this.tail;
        if (node === null) {
            return null;
        } else if (node === this.head) {
            this.head = this.tail = null;
            this.length--;
            return node;
        } else {
            this.tail = node.prev;
            node.prev = null;
            this.tail.next = null;
            this.length--;
            return node;
        }
    },

    shift: function () {
        var node = this.head;
        if (node === null) {
            return null;
        } else if (this.tail === node) {
            this.head = this.tail = null;
            this.length--;
            return node;
        } else {
            this.head = node.next;
            node.next = null;
            this.head.prev = null;
            this.length--;
            return node;
        }
    },

    unshift: function (data) {
        if (this.head === null) {
            this.length++;
            return this.head = this.tail = new LinkedListNode(data);
        } else {
            var node = new LinkedListNode(data);
            node.next = this.head;
            this.head.prev = node;
            this.head = node;
            this.length++;
            return node;
        }
    },

    forEach: function (func) {
        for (var node = this.head, i = 0; node; (node = node.next), i++) {
            func(node.data, i, node, this);
        }
    },

    remove: function (node) {
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
            if (this.head) {
                this.head.prev = null;
            }
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
            if (this.tail) {
                this.tail.next = null;
            }
        }
        node.prev = node.next = null;
        this.length--;
    }
};

exports.LinkedList = LinkedList;
