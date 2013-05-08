/**
 * Immutable array is a single linked list widely
 * used in functional language.
 * @param {Object} head
 * @param {ImmutableArray?} tail
 * @constructor
 */
function ImmutableArray(head, tail) {
    var length = 1;
    if (tail instanceof ImmutableArray) {
        length = tail.length() + 1;
    } else {
        tail = null;
    }
    this.length = function () {
        return length;
    };
    this.tail = function () {
        return tail;
    };
    this.head = function () {
        return head;
    }
}
/**
 *
 * @param arr
 * @param el
 * @returns {ImmutableArray}
 * @private
 */
function concatFoldRight_(el, arr) {
    return new ImmutableArray(el, arr);
}

ImmutableArray.prototype = {
    clone: function () {
        return this.foldRight(null, concatFoldRight_);
    },

    /**
     * Concat two lists.
     * @param array
     * @returns {ImmutableArray}
     */
    concat: function (array) {
        return this.foldRight(array, concatFoldRight_);
    },

    get: function (n) {
        if (n == 0) {
            return this.head();
        } else if (n < 0 || this.tail() === null) {
            return null;
        } else {
            return this.tail().get(n - 1);
        }
    },
    /**
     * Returns func(...func(func(init, get(0)), get(1)), get(2))... get(n))...).
     * @param {*} z
     * @param {function(res:*, el:*):*} func
     * @returns {*}
     */
    foldLeft: function (z, func) {
        var arr = this;
        while (arr) {
            z = func(z, arr.head());
            arr = arr.tail();
        }
        return z;
    },

    /**
     * Returns: func(get(0), func(get(1), func(get(2), ... get(n), init))...).
     * @param {*} z
     * @param {function(el:*, res:*):*} func
     */
    foldRight: function (z, func) {
        var stack = [], arr = this;
        while (arr) {
            stack.push(arr.head());
            arr = arr.tail();
        }
        while (stack.length) {
            var el = stack.pop();
            z = func(el, z);
        }
        return z;
    },

    map: function (func) {
        return this.foldRight(null, function (el, res) {
            return new ImmutableArray(func(el), res);
        });
    },


    filter: function (func) {
        return this.foldRight(null, function (el, res) {
            if (func(el)) {
                return new ImmutableArray(el, res);
            } else {
                return res;
            }
        });
    }
};


exports.ImmutableArray = ImmutableArray;
