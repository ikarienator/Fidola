/**
 * Big Integer
 * @param {Array} [array]
 * The element size is 0 to 32767
 * @constructor
 */
function BigInteger(array) {
    // 0 .. 32767 to avoid overflow in multiplication
    this.array = array || [];
}

BigInteger.DIGITS = "0123456789";

var dsp = require("../dsp/FFT.js"),
    fft = dsp.fft,
    ifft = dsp.ifft;

/**
 *
 * @param {Number} number
 * @return {BigInteger}
 */
BigInteger.fromNumber = function (number) {
    number = number >> 0;
    var result = new BigInteger(), i = 0;
    while (number) {
        result.array[i++] = number & 32767;
        number >>= 15;
    }
    return result;
};

/**
 *
 * @param {String} string
 * @return {BigInteger}
 */
BigInteger.fromString = function (string) {
    var integer = new BigInteger(),
        length = string.length;
    for (var i = length % 4; i <= length; i += 4) {
        integer._mult_1(10000);
        if (i >= 4) {
            integer._add_1(+string.substring(i - 4, i));
        } else {
            integer._add_1(+string.substring(0, i));
        }
    }
    return integer;
};

BigInteger.prototype = {
    /**
     * Clone the current integer
     * @return {BigInteger}
     */
    clone: function () {
        var result = new BigInteger();
        result.array = this.array.slice(0);
        return result;
    },

    /**
     * To string
     * @return {String}
     */
    toString: function () {
        this.normalize();
        if (this.array.length === 0) {
            return '0';
        } else if (this.array.length === 1) {
            return this.array[0].toString();
        }
        var result = this.getDigits(10000), i, j, a, b,
            digits = BigInteger.DIGITS;
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
    },

    /**
     * Get digits from big integer.
     * @param base
     * @return {Array}
     */
    getDigits: function (base) {
        var array, result, num;
        if (base == 32767) {
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
                array[i] += carry << 15;
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
    },

    /**
     * Recalculate carry and shrink the size of the array.
     * @return {BigInteger}
     */
    normalize: function () {
        var array = this.array,
            len = array.length,
            carry = 0;
        for (var i = 0; i < len; i++) {
            carry += array[i];
            array[i] = carry & 32767;
            carry >>= 15;
        }
        while (carry) {
            array[i++] = carry & 32767;
            carry >>= 15;
        }
        while (array.length > 0 && array[array.length - 1] === 0) {
            array.length--;
        }
        return this;
    },

    _resize: function (length) {
        var array = this.array, i = array.length;
        array.length = length;
        for (; i < length; i++) {
            array[i] = 0;
        }
    },

    /**
     *
     * @param {Number|BigInteger} num
     * @return {Number}
     */
    cmp: function (num) {
        if (typeof num === 'number') {
            num = BigInteger.fromNumber(num);
        } else {
            num.normalize();
        }
        return this._cmp_offset_a(num.array, 0);
    },

    /**
     *
     * @param {Array} array
     * @param {Number} offset
     * @return {Number}
     * @private
     */
    _cmp_offset_a: function (array, offset) {
        if (this.array.length + offset != array.length) {
            return this.array.length + offset > array.length ? 1 : -1;
        }
        for (var i = this.array.length - 1; i >= 0; i--) {
            if (this.array[i] != array[i + offset]) {
                return this.array[i] > array[i + offset] ? 1 : -1;
            }
        }
        return 0;
    },

    /**
     * "operator <<="
     * @param {Number} bits
     * @return {Number} this
     */
    shiftLeft: function (bits) {
        var array = this.array, len = array.length, i, block_shift;
        if (bits >= 15) {
            block_shift = bits / 15 >> 0;
            bits %= 15;
        }
        if ((array[len - 1] << bits) >= 1 << 15) {
            array[len++] = 0;
        }
        array.length += block_shift;
        for (i = len - 1; i > 0; i--) {
            array[i + block_shift] = (array[i] << bits) | (array[i - 1] >> (15 - bits));
        }
        array[block_shift] = array[0] << bits;
        for (i = 0; i < block_shift; i++) {
            array[i] = 0;
        }
        return this;
    },

    /**
     * "operator+="
     * Add a number to the current one.
     * @param {Number|BigInteger} num
     */
    add: function (num) {
        if (typeof num === 'number') {
            return this._add_1(num);
        } else if (num instanceof BigInteger) {
            return this._add_bi(num);
        }
        throw new Error("Invalid type");
    },

    /**
     * "operator-="
     * Add a number to the current one.
     * @param {Number|BigInteger} num
     */
    minus: function (num) {
        if (typeof num === 'number') {
            return this._minus_1(num);
        } else if (num instanceof BigInteger) {
            return this._minus_bi(num);
        }
        throw new Error("Invalid type");
    },

    /**
     * @private
     * Add num to this.
     * @param {BigInteger} num
     */
    _add_bi: function (num) {
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
            array[i] = carry & 32767;
            carry >>= 15;
        }
        while (carry) {
            carry += array[i];
            array[i] = carry & 32767;
            carry >>= 15;
            i++;
        }
        return this;
    },

    /**
     * @private
     * Add num to this.
     * @param {Number} num
     */
    _add_1: function (num) {
        var array = this.array,
            len = array.length;
        for (var i = 0, carry = num; i < len; i++) {
            carry += array[i];
            array[i] = carry & 32767;
            carry >>= 15;
        }
        while (carry) {
            array[i++] = carry & 32767;
            carry >>= 15;
        }
        return this;
    },

    /**
     * @private
     * @param {BigInteger} num a BigInteger whose absolute value is smaller than `this`
     */
    _minus_1: function (num) {
        var array = this.array,
            i = 0, carry = -num;
        while (carry) {
            carry += array[i];
            array[i] = carry & 32767;
            carry >>= 15;
        }
        return this;
    },


    /**
     * @private
     * @param {BigInteger} num a BigInteger that is smaller than `this`
     */
    _minus_bi: function (num) {
        var array = this.array,
            array2 = num.array,
            len2 = array2.length,
            i, carry = 0;
        for (i = 0, carry; i < len2; i++) {
            carry += array[i] - array2[i];
            array[i] = carry & 32767;
            carry >>= 15;
        }
        while (carry) {
            carry += array[i];
            array[i] = carry & 32767;
            carry >>= 15;
        }
        return this;
    },

    /**
     * "operator*="
     * Multiply a number to the current one.
     * @param {Number|BigInteger} num
     */
    mult: function (num) {
        if (this.array.length == 0) {
            return this;
        }
        if (typeof num === 'number') {
            if (num == 0) {
                this.array = [];
                return this;
            }
            return this._mult_1(num);
        } else if (num instanceof BigInteger) {
            return this._mult_bi(num);
        }
        throw new Error("Invalid type");
    },

    /**
     * @private
     * @param {BigInteger} num
     */
    _mult_bi: function (num) {
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
                    target[i + j] = carry & 32767;
                    carry >>= 15;
                }
                while (carry) {
                    if (i + j >= target.length) {
                        target[i + j] = 0;
                    }
                    carry += target[i + j];
                    target[i + j] = carry & 32767;
                    carry >>= 15;
                }
            }
        }
        this.normalize();
        return this;
    },

    /**
     * @private
     * @param {Number} num
     */
    _mult_1: function (num) {
        num >>= 0;
        var array = this.array,
            len = array.length;
        for (var i = 0, carry = 0; i < len; i++) {
            carry += array[i] * num;
            array[i] = carry & 32767;
            carry >>= 15;
        }
        while (carry) {
            array[i++] = carry & 32767;
            carry >>= 15;
        }
        return this;
    },

    /**
     * @private
     * Multiply numbers using FFT.
     * @param {BigInteger} num
     * @return {BigInteger}
     */
    _mult_huge: function (num) {
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
    },


    /**
     * this divided by num and returns remainder.
     * @param {BigInteger|Number} num
     * @return {Array}
     */
    divMod: function (num) {
        var r;
        if (typeof num === 'number') {
            if (num === 0) {
                throw new Error('Divide by zero');
            }
            if (num < 32768) {
                r = this._divmod_1(num);
                return [this, r];
            } else {
                num = BigInteger.fromNumber(num);
            }
        }
        if (num instanceof BigInteger) {
            r = this._divmod_bi(num);
            return [this, r];
        }
        throw new Error("Invalid type");
    },

    _divmod_1: function (num) {
        var array = this.array,
            len = array.length,
            i, carry = 0;
        for (i = len - 1; i >= 0; i--) {
            carry <<= 15;
            carry += array[i];
            array[i] = carry / num >> 0;
            carry -= array[i] * num;
        }
        return BigInteger.fromNumber(carry);
    },

    _divmod_bi: function (num) {
        num.normalize();
        if (num.array.length === 0) {
            throw new Error('Divide by zero');
        }
        if (num.array.length === 1) {
            return this._divmod_1(num.array[0]);
        }
        var array = this.array.slice(0),
            len = array.length,
            array2 = num.array,
            len2 = array2.length,
            a, b = 0, c = array[len - 1], m,
            temp, j, carry, guess, cmp;
        switch (this.cmp(num)) {
            case -1:
                this.array.length = 0;
                return num.clone();
            case 0:
                this.array.length = 1;
                this.array[0] = 1;
                return new BigInteger();
        }
        this.array.length = len - len2 + 1;
        m = (array2[len2 - 1] << 15) + array2[len2 - 2];
        for (var offset = len - len2; offset >= 0; offset--) {
            a = array[len2 + offset] || 0;
            b = array[len2 + offset - 1];
            c = array[len2 + offset - 2];
            // We want to calculate q=[(an+b)/(cn+d)] where b and d are in [0,n).
            // Our goal is to guess q=[a/c]+R.
            // -2 <= [(an+b)/(cn+d)]-[a/c] <= 2

            guess = Math.floor((((a * 32768 + b) * 32768) + c) / m);
            temp = num.clone();
            temp._mult_1(guess);
            temp._resize(len2 + (+!!a));

            while (1 == (cmp = temp._cmp_offset_a(array, offset))) { // Too big a guess
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
                carry += array[j + offset] - temp.array[j];
                array[j + offset] = carry & 32767;
                carry >>= 15;
            }

            // This should never happen
            // while (carry) {
            //     array[offset + (j++)] = carry & 32767;
            //     carry >>= 15;
            // }
            if (array.length > offset + len2 && array[offset + len2] == 0) {
                array.length--;
            }
            if (cmp == 0) {
                // We found it
                a = b = c = 0;
            } else { // cmp == -1
                // Might be too small, might be right.
                // Never try more than 4 times
                while (-1 == num._cmp_offset_a(array, offset)) { // Too big a guess
                    guess++;
                    for (j = 0, carry = 0; j < len2; j++) {
                        carry += array[j + offset] - array2[j];
                        array[j + offset] = carry & 32767;
                        carry >>= 15;
                    }
                    if (carry) {
                        carry += array[j + offset];
                        array[j + offset] = carry & 32767;
                        carry >>= 15;
                    }
                }
            }
            if (array.length > offset + len2 && array[offset + len2] == 0) {
                array.length--;
            }
            this.array[offset] = guess;
        }
        return new BigInteger(array);
    }
};

exports.BigInteger = BigInteger;