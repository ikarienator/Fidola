/**
 * Natural Number
 * @param {Array} [array]
 * The element size is 0 to LIMB_BITS
 * @constructor
 */
function MPNaturalNumber(array) {
    // 0 .. LIMB_BITS to avoid overflow in multiplication
    this.array = array || [];
}

MPNaturalNumber.DIGITS = "0123456789";

var numeric = require("./FastFourierTransform.js"),
    fft = numeric.fft,
    ifft = numeric.ifft,
    LIMB_DEPTH = 15,
    LIMB_BITS = 32767;

/**
 *
 * @param {Number} number
 * @return {MPNaturalNumber}
 */
MPNaturalNumber.fromNumber = function (number) {
    number = number >> 0;
    var result = new MPNaturalNumber(), i = 0;
    while (number) {
        result.array[i++] = number & LIMB_BITS;
        number >>= LIMB_DEPTH;
    }
    return result;
};

/**
 *
 * @param {String} string
 * @return {MPNaturalNumber}
 */
MPNaturalNumber.fromString = function (string) {
    var integer = new MPNaturalNumber(),
        length = string.length;
    for (var i = length % 4; i <= length; i += 4) {
        integer._mult_1(10000);
        if (i >= 4) {
            integer._add_1(+string.substring(i - 4, i));
        } else {
            integer._add_1(+string.substring(0, i));
        }
    }
    integer.normalize();
    return integer;
};

var MPN_proto = MPNaturalNumber.prototype;

/**
 * Clone the current integer
 * @return {MPNaturalNumber}
 */
MPN_proto.clone = function () {
    var result = new MPNaturalNumber();
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
        digits = MPNaturalNumber.DIGITS;
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
    if (base == LIMB_BITS) {
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
        return result;
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
        return result;
    }

    array = this.array.slice();
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
    while (result.length > 0 && result[result.length - 1] === 0) {
        result.length--;
    }
    return result;
};

/**
 * Recalculate carry and shrink the size of the array.
 * @return {MPNaturalNumber}
 */
MPN_proto.normalize = function () {
    var array = this.array,
        len = array.length,
        carry = 0;
    for (var i = 0; i < len; i++) {
        carry += array[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITS;
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

/**
 *
 * @param {Number|MPNaturalNumber} num
 * @return {Number}
 */
MPN_proto.cmp = function (num) {
    if (typeof num === 'number') {
        num = MPNaturalNumber.fromNumber(num);
    } else {
        num.normalize();
    }
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
MPN_proto.shiftLeft = function (bits) {
    var array = this.array, len = array.length, i, block_shift;
    if (bits >= LIMB_DEPTH) {
        block_shift = bits / LIMB_DEPTH >> 0;
        bits %= LIMB_DEPTH;
    }
    if ((array[len - 1] << bits) >= 1 << LIMB_DEPTH) {
        array[len++] = 0;
    }
    array.length += block_shift;
    for (i = len - 1; i > 0; i--) {
        array[i + block_shift] = (array[i] << bits) | (array[i - 1] >> (LIMB_DEPTH - bits));
    }
    array[block_shift] = array[0] << bits;
    for (i = 0; i < block_shift; i++) {
        array[i] = 0;
    }
    return this;
};

/**
 * "operator+="
 * Add a number to the current one.
 * @param {Number|MPNaturalNumber} num
 */
MPN_proto.add = function (num) {
    if (typeof num === 'number') {
        return this._add_1(num);
    } else if (num instanceof MPNaturalNumber) {
        return this._add_bi(num);
    }
    throw new Error("Invalid type");
};

/**
 * "operator-="
 * Add a number to the current one.
 * @param {Number|MPNaturalNumber} num
 */
MPN_proto.minus = function (num) {
    if (typeof num === 'number') {
        return this._minus_1(num);
    } else if (num instanceof MPNaturalNumber) {
        return this._minus_bi(num);
    }
    throw new Error("Invalid type");
};

/**
 * @private
 * Add num to this.
 * @param {MPNaturalNumber} num
 */
MPN_proto._add_bi = function (num) {
    var i, carry,
        array = this.array,
        len = array.length,
        array2 = num.array,
        len2 = array2.length;
    if (len < len2) {
        array.length = len2;
        while (len < len2) {
            array[len++] = 0;
        }
    }
    for (i = 0, carry = 0; i < len2; i++) {
        carry += array[i] + array2[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        carry += array[i];
        array[i] = carry & LIMB_BITS;
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
MPN_proto._add_1 = function (num) {
    var array = this.array,
        len = array.length;
    for (var i = 0, carry = num; carry && i < len; i++) {
        carry += array[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    return this;
};

/**
 * @private
 * @param {MPNaturalNumber} num a BigInteger whose absolute value is smaller than `this`
 */
MPN_proto._minus_1 = function (num) {
    var array = this.array,
        i = 0, carry = -num;
    while (carry) {
        carry += array[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    return this;
};


/**
 * @private
 * @param {MPNaturalNumber} num a BigInteger that is smaller than `this`
 */
MPN_proto._minus_bi = function (num) {
    var array = this.array,
        array2 = num.array,
        len2 = array2.length,
        i, carry = 0;
    for (i = 0, carry; i < len2; i++) {
        carry += array[i] - array2[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        carry += array[i];
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    return this;
};

/**
 * "operator*="
 * Multiply a number to the current one.
 * @param {Number|MPNaturalNumber} num
 */
MPN_proto.mult = function (num) {
    if (this.array.length == 0) {
        return this;
    }
    if (typeof num === 'number') {
        if (num == 0) {
            this.array = [];
            return this;
        }
        return this._mult_1(num);
    } else if (num instanceof MPNaturalNumber) {
        return this._mult_bi(num);
    }
    throw new Error("Invalid type");
};

/**
 * @private
 * @param {MPNaturalNumber} num
 */
MPN_proto._mult_bi = function (num) {
    if (num.array.length == 0) {
        this.array.length = 0;
        return this;
    }
    if (num.array.length == 1) {
        return this._mult_1(num.array[0]);
    }
    var maxlen = num.array.length + this.array.length;
    maxlen = 1 << Math.ceil(Math.log(maxlen) / Math.log(2));
    if (num.array.length * this.array.length > 200 * maxlen * Math.log(maxlen)) {
        return this._mult_huge(num);
    }
    var target = this.array,
        array = target.slice(0),
        len = array.length,
        array2 = num.array,
        len2 = array2.length, i, j,
        outlen = len + len2 - 1,
        carry,
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
                target[i + j] = carry & LIMB_BITS;
                carry >>= LIMB_DEPTH;
            }
            while (carry) {
                if (i + j >= target.length) {
                    target[i + j] = 0;
                }
                carry += target[i + j];
                target[i + j] = carry & LIMB_BITS;
                carry >>= LIMB_DEPTH;
            }
        }
    }
    this.normalize();
    return this;
};

/**
 * @private
 * @param {Number} num
 */
MPN_proto._mult_1 = function (num) {
    num >>= 0;
    var array = this.array,
        len = array.length;
    for (var i = 0, carry = 0; i < len; i++) {
        carry += array[i] * num;
        array[i] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    while (carry) {
        array[i++] = carry & LIMB_BITS;
        carry >>= LIMB_DEPTH;
    }
    return this;
};

/**
 * @private
 * Multiply numbers using FFT.
 * @param {MPNaturalNumber} num
 * @return {MPNaturalNumber}
 */
MPN_proto._mult_huge = function (num) {
    var digits1 = this.getDigits(32),
        digits2 = num.getDigits(32),
        maxlen = digits1.length + digits2.length,
        carry, j;
    maxlen = 1 << Math.ceil(Math.log(maxlen) / Math.log(2));
    var fft1 = fft(digits1, maxlen),
        fft2 = fft(digits2, maxlen),
        i, len = fft1.length,
        re;
    for (i = 0; i < len; i += 2) {
        re = fft1[i] * fft2[i] - fft1[i + 1] * fft2[i + 1];
        fft1[i + 1] = fft1[i] * fft2[i + 1] + fft1[i + 1] * fft2[i];
        fft1[i] = re;
    }
    digits1 = ifft(fft1, len);
    for (i = 0, carry = 0; i < maxlen; i++) {
        carry += Math.round(digits1[i]);
        digits1[i] = carry & 31;
        carry >>= 5;
    }
    while (carry) {
        digits1[i++] = carry & 31;
        carry >>= 5;
    }
    this.array.length = 0;
    for (i = 0, j = 0; i < digits1.length; i += 3, j++) {
        this.array[j] = digits1[i];
        if (i + 1 < digits1.length) {
            this.array[j] |= digits1[i + 1] << 5;
            if (i + 2 < digits1.length) {
                this.array[j] |= digits1[i + 2] << 10;
            }
        }
    }
    return this;
};


/**
 * this divided by num and returns remainder.
 * @param {MPNaturalNumber|Number} num
 * @return {Array}
 */
MPN_proto.divMod = function (num) {
    var r;
    if (typeof num === 'number') {
        if (num === 0) {
            throw new Error('Divide by zero');
        }
        if (num < 32768) {
            r = this._divmod_1(num);
            return [this, r];
        } else {
            num = MPNaturalNumber.fromNumber(num);
        }
    }
    if (num instanceof MPNaturalNumber) {
        r = this._divmod_bi(num);
        return [this, r];
    }
    throw new Error("Invalid type");
};

MPN_proto._divmod_1 = function (num) {
    var array = this.array,
        len = array.length,
        i, carry = 0;
    for (i = len - 1; i >= 0; i--) {
        carry <<= LIMB_DEPTH;
        carry += array[i];
        array[i] = carry / num >> 0;
        carry -= array[i] * num;
    }
    return MPNaturalNumber.fromNumber(carry);
};

MPN_proto._divmod_bi = function (num) {
    num.normalize();
    if (num.array.length === 0) {
        throw new Error('Divide by zero');
    }
    if (num.array.length === 1) {
        return this._divmod_1(num.array[0]);
    }
    var r_array = this.array.slice(0),
        len = r_array.length,
        array2 = num.array,
        len2 = array2.length,
        a, b = 0, c = r_array[len - 1], m,
        temp, j, carry, guess, cmp;
    switch (this.cmp(num)) {
        case -1:
            this.array.length = 0;
            return num.clone();
        case 0:
            this.array.length = 1;
            this.array[0] = 1;
            return new MPNaturalNumber();
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

        guess = Math.floor((((a * 32768 + b) * 32768) + c) / m);
        temp = num.clone();
        temp._mult_1(guess);
        temp._resize(len2 + (+!!a));

        while (1 == (cmp = temp._cmp_offset_a(r_array, offset))) { // Too big a guess
            if (guess == 0) {
                break;
            }
            guess--;
            if (guess == 0) {
                break;
            }
            temp._minus_bi(num);
            temp._resize(len2 + (+!!a));
        }

        for (j = 0, carry = 0; j < temp.array.length; j++) {
            carry += r_array[j + offset] - temp.array[j];
            r_array[j + offset] = carry & LIMB_BITS;
            carry >>= LIMB_DEPTH;
        }

        // This should never happen
        // while (carry) {
        //     r_array[offset + (j++)] = carry & LIMB_BITS;
        //     carry >>= LIMB_DEPTH;
        // }
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
                    r_array[j + offset] = carry & LIMB_BITS;
                    carry >>= LIMB_DEPTH;
                }
                if (carry) {
                    carry += r_array[j + offset];
                    r_array[j + offset] = carry & LIMB_BITS;
                    carry >>= LIMB_DEPTH;
                }
            }
        }
        if (r_array.length > offset + len2 && r_array[offset + len2] == 0) {
            r_array.length--;
        }
        this.array[offset] = guess;
    }
    return new MPNaturalNumber(r_array);
};

/**
 *
 * @param {Array} [array]
 * @param {Number} [sign]
 * @constructor
 */
function MPInteger(array, sign) {
    this.clamp = new MPNaturalNumber(array);
    this.sign = typeof sign === 'number' ? sign : 1;
    this.normalize();
}

var MPZ_proto = MPInteger.prototype = new MPNaturalNumber();

MPInteger.fromNumber = function (number) {
    if (number < 0) {

    }
};

/**
 *
 * @param {Number} num
 */
MPZ_proto.add = function (num) {
    if (typeof num === 'number') {
        num = MPInteger.fromNumber(num);
    }
};

exports.MPNaturalNumber = MPNaturalNumber;
exports.MPInteger = MPInteger;