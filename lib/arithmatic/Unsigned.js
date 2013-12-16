/**
 * Arbitrary long unsigned (natural) number.
 * @param {Array} [array]
 * The element size is 0 to LIMB_BITMASK
 * @constructor
 */
function Unsigned(array) {
    // 0 .. LIMB_BITMASK to avoid overflow in multiplication
    this.array = array || [];
}

Unsigned.DIGITS = "0123456789";

var numeric = require("../numeric/FastFourierTransform.js"),
    fft = numeric.fft,
    ifft = numeric.ifft,
    LIMB_DEPTH = 15,
    LIMB_BITMASK = 32767;

Unsigned.from = function (number) {
    if (number instanceof Unsigned) {
        return number;
    }
    if (typeof number === 'number') {
        return Unsigned.fromNumber(number);
    }
    return Unsigned.fromString(number.toString());
};

/**
 *
 * @param {Number} number
 * @return {Unsigned}
 */
Unsigned.fromNumber = function (number) {
    if (number < 0) {
        throw new Error('Failed to convert negative number to unsigned integer.');
    }
    var array = [], i = 0;
    while (number) {
        array[i++] = number & LIMB_BITMASK;
        number >>= LIMB_DEPTH;
    }
    return new Unsigned(array);
};

/**
 *
 * @param {String} string
 * @return {Unsigned}
 */
Unsigned.fromString = function (string) {
    var integer = new Unsigned(),
        length = string.length;
    if (!string.match(/^[0-9]*$/)) {
        throw new Error('Malformed integer string.');
    }
    for (var i = length % 4; i <= length; i += 4) {
        integer._mult_assign_1(10000);
        integer._plus_assign_1(+string.substring(Math.max(0, i - 4), i));
    }
    integer.normalize();
    return integer;
};

var MPN_proto = Unsigned.prototype;

/**
 * Clone the current integer
 * @return {Unsigned}
 */
MPN_proto.clone = function () {
    var result = new Unsigned();
    result.array = this.array.slice(0);
    return result;
};

/**
 * To string
 * @return {String}
 */
MPN_proto.toString = function () {
    this.normalize();
    if (this.array.length === 0) {
        return '0';
    } else if (this.array.length === 1) {
        return this.array[0].toString();
    }
    var result = this.getDigits(10000), i, j, a, b,
        digits = Unsigned.DIGITS;
    for (i = 0, j = result.length - 1; i < j; i++, j--) {
        a = result[i];
        b = result[j];
        result[j] = digits[a / 1000 >> 0] + digits[a / 100 % 10 >> 0] + digits[a / 10 % 10 >> 0] + digits[a % 10];
        result[i] = digits[b / 1000 >> 0] + digits[b / 100 % 10 >> 0] + digits[b / 10 % 10 >> 0] + digits[b % 10];
    }
    if (i === j) {
        a = result[i];
        result[i] = digits[a / 1000 >> 0] + digits[a / 100 % 10 >> 0] + digits[a / 10 % 10 >> 0] + digits[a % 10];
    }
    result[0] = +result[0];
    return result.join('');
};

/**
 * Get digits from big integer.
 * @param base
 * @return {Array}
 */
MPN_proto.getDigits = function (base) {
    var array, result, num;
    if (base == LIMB_BITMASK + 1) {
        return this.array.slice(0);
    } else if (base == 32) {
        array = this.array;
        result = [];
        result.length = array.length * 3;
        for (i = 0; i < array.length; i++) {
            num = array[i];
            result[i * 3] = num & 31;
            result[i * 3 + 1] = (num >> 5) & 31;
            result[i * 3 + 2] = (num >> 10) & 31;
        }
    } else if (base == 8) {
        array = this.array;
        result = [];
        result.length = array.length * 5;
        for (i = 0; i < array.length; i++) {
            num = array[i];
            result[i * 5] = num & 7;
            result[i * 5 + 1] = (num >> 3) & 7;
            result[i * 5 + 2] = (num >> 6) & 7;
            result[i * 5 + 3] = (num >> 9) & 7;
            result[i * 5 + 4] = (num >> 12) & 7;
        }
    } else {
        array = this.array.slice();
        if (array.length > 80) {
            return this._base_convert_huge(base);
        }
        result = [];
        while (array.length > 0) {
            for (var i = array.length - 1, carry = 0; i >= 0; i--) {
                array[i] += carry << LIMB_DEPTH;
                carry = array[i] % base;
                array[i] /= base;
                array[i] >>= 0;
            }
            while (array.length > 0 && array[array.length - 1] === 0) {
                array.length--;
            }
            result.push(carry);
        }
    }
    while (result.length > 0 && result[result.length - 1] === 0) {
        result.length--;
    }
    return result;
};

MPN_proto._base_convert_huge = function (base) {
    var num = Unsigned.from(base);
    var i = 1;
    while (true) {
        var num2 = num.clone();
        num2.sqrAssign();
        if (num2.cmp(this) > 0) {
            break;
        }
        num = num2;
        i <<= 1;
    }
    var qr = this.divMod(num);
    var head = qr[0].getDigits(base);
    var tail = qr[1].getDigits(base);
    while (tail.length < i) {
        tail[tail.length] = 0;
    }
    return tail.concat(head);
};

/**
 * Recalculate carry and shrink the size of the array.
 * @return {Unsigned}
 */
MPN_proto.normalize = function () {
    var array = this.array,
        len = array.length,
        carry = 0;
    for (var i = 0; i < len; i++) {
        carry += array[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (array.length > 0 && array[array.length - 1] === 0) {
        array.length--;
    }
    return this;
};

MPN_proto._resize = function (length) {
    var array = this.array, i = array.length;
    array.length = length;
    for (; i < length; i++) {
        array[i] = 0;
    }
};

MPN_proto.isZero = function () {
    return this.array.length == 0;
};

MPN_proto.isEven = function () {
    return this.isZero() || ((this.array[0] & 1) === 0);
};

MPN_proto.isOdd = function () {
    return !this.isEven();
};

/**
 *
 * @param {Number|Unsigned} num
 * @return {Number}
 */
MPN_proto.cmp = function (num) {
    return this._cmp_offset_a(num.array, 0);
};

/**
 *
 * @param {Array} array
 * @param {Number} offset
 * @return {Number}
 * @private
 */
MPN_proto._cmp_offset_a = function (array, offset) {
    if (this.array.length + offset != array.length) {
        return this.array.length + offset > array.length ? 1 : -1;
    }
    for (var i = this.array.length - 1; i >= 0; i--) {
        if (this.array[i] != array[i + offset]) {
            return this.array[i] > array[i + offset] ? 1 : -1;
        }
    }
    return 0;
};

/**
 * "operator <<="
 * @param {Number} bits
 * @return {Number} this
 */
MPN_proto.shiftLeftAssign = function (bits) {
    var array = this.array, len = array.length, i, block_shift = 0;
    if (bits >= LIMB_DEPTH) {
        block_shift = bits / LIMB_DEPTH >> 0;
        bits %= LIMB_DEPTH;
    }
    if ((array[len - 1] << bits) >= 1 << LIMB_DEPTH) {
        array[len++] = 0;
    }
    array.length += block_shift;
    for (i = len - 1; i > 0; i--) {
        array[i + block_shift] = ((array[i] << bits) | (array[i - 1] >> (LIMB_DEPTH - bits))) & LIMB_BITMASK;
    }
    array[block_shift] = (array[0] << bits) & LIMB_BITMASK;
    for (i = 0; i < block_shift; i++) {
        array[i] = 0;
    }
    return this;
};

/**
 * "operator+="
 * Add a number to the current one.
 * @param {Number|Unsigned} num
 */
MPN_proto.plusAssign = function (num) {
    if (typeof num === 'number') {
        return this._plus_assign_1(num);
    } else {
        return this._plus_assign_bi(Unsigned.from(num));
    }
};

/**
 * "operator+"
 * Add two numbers.
 *
 * @param num
 * @returns {*}
 */
MPN_proto.plus = function (num) {
    return this.clone().plusAssign(num);
};

/**
 * "operator-="
 * Substract a number from the current one.
 * @param {Number|Unsigned} num
 */
MPN_proto.minusAssign = function (num) {
    if (typeof num === 'number') {
        return this._minus_assign_1(num);
    } else {
        return this._minus_assign_bi(Unsigned.from(num));
    }
};
/**
 * "operator-"
 * Substract two numbers.
 * @param num
 * @returns {*}
 */
MPN_proto.minus = function (num) {
    return this.clone().minusAssign(num);
};

/**
 * @private
 * Add num to this.
 * @param {Unsigned} num
 */
MPN_proto._plus_assign_bi = function (num) {
    var i, carry = 0,
        array = this.array,
        len = array.length,
        array2 = num.array,
        len2 = array2.length;
    if (len < len2) {
        while (len < len2) {
            array[len++] = 0;
        }
    }
    for (i = 0, carry; i < len2; i++) {
        carry += array[i] + array2[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        if (i >= len) {
            array[i] = 0;
        }
        array[i] += carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
        i++;
    }
    return this;
};

/**
 * @private
 * Add num to this.
 * @param {Number} num
 */
MPN_proto._plus_assign_1 = function (num) {
    var array = this.array,
        len = array.length;
    for (var i = 0, carry = num; carry && i < len; i++) {
        carry += array[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    return this;
};

/**
 * @private
 * @param {Unsigned} num a BigInteger whose absolute value is smaller than `this`
 */
MPN_proto._minus_assign_1 = function (num) {
    var array = this.array,
        i = 0, carry = -num;
    while (carry) {
        carry += array[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    return this;
};


/**
 * @private
 * @param {Unsigned} num a BigInteger that is smaller than `this`
 */
MPN_proto._minus_assign_bi = function (num) {
    var array = this.array,
        array2 = num.array,
        len2 = array2.length,
        i, carry = 0;
    for (i = 0, carry; i < len2; i++) {
        carry += array[i] - array2[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        carry += array[i];
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (array.length && array[array.length - 1] === 0) {
        array.length--;
    }
    return this;
};

/**
 * "operator*="
 * Multiply a number to the current one.
 * @param {Number|Unsigned} num
 */
MPN_proto.multAssign = function (num) {
    if (this.array.length == 0) {
        return this;
    }
    if (typeof num === 'number') {
        if (num == 0) {
            this.array.length = 0;
            return this;
        }
        return this._mult_assign_1(num);
    } else {
        return this._mult_assign_bi(Unsigned.from(num));
    }
};

MPN_proto.mult = function (num) {
    return this.clone().multAssign(num);
};

MPN_proto.sqrAssign = function () {
    var maxlen = _nextpo2(this.array.length) << 1;
    if (this.array.length * this.array.length > 45 * maxlen * Math.log(maxlen)) {
        return this._sqr_assign_huge();
    } else {
        this._mult_assign_bi(this);
    }
    return this;
};

function _nextpo2(v) {
    v--;
    v |= v >> 1;
    v |= v >> 2;
    v |= v >> 4;
    v |= v >> 8;
    v |= v >> 16;
    v |= v >> 32;
    v++;
    return v;
}

/**
 * @private
 * @param {Unsigned} num
 */
MPN_proto._mult_assign_bi = function (num) {
    if (num.array.length == 0 || this.array.length == 0) {
        this.array.length = 0;
        return this;
    }
    if (num.array.length == 1) {
        return this._mult_assign_1(num.array[0]);
    }
    var maxlen = _nextpo2(num.array.length + this.array.length);
    if (num.array.length * this.array.length > 45 * maxlen * Math.log(maxlen)) {
        return this._mult_assign_huge(num);
    }
    var array = this.array.slice(0),
        len = array.length,
        array2 = num.array,
        len2 = array2.length, i, j,
        outlen = len + len2 - 1,
        carry,
        target = [],
        left;
    target.length = outlen;
    for (i = 0; i < outlen; i++) {
        target[i] = 0;
    }
    for (i = 0; i < len; i++) {
        left = array[i];
        if (left > 0) {
            for (j = 0, carry = 0; j < len2; j++) {
                carry += target[i + j] + left * array2[j];
                target[i + j] = carry & LIMB_BITMASK;
                carry >>= LIMB_DEPTH;
            }
            while (carry) {
                if (i + j >= target.length) {
                    target[i + j] = 0;
                }
                carry += target[i + j];
                target[i + j] = carry & LIMB_BITMASK;
                carry >>= LIMB_DEPTH;
            }
        }
    }
    this.array = target;
    this.normalize();
    return this;
};

/**
 * @private
 * @param {Number} num
 */
MPN_proto._mult_assign_1 = function (num) {
    num >>= 0;
    var array = this.array,
        len = array.length;
    for (var i = 0, carry = 0; i < len; i++) {
        carry += array[i] * num;
        array[i] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    return this;
};

/**
 * @private
 * Multiply numbers using FFT.
 * @param {Unsigned} num
 * @return {Unsigned}
 */
MPN_proto._mult_assign_huge = function (num) {
    if (num === this) {
        return this._sqr_assign_huge();
    }
    var array = this.array,
        array2 = num.array,
        maxlen = _nextpo2(array.length * 3 + array2.length * 3),
        elements = maxlen * 2,
        carry, j, n,
        ta1 = new Float64Array(elements),
        ta2 = new Float64Array(elements);

    ta1.set(array, 0);
    ta2.set(array2, 0);
    for (i = array.length; i >= 0; i--) {
        ta1[i * 6 + 5] = 0;
        ta1[i * 6 + 4] = (ta1[i] >> 10) & 31;
        ta1[i * 6 + 3] = 0;
        ta1[i * 6 + 2] = (ta1[i] >> 5) & 31;
        ta1[i * 6 + 1] = 0;
        ta1[i * 6] = ta1[i] & 31;
    }
    for (i = array2.length; i >= 0; i--) {
        ta2[i * 6 + 5] = 0;
        ta2[i * 6 + 4] = (ta2[i] >> 10) & 31;
        ta2[i * 6 + 3] = 0;
        ta2[i * 6 + 2] = (ta2[i] >> 5) & 31;
        ta2[i * 6 + 1] = 0;
        ta2[i * 6] = ta2[i] & 31;
    }
    fft(ta1, maxlen);
    fft(ta2, maxlen);
    var i,
        re;
    for (i = 0; i < elements; i += 2) {
        re = ta1[i] * ta2[i] - ta1[i + 1] * ta2[i + 1];
        ta1[i + 1] = ta1[i] * ta2[i + 1] + ta1[i + 1] * ta2[i];
        ta1[i] = re;
    }
    ifft(ta1, maxlen);
    array.length = 0;
    carry = 0;
    for (i = 0, j = 0, n = elements - 6; i < n; j++, i += 6) {
        carry += Math.round(ta1[i]) + (Math.round(ta1[i + 2]) << 5) + (Math.round(ta1[i + 4]) << 10);
        array[j] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    for (; i < elements; j++, i += 6) {
        carry += Math.round(ta1[i]);
        if (i + 2 < elements) {
            carry += Math.round(ta1[i + 2]) << 5;
            if (i + 4 < elements) {
                carry += Math.round(ta1[i + 4]) << 10;
            }
        }
        array[j] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[j++] = carry & LIMB_BITMASK;
        carry >>= LIMB_DEPTH;
    }
    while (array.length && array[array.length - 1] === 0) {
        array.length--;
    }
    return this;
};

MPN_proto._sqr_assign_huge = function () {
    var array = this.array,
        maxlen = _nextpo2(this.array.length * 6),
        carry, j,
        ta = new Float64Array(maxlen * 2);

    for (i = 0; i < array.length; i++) {
        ta[i * 6] = array[i] & 31;
        ta[i * 6 + 2] = (array[i] >> 5) & 31;
        ta[i * 6 + 4] = (array[i] >> 10) & 31;
    }
    fft(ta, maxlen);
    var i,
        len = ta.length,
        re;
    for (i = 0; i < len; i += 2) {
        re = ta[i] * ta[i] - ta[i + 1] * ta[i + 1];
        ta[i + 1] *= 2 * ta[i];
        ta[i] = re;
    }
    ifft(ta, maxlen);
    array.length = 0;
    for (i = 0, carry = 0, j = 0; i < maxlen; j++) {
        carry += Math.round(ta[i << 1]);
        array[j] = carry & 31;
        carry >>= 5;
        i++;
        if (i >= maxlen) {
            break;
        }
        carry += Math.round(ta[i << 1]);
        array[j] |= (carry & 31) << 5;
        carry >>= 5;
        i++;
        if (i >= maxlen) {
            break;
        }
        carry += Math.round(ta[i << 1]);
        array[j] |= (carry & 31) << 10;
        carry >>= 5;
        i++;
    }
    while (carry) {
        array[j] = carry & 31;
        carry >>= 5;
        i++;
        if (carry == 0) {
            break;
        }
        array[j] |= (carry & 31) << 5;
        carry >>= 5;
        i++;
        if (carry == 0) {
            break;
        }
        array[j] |= (carry & 31) << 10;
        carry >>= 5;
        i++;
    }
    while (array.length && array[array.length - 1] === 0) {
        array.length--;
    }
    return this;
};

/**
 * `this` divided by num and returns remainder.
 * @param {Unsigned|Number} num
 * @return {Unsigned}
 */
MPN_proto.divAssignMod = function (num) {
    var r;
    if (typeof num === 'number') {
        if (num === 0) {
            throw new Error('Divide by zero');
        }
        if (num <= LIMB_BITMASK) {
            return this._divAssignMod_1(num);
        }
    }
    num = Unsigned.from(num);
    if (num.isZero()) {
        throw new Error('Divide by zero');
    }
    r = this._divAssignMod_bi(num);
    return r;
};

/**
 *
 * @param {Unsigned|Number} num
 * @returns {Array}
 */
MPN_proto.divMod = function (num) {
    var q = this.clone();
    var rem = q.divAssignMod(num);
    return [q, rem];
};

MPN_proto._divAssignMod_1 = function (num) {
    var array = this.array,
        len = array.length,
        i, carry = 0;
    for (i = len - 1; i >= 0; i--) {
        carry <<= LIMB_DEPTH;
        carry += array[i];
        array[i] = carry / num >> 0;
        carry -= array[i] * num;
    }
    return Unsigned.fromNumber(carry);
};

MPN_proto._divAssignMod_bi = function (num) {
    if (num.array.length === 0) {
        throw new Error('Divide by zero');
    }
    if (num.array.length === 1) {
        return this._divAssignMod_1(num.array[0]);
    }
    var r_array = this.array.slice(0),
        len = r_array.length,
        array2 = num.array,
        len2 = array2.length,
        a, b = 0, c = r_array[len - 1], m,
        temp, j, carry, guess, cmp;
    switch (this.cmp(num)) {
        case -1:
            a = this.clone();
            this.array.length = 0;
            return a;
        case 0:
            this.array.length = 1;
            this.array[0] = 1;
            return new Unsigned();
    }
    this.array.length = len - len2 + 1;
    m = (array2[len2 - 1] << LIMB_DEPTH) + array2[len2 - 2];
    for (var offset = len - len2; offset >= 0; offset--) {
        a = r_array[len2 + offset] || 0;
        b = r_array[len2 + offset - 1];
        c = r_array[len2 + offset - 2];
        // We want to calculate q=[(an+b)/(cn+d)] where b and d are in [0,n).
        // Our goal is to guess q=[a/c]+R.
        // -2 <= [(an+b)/(cn+d)]-[a/c] <= 2

        // Cannot use << due to overflow.
        guess = Math.floor((((a * 32768 + b) * 32768) + c) / m);
        if (guess > 0) {
            temp = num.clone();
            temp._mult_assign_1(guess);
            temp._resize(len2 + (+!!a));

            while (1 == (cmp = temp._cmp_offset_a(r_array, offset))) { // Too big a guess
                guess--;
                if (guess == 0) {
                    break;
                }
                temp._minus_assign_bi(num);
                temp._resize(len2 + (+!!a));
            }
        } else {
            temp =  new Unsigned();
        }
        for (j = 0, carry = 0; j < temp.array.length; j++) {
            carry += r_array[j + offset] - temp.array[j];
            r_array[j + offset] = carry & LIMB_BITMASK;
            carry >>= LIMB_DEPTH;
        }

        if (r_array.length > offset + len2 && r_array[offset + len2] == 0) {
            r_array.length--;
        }
        if (cmp == 0) {
            // We found it
            a = b = c = 0;
        } else { // cmp == -1
            // Might be too small, might be right.
            // Never try more than 4 times
            while (-1 == num._cmp_offset_a(r_array, offset)) { // Too big a guess
                guess++;
                for (j = 0, carry = 0; j < len2; j++) {
                    carry += r_array[j + offset] - array2[j];
                    r_array[j + offset] = carry & LIMB_BITMASK;
                    carry >>= LIMB_DEPTH;
                }
                if (carry) {
                    carry += r_array[j + offset];
                    r_array[j + offset] = carry & LIMB_BITMASK;
                    carry >>= LIMB_DEPTH;
                }
            }
        }
        if (r_array.length > offset + len2 && r_array[offset + len2] == 0) {
            r_array.length--;
        }
        this.array[offset] = guess;
    }
    return new Unsigned(r_array);
};

exports.Unsigned = Unsigned;