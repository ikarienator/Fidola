var Unsigned = require('./Unsigned').Unsigned;

/**
 * Arbitrary long signed integer.
 * @param {Array|Unsigned|Integer} [array]
 * @param {Number} [sign]
 * @constructor
 */
function Integer(array, sign) {
    if (array instanceof Integer) {
        this.clamp = array.clamp.clone();
        this.sign = array.sign;
        return;
    }
    this.clamp = (array instanceof Unsigned) ? array.clone() : new Unsigned(array.slice());
    this.sign = typeof sign === 'number' ? sign : 1;
    if (this.clamp.isZero()) {
        this.sign = 1;
    }
}

var MPZ_proto = Integer.prototype;

/**
 *
 * @type {Unsigned}
 */
MPZ_proto.clamp = null;

/**
 *
 * @type {number}
 */
MPZ_proto.sign = 0;

/**
 * Clone the current integer
 * @return {Integer}
 */
MPZ_proto.clone = function () {
    return new Integer(this.clamp, this.sign);
};

MPZ_proto.isZero = function () {
    return this.clamp.isZero();
};

MPZ_proto.isEven = function () {
    return this.clamp.isEven();
};

MPZ_proto.isOdd = function () {
    return this.clamp.isOdd();
};

MPZ_proto.isPositive = function () {
    return this.sign > 0 && !this.isZero();
};

MPZ_proto.isNegative = function () {
    return this.sign < 0 && !this.isZero();
};

MPZ_proto.negation = function () {
    return new Integer(this.clamp.clone(), -this.sign);
};

MPZ_proto.shiftLeftAssign = function (bits) {
    this.clamp.shiftLeftAssign(bits);
    return this;
};

MPZ_proto.shiftLeft = function (bits) {
    return this.clone().shiftLeftAssign(bits);
};

/**
 *
 * @param number
 * @returns {Integer}
 */
Integer.from = function (number) {
    if (number instanceof Integer) {
        return number;
    }
    if (number instanceof Unsigned) {
        return new Integer(number, 1);
    }
    if (typeof number === 'number') {
        return Integer.fromNumber(number);
    }
    return Integer.fromString(number.toString());
};

Integer.fromNumber = function (number) {
    if (number < 0) {
        return new Integer(Unsigned.fromNumber(-number), -1);
    } else {
        return new Integer(Unsigned.fromNumber(number), 1);
    }
};

Integer.fromString = function (str) {
    var sign = 1;
    if (str[0] == '-') {
        str = str.substring(1);
        sign = -1;
    }
    return new Integer(Unsigned.fromString(str), sign);
};

MPZ_proto.getDigits = function (num) {
    return this.clamp.getDigits(num);
};

/**
 *
 * @param {Integer} num
 */
MPZ_proto.cmp = function (num) {
    num = Integer.from(num);
    if (this.isZero()) {
        if (num.isZero()) {
            return 0;
        }
        return -num.sign;
    } else if (num.isZero()) {
        return this.sign;
    } else if (this.sign != num.sign) {
        return (this.sign - num.sign) >> 1;
    } else {
        return this.sign * this.clamp.cmp(num.clamp);
    }
};

/**
 * 'operator +'
 * @param {Integer} num
 * @returns {Integer}
 */
MPZ_proto.plus = function (num) {
    num = Integer.from(num);
    if (this.sign == num.sign) {
        return new Integer(this.clamp.plus(num.clamp), this.sign);
    } else if (this.clamp.cmp(num.clamp) < 0) {
        return new Integer(num.clamp.minus(this.clamp), num.sign);
    } else {
        return new Integer(this.clamp.minus(num.clamp), this.sign);
    }
};

/**
 * 'operator +='
 * @param num
 * @returns {Integer}
 */
MPZ_proto.plusAssign = function (num) {
    num = this.plus(num);
    this.clamp = num.clamp;
    this.sign = num.sign;
    return this;
};

/**
 *'operator -'
 * @param {Integer} num
 */
MPZ_proto.minus = function (num) {
    num = Integer.from(num);
    if (this.sign != num.sign) {
        return new Integer(this.clamp.plus(num.clamp), this.sign);
    } else if (this.clamp.cmp(num.clamp) < 0) {
        return new Integer(num.clamp.minus(this.clamp), -this.sign);
    } else {
        return new Integer(this.clamp.minus(num.clamp), this.sign);
    }
};

/**
 * 'operator -='
 * @param num
 * @returns {Integer}
 */
MPZ_proto.minusAssign = function (num) {
    num = this.minus(num);
    this.clamp = num.clamp;
    this.sign = num.sign;
    return this;
};

/**
 * 'operator *'
 * @param num
 * @returns {Integer}
 */
MPZ_proto.mult = function (num) {
    num = Integer.from(num);
    return new Integer(this.clamp.mult(num.clamp), this.sign * num.sign);
};

/**
 * 'operator *='
 * @param num
 * @returns {Integer}
 */
MPZ_proto.multAssign = function (num) {
    num = Integer.from(num);
    this.clamp.multAssign(num.clamp);
    this.sign *= num.sign;
    return this;
};

MPZ_proto.sqrAssign = function () {
    this.sign = 1;
    this.clamp.sqrAssign();
    return this;
};

/**
 * Divide this by num.
 * Assign this to the quotient and returns the remainder.
 * @param num
 * @returns {Integer}
 */
MPZ_proto.divAssignMod = function (num) {
    var divmod = this.divMod(num);
    this.clamp = divmod[0].clamp;
    this.sign = divmod[0].sign;
    return divmod[1];
};

/**
 * Divide this by num.
 * Returns the quotient and remainder.
 * @param num
 * @returns {[Integer]}
 */
MPZ_proto.divMod = function (num) {
    if (this.isZero()) {
        return [Integer.fromNumber(0), Integer.fromNumber(0)];
    }
    num = Integer.from(num);
    var dm = this.clamp.divMod(num.clamp);
    if (this.sign === num.sign) {
        return [new Integer(dm[0], 1), new Integer(dm[1], this.sign)];
    } else if (dm[1].isZero()) {
        return [new Integer(dm[0], -1), new Integer(dm[1], 1)];
    } else {
        return [new Integer(dm[0], -1).minus(1), new Integer(dm[1], this.sign).plus(num)];
    }
};

MPZ_proto.toString = function () {
    if (this.clamp.isZero()) {
        return '0';
    }
    return (this.sign == 1 ? '' : '-') + this.clamp.toString();
};

exports.Integer = Integer;
