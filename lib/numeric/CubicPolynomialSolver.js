var PI2_3 = 2.0943951023931953; // 120 Deg

/**
 * Cubic root of number
 * @param number {Number}
 */
function cubicRoot(number) {
    if (number >= 0) {
        // exp(log(0)/3) will fantastically work.
        return Math.exp(Math.log(number) / 3);
    } else {
        return -Math.exp(Math.log(-number) / 3);
    }
}

/**
 * Returns the function f(x) = a * x + b and solver for f(x) = y
 * @param a
 * @param b
 */

function linearFunction(a, b) {
    var result;
    if (a === 0) {
        result = function (t) {
            return b;
        };
        result.solve = function (y) {
            // if y == d there should be a real root, but we can ignore it for geometry calculations.
            return [];
        };
    } else {
        result = function (t) {
            return a * t + b;
        };
        result.solve = function (y) {
            return [(y - b) / a];
        };
    }
    return result;
}

/**
 * Returns the function f(x) = a * x^2 + b * x + c and solver for f(x) = y
 * @param a
 * @param b
 * @param c
 * @return {Function}
 */
function quadraticFunction(a, b, c) {
    if (a === 0) {
        return linearFunction(b, c);
    } else {
        // Quadratic equation.
        var result = function (t) {
                return (a * t + b) * t + c;
            },
            delta0temp = b * b - 4 * a * c,
            delta = function (y) {
                return delta0temp + 4 * a * y;
            },
            solveTemp0 = 1 / a * 0.5,
            solveTemp1 = -solveTemp0 * b;
        solveTemp0 = Math.abs(solveTemp0);
        result.solve = function (y) {
            var deltaTemp = delta(y);
            if (deltaTemp < 0) {
                return [];
            }
            deltaTemp = Math.sqrt(deltaTemp);
            // have to distinct roots here.
            return [solveTemp1 - deltaTemp * solveTemp0, solveTemp1 + deltaTemp * solveTemp0];
        };
        return result;
    }
}

/**
 * Returns the function f(x) = a * x^3 + b * x^2 + c * x + d and solver for f(x) = y
 * @param a
 * @param b
 * @param c
 * @param d
 */
function cubicFunction(a, b, c, d) {
    if (a === 0) {
        return quadraticFunction(b, c, d);
    } else {
        var result = function (t) {
                return ((a * t + b) * t + c) * t + d;
            },
            offset = b / a / 3,
            c_a = c / a,
            d_a = d / a,
            offset2 = offset * offset,
            deltaCore = (offset * c_a - d_a) * 0.5 - offset * offset2,
            deltaTemp1 = offset2 - c_a / 3,
            deltaCoreOffset = deltaTemp1 * deltaTemp1 * deltaTemp1,
            deltaTemp1_2,
            deltaTemp13_2;

        if (deltaTemp1 === 0) {
            result.solve = function (y) {
                return [-offset + cubicRoot(deltaCore * 2 + y / a)];
            };
        } else {
            if (deltaTemp1 > 0) {
                deltaTemp1_2 = Math.sqrt(deltaTemp1);
                deltaTemp13_2 = deltaTemp1_2 * deltaTemp1_2 * deltaTemp1_2;
                deltaTemp1_2 += deltaTemp1_2;
            }
            result.solve = function (y) {
                y /= a;
                var d0 = deltaCore + y * 0.5,
                    delta = d0 * d0 - deltaCoreOffset,
                    theta,
                    ra,
                    rb,
                    rc,
                    cr,
                    root0;
                if (delta > 0) {
                    delta = Math.sqrt(delta);
                    return [-offset + cubicRoot(d0 + delta) + cubicRoot(d0 - delta)];
                } else if (delta === 0) {
                    cr = cubicRoot(d0);
                    root0 = -offset - cr;
                    if (d0 >= 0) {
                        return [root0, root0, -offset + 2 * cr];
                    } else {
                        return [-offset + 2 * cr, root0, root0];
                    }
                } else {
                    theta = Math.acos(d0 / deltaTemp13_2) / 3; // 0 ~ Pi/3
                    // Cos(theta) >= Cos(theta - 2PI/3) >= Cos(theta + 2PI/3)
                    // deltaTemp1_2 > 0;
                    ra = deltaTemp1_2 * Math.cos(theta) - offset;
                    rb = deltaTemp1_2 * Math.cos(theta + PI2_3) - offset;
                    rc = deltaTemp1_2 * Math.cos(theta - PI2_3) - offset;
                    return [rb, rc, ra];
                }
            };
        }
        return result;
    }
}

exports.linearFunction = linearFunction;
exports.quadraticFunction = quadraticFunction;
exports.cubicFunction = cubicFunction;
