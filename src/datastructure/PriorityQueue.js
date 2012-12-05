function PriorityQueue(values, orderTest) {
    if (orderTest === undefined) {
        orderTest = function (a, b) {
            return a < b;
        }
    }
    this._lessTest = orderTest;

    if (values !== undefined) {
        this._arr = values.slice(0);
        var arr = this._arr, i, ln = arr.length, parent;
        for (i = ln - 1; i >= 0; i--) {
            this._down(i);
        }
    } else {
        this._arr = [];
    }
}

PriorityQueue.prototype = {
    _up: function (k) {
        var arr = this._arr,
            value = arr[k],
            orderTest = this._lessTest,
            parent;
        do {
            parent = (k - 1) >> 1;
            if (orderTest(value, arr[parent])) {
                arr[k] = arr[parent];
                k = parent;
            } else {
                break;
            }
        } while (k > 0);
        arr[k] = value;
    },

    /**
     *
     * @param {Number} k
     * @private
     */
    _down: function (k) {
        var arr = this._arr,
            orderTest = this._lessTest,
            value = arr[k],
            left, right,
            ln = arr.length;
        do {
            left = k * 2 + 1;
            right = k * 2 + 2;
            if (right >= ln) {
                // No right child
                if (left < ln) {
                    if (orderTest(arr[left], value)) {
                        arr[k] = arr[left];
                        k = left;
                    }
                }
                break;
            } else {
                if (orderTest(arr[left], arr[right])) {
                    if (orderTest(arr[left], value)) {
                        arr[k] = arr[left];
                        k = left;
                    } else {
                        // k is in the right place
                        break;
                    }
                } else if (orderTest(arr[right], value)) {
                    arr[k] = arr[right];
                    k = right;
                } else {
                    // k is in the right place
                    break;
                }
            }
        } while (true);
        arr[k] = value;
    },

    push: function (el) {
        var arr = this._arr;
        if (arguments.length > 1) {
            for (var i = 0; i < arguments.length; i++) {
                arr.push(arguments[i]);
                this._up(arr.length - 1);
            }
        } else if (arr.length === 0) {
            arr.push(el);
        } else {
            arr.push(el);
            this._up(arr.length - 1);
        }
    },

    peek: function () {
        return this._arr[0];
    },

    pop: function () {
        var arr = this._arr,
            value = arr[0];
        if (arr.length > 1) {
            arr[0] = arr[arr.length - 1];
            arr.length--;
            this._down(0);
        } else {
            arr.length = 0;
        }
        return value;
    },

    remove: function (data) {
        var arr = this._arr,
            i = -1, ln = arr.length - 1;
        if (ln === 0) {
            return false;
        } else if (arr[ln] === data) {
            arr.length--;
            return true;
        } else {
            while (i++ < ln) {
                if (arr[i] === data) {
                    arr[i] = arr[ln];
                    arr.length--;
                    this._down(i);
                    return true;
                }
            }
        }
        return false;
    },

    size: function () {
        return this._arr.length;
    }
};

fast.ds.PriorityQueue = PriorityQueue;