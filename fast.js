(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/fast.js",function(require,module,exports,__dirname,__filename,process,global){var fast = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}
var seq = fast.seq = {};
includes(seq, require("./sequence/BinarySearch"));
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

var ds = fast.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/CartesianTree.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
includes(ds, require("./datastructure/BinarySearchTree.js"));
includes(ds, require("./datastructure/LinkedList.js"));
includes(ds, require("./datastructure/ImmutableArray.js"));

var nt = fast.nt = {};
includes(nt, require("./numbertheory/Basics.js"));
includes(nt, require("./numbertheory/PrimalityTest.js"));
includes(nt, require("./numbertheory/FNTT.js"));

var numeric = fast.numeric = {};
includes(numeric, require("./numeric/FastFourierTransform.js"));
includes(numeric, require("./numeric/CubicPolynomialSolver.js"));
});

require.define("/sequence/BinarySearch.js",function(require,module,exports,__dirname,__filename,process,global){function binarySearch(sortedArray, needle) {
    var lo = 0, hi = sortedArray.length;
    while (lo + 1 < hi) {
        var mid = (lo + hi) >> 1;
        var el = sortedArray[mid];
        if (el === needle) {
            return mid;
        } else if (el < needle) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    if (sortedArray[lo] === needle) {
        return lo;
    }
    return -1;
}

function binarySearchWithCompare(sortedArray, needle, compare) {
    var lo = 0, hi = sortedArray.length;
    while (lo + 1 < hi) {
        var mid = (lo + hi) >> 1;
        var el = sortedArray[mid];
        var cmp = compare(el, needle);
        if (cmp === 0) {
            return mid;
        }
        if (cmp < 0) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }
    if (compare(sortedArray[lo], needle) == 0) {
        return lo;
    }
    return -1;
}

exports.binarySearch = binarySearch;
exports.binarySearchWithCompare = binarySearchWithCompare;
});

require.define("/sequence/KMP.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * http://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
 *
 * @param {Array} array
 * @param {Function} [eqTest]
 * @return {Array}
 */
function KMPPreprocess(array, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    var jump, i = 2, j, ln = array.length;
    if (ln === 0) {
        return[];
    }
    if (ln === 1) {
        return [-1];
    }
    i = 0;
    jump = [-1];
    j = -1;
    while (i < ln) {
        while (j > -1 && !eqTest(array[i], array[j])) {
            j = jump[j];
        }
        i += 1;
        j += 1;
        if (eqTest(array[i], array[j])) {
            jump[i] = jump[j];
        } else {
            jump[i] = j;
        }
    }
    return jump;
}

/**
 * http://en.wikipedia.org/wiki/Knuth%E2%80%93Morris%E2%80%93Pratt_algorithm
 * Find b in a.
 * Assuming b.length << a.length
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @param {Array} [jump]
 * @return {Number}
 */
function KMP(a, b, eqTest, jump) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }

    var i = 0, j = 0, la = a.length, lb = b.length;
    if (la < lb) {
        return -1;
    }
    if (lb === 0) {
        return 0;
    }
    if (la === lb) {
        for (i = 0; i < la; i += 1) {
            if (!eqTest(a[i], b[i])) {
                return -1;
            }
        }
        return 0;
    }

    jump = jump || KMPPreprocess(b, eqTest);

    while (j < la) {
        while (i > -1 && !eqTest(a[j], b[i])) {
            i = jump[i];
        }
        i += 1;
        j += 1;
        if (i >= lb) {
            return j - i;
        }
    }

    return -1;
}

exports.KMPPreProcess = KMPPreprocess;
exports.KMP = KMP;
});

require.define("/sequence/LCS.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * http://en.wikipedia.org/wiki/Longest_common_subsequence_problem
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @return {Object}
 */
function longestCommonSubsequenceDP(a, b, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    if (a.length > b.length) {
        // Swap a, b
        var flipResult = longestCommonSubsequenceDP(b, a, function (a, b) {
            return eqTest(b, a);
        });
        return {
            indicesA: flipResult.indicesB,
            indicesB: flipResult.indicesA,
            length: flipResult.length,
            result: flipResult.result
        };
    }
    if (a.length === 0) {
        return {
            indicesA: [],
            indicesB: [],
            length: 0,
            result: []
        };
    }

    var i, ln = b.length, j, ln2 = a.length, ln3 = 0,
        heads = [], ln3, k, l, target = [], lastElement,
        currB;
    for (i = 0; i < ln; i += 1) {
        currB = b[i];
        ln3 = heads.length;
        target = heads.slice(0);
        for (j = 0, k = 0, l = 0; j < ln2; j += 1) {
            if (eqTest(a[j], currB)) {
                // max k that heads[k + 1].indexA < j or -1 if 
                // all heads[k + 1].indexA >= j
                while (k < ln3 && heads[k].indexA < j) {
                    k += 1;
                }
                // min l that target[l].indexA >= j
                // or l == target.length if all target[l] < j
                while (l < ln3 && target[l].indexA < j) {
                    l += 1;
                }

                if (!target[l] || target[l].indexA > j) {
                    target[l] = {
                        indexA: j,
                        indexB: i,
                        length: heads[k - 1] ? heads[k - 1].length + 1 : 1,
                        trackBack: heads[k - 1] || null
                    };
                }

                // Jump to next change cause collision will not improve
                // the result
                if (heads[k]) {
                    j = heads[k].indexA;
                } else {
                    j = ln2;
                }
            }
            // do nothing else wise.
        }
        heads = target;
    }

    var indicesA = [],
        indicesB = [],
        length = heads.length,
        element = heads[length - 1],
        result = [];

    for (i = length - 1; i >= 0; i -= 1) {
        result[i] = a[indicesA[i] = element.indexA];
        indicesB[i] = element.indexB;
        element = element.trackBack;
    }

    return {
        indicesA: indicesA,
        indicesB: indicesB,
        length: length,
        result: result
    };
}

exports.LCS = longestCommonSubsequenceDP;
});

require.define("/sequence/LCStr.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * http://en.wikipedia.org/wiki/Longest_common_substring_problem
 * @param {Array} a
 * @param {Array} b
 * @param {Function} [eqTest]
 * @return {Object}
 */
function longestCommonSubarrayDP(a, b, eqTest) {
    if (!eqTest) {
        eqTest = function (a, b) {
            return a === b;
        };
    }
    if (a.length > b.length) {
        // Swap a, b
        var result = longestCommonSubarrayDP(b, a, function (a, b) {
            return eqTest(b, a);
        });
        return {
            startA: result.startB,
            startB: result.startA,
            length: result.length,
            result: result.result
        };
    }
    if (a.length === 0) {
        return {
            startA: 0,
            startB: 0,
            length: 0,
            result: []
        };
    }

    // dp is a sorted array of non-zero values.
    var i, ln = b.length, j, ln2 = a.length, k, ln3 = 0, dp, dp2 = [],
        currB, longest = 0, longestAIdx = -1, longestBIdx = -1;
    for (i = 0; i < ln; i += 1) {
        currB = b[i];
        if (eqTest(a[0], currB)) {
            dp2.push(0, 1);
            if (longest === 0) {
                longest = 1;
                longestAIdx = 0;
                longestBIdx = i;
            }
        }
        for (j = 1, k = 0; j < ln2; j += 1) {
            if (eqTest(a[j], currB)) {
                while (k < ln3 && dp[k] < j - 1) {
                    k += 2;
                }
                if (k < ln3 && dp[k] === j - 1) {
                    dp2.push(j, dp[k + 1] + 1);
                    if (dp[k + 1] + 1 > longest) {
                        longest = dp[k + 1] + 1;
                        longestAIdx = j;
                        longestBIdx = i;
                    }
                    k += 2;
                } else {
                    dp2.push(j, 1);
                    if (longest === 0) {
                        longest = 1;
                        longestAIdx = j;
                        longestBIdx = i;
                    }
                }
            }
        }
        dp = dp2;
        dp2 = [];
        ln3 = dp.length;
    }
    return {
        startA: longestAIdx - longest + 1,
        startB: longestBIdx - longest + 1,
        length: longest,
        result: a.slice(longestAIdx - longest + 1, longestAIdx + 1)
    };
}

/**
 *
 * @param {String} a
 * @param {String} b
 * @return {String}
 */
function longestCommonSubstringDP(a, b) {
    return longestCommonSubarrayDP(a.split(''), b.split(''),function (a, b) {
        return a === b;
    }).result.join('');
}

exports.LCStr = exports.longestCommonSubarrayDP = longestCommonSubarrayDP;
exports.LCStrStr = exports.longestCommonSubstringDP = longestCommonSubstringDP;
});

require.define("/sequence/LIS.js",function(require,module,exports,__dirname,__filename,process,global){function longestIncreasingSubsequence(array) {
    var st = [], // st[k] := index of smallest tail of LIS of length k
        prev = [], // prev[i] := last index in LIS ends at i 
        result = [];

    if (array.length === 0) {
        return result;
    }
    st[1] = 0;
    prev[0] = -1;
    for (var i = 1; i < array.length; i++) {
        var curr = array[i];
        if (array[st[1]] > curr) {
            prev[i] = -1;
            st[1] = i;
        } else if (array[st[st.length - 1]] < curr) {
            prev[i] = st[st.length - 1];
            st.push(i);
        } else {
            // Find the latest st[k] < curr
            // Find in [left, right)
            for (var left = 1, right = st.length - 1, mid = (left + right) >> 1; right > left + 1; mid = (left + right) >> 1) {
                if (array[st[mid]] < curr) {
                    // elevate
                    left = mid;
                } else {
                    right = mid;
                }
            }
            prev[i] = st[left];
            st[right] = i;
        }
    }
    for (var tb = st.length - 1, cursor = st[tb]; cursor >= 0; tb--, cursor = prev[cursor]) {
        result[tb - 1] = array[cursor];
    }
    return result;
}

exports.LIS = exports.longestIncreasingSubsequence = longestIncreasingSubsequence;
});

require.define("/sequence/Shuffle.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Randomly shuffle the array with.
 * @param {Array} array
 * @param {Function} [rng] Function generates number in [0, 1)
 */
function shuffle(array, rng) {
    var i, n = array.length, pivot, temp;
    if (!rng) {
        rng = Math.random;
    }
    for (i = n - 2; i > 0; i--) {
        pivot = rng() * (i + 1) >> 0;
        if (pivot >= i) {
            continue;
        }
        temp = array[i];
        array[i] = array[pivot];
        array[pivot] = temp;
    }
}

exports.shuffle = shuffle;
});

require.define("/datastructure/BinaryHeap.js",function(require,module,exports,__dirname,__filename,process,global){function BinaryHeap(values, orderTest) {
    if (typeof orderTest === 'undefined') {
        orderTest = function (a, b) {
            return a < b;
        }
    }
    this._lessTest = orderTest;

    if (typeof values !== 'undefined') {
        this._arr = values.slice(0);
        var arr = this._arr, i, ln = arr.length, parent;
        for (i = ln - 1; i >= 0; i--) {
            this._down(i);
        }
    } else {
        this._arr = [];
    }
}

var binaryHeap_prototype = BinaryHeap.prototype;
binaryHeap_prototype._up = function (k) {
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
};

/**
 *
 * @param {Number} k
 * @private
 */
binaryHeap_prototype._down = function (k) {
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
};

binaryHeap_prototype.push = function (el) {
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
};

binaryHeap_prototype.peek = function () {
    return this._arr[0];
};

binaryHeap_prototype.pop = function () {
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
};

binaryHeap_prototype.remove = function (data) {
    var arr = this._arr,
        i = -1, ln = arr.length - 1;
    if (ln === -1) {
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
};

binaryHeap_prototype.size = function () {
    return this._arr.length;
};

exports.BinaryHeap = BinaryHeap;
});

require.define("/datastructure/CartesianTree.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Cartesian tree is a binary tree generated from a sequence of objects
 * with there properties:
 * * It's a heap.
 * * Its in-order traversal recovers the original sequence.
 *
 * @param values
 * @param orderTest
 * @constructor
 */
function CartesianTree(values, orderTest) {
    if (typeof orderTest === 'undefined') {
        orderTest = function (a, b) {
            return a < b;
        }
    }

    this.orderTest = orderTest;
    this.array = [];
    this.parent = [];
    this.left = [];
    this.right = [];
    this.root = -1;

    if (typeof values === 'undefined') {
        return;
    }

    var length = values.length;
    if (length == 0) {
        return;
    }
    for (var i = 0; i < length; i++) {
        this.push(values[i]);
    }
}

var cartesianTree_prototype = CartesianTree.prototype;

cartesianTree_prototype.push = function (value) {
    var orderTest = this.orderTest;
    var len = this.array.length;
    if (len == 0) {
        this.array.push(value);
        this.parent.push(-1);
        this.left.push(-1);
        this.right.push(-1);
        this.root = 0;
        return;
    }
    var parent = len - 1;
    var last_parent = -1;
    while (parent != -1 && orderTest(value, this.array[parent])) {
        last_parent = parent;
        parent = this.parent[parent];
    }
    if (last_parent === -1) {
        this.parent.push(len - 1);
        this.right[len - 1] = len;
        this.left.push(-1);
    } else if (parent == -1) {
        this.parent[last_parent] = len;
        this.parent.push(-1);
        this.left.push(last_parent);
        this.root = len;
    } else {
        this.parent[last_parent] = len;
        this.parent.push(parent);
        this.right[parent] = len;
        this.left.push(last_parent);
    }
    this.right.push(-1);
    this.array.push(value);
};

/**
 * Get the minimum value in [from, to).
 * @param {Number} from
 * @param {Number} to
 */
cartesianTree_prototype.rangeMinimum = function (from, to) {
    if (this.array.length == 0) {
        return null;
    }
    if (from < 0 || to <= from || from >= this.array.length || to > this.array.length) {
        return null;
    }
    return this._rangeMinimum(this.root, from, to);
};

cartesianTree_prototype._rangeMinimum = function (root, from, to) {
    if (root < from) {
        return this._rangeMinimum(this.right[root], from, to);
    } else if (root >= to) {
        return this._rangeMinimum(this.left[root], from, to);
    } else {
        return this.array[root];
    }
};

cartesianTree_prototype.size = function () {
    return this.array.length;
};

exports.CartesianTree = CartesianTree;
});

require.define("/datastructure/RedBlackTree.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * @class
 * @constructor
 * @property {*} data
 * @param {*} data
 */
function RedBlackTreeNode(data) {
    this.data = data;
}

RedBlackTreeNode.prototype = {
    /**
     * @property {RedBlackTreeNode} parent
     */
    parent: null,

    /**
     * @property {RedBlackTreeNode} left
     */
    left: null,

    /**
     * @property {RedBlackTreeNode} right
     */
    right: null,

    /**
     * @property {boolean} red
     */
    red: true,

    /**
     * @property {number} count Count of nodes of this subtree.
     */
    count: 1,

    data: null,

    /**
     * Get the left most node in the subtree.
     * @returns {RedBlackTreeNode}
     */
    leftMost: function () {
        var node = this;
        while (node.left) {
            node = node.left;
        }
        return node;
    },

    /**
     * Get the right most node in the subtree.
     * @returns {RedBlackTreeNode}
     */
    rightMost: function () {
        var node = this;
        while (node.right) {
            node = node.right;
        }
        return node;
    }
};

/**
 * @class
 * @property {RedBlackTreeNode} root
 * @property {Number} length
 * @constructor
 */
function RedBlackTree() {
    this.root = null;
}

RedBlackTree.NODE_TYPE = RedBlackTreeNode;

RedBlackTree.prototype = {
    root: null,

    length: 0,

    /**
     * @returns {RedBlackTreeNode}
     */
    first: function () {
        return this.root && this.root.leftMost();
    },

    /**
     *
     * @returns {RedBlackTreeNode}
     */
    last: function () {
        return this.root && this.root.rightMost();
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    next: function (node) {
        if (node.right) {
            return node.right.leftMost();
        } else if (node.parent) {
            var curr = node;
            while (curr.parent && curr.parent.left !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            // Root is right most
            return null;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    prev: function (node) {
        if (node.left) {
            return node.left.rightMost();
        } else if (node.parent) {
            var curr = node;
            while (curr.parent && curr.parent.right !== curr) {
                curr = curr.parent;
            }
            return curr.parent;
        } else {
            // Root is left most
            return null;
        }
    },

    /**
     *
     * @param {Function} fn Function accepts node.data and node.
     * @param {*} [arg] Overrides this
     */
    iterate: function (fn, arg) {
        if (this.root) {
            this._nodeIterate(this.root, fn, arg);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     */
    removeNode: function (node) {
        if (node) {
            if (node.left && node.right) {
                this.swap(node, node.right.leftMost());
            }
            this._nodeRemoveLeftMost(node);
            this.length--;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node1
     * @param {RedBlackTreeNode} node2
     */
    swap: function (node1, node2) {
        var nodes = [node1.left, node2.left, node1.right, node2.right, node1.parent, node2.parent],
            isLeft1 = node1.parent && node1.parent.left === node1,
            isLeft2 = node2.parent && node2.parent.left === node2,
            red1 = node1.red,
            count1 = node1.count;
        node1.red = node2.red;
        node2.red = red1;
        node1.count = node2.count;
        node2.count = count1;
        for (var i = 0; i < 6; i++) {
            if (nodes[i] === node1) {
                nodes[i] = node2;
            } else if (nodes[i] === node2) {
                nodes[i] = node1;
            }
        }
        node2.left = nodes[0];
        node1.left = nodes[1];
        node2.right = nodes[2];
        node1.right = nodes[3];
        node2.parent = nodes[4];
        node1.parent = nodes[5];
        if (nodes[0]) {
            nodes[0].parent = node2;
        }
        if (nodes[1]) {
            nodes[1].parent = node1;
        }
        if (nodes[2]) {
            nodes[2].parent = node2;
        }
        if (nodes[3]) {
            nodes[3].parent = node1;
        }
        if (nodes[4]) {
            if (isLeft1) {
                nodes[4].left = node2;
            } else {
                nodes[4].right = node2;
            }
        } else {
            this.root = node2;
        }
        if (nodes[5]) {
            if (isLeft2) {
                nodes[5].left = node1;
            } else {
                nodes[5].right = node1;
            }
        } else {
            this.root = node1;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {boolean}
     * @private
     */
    _nodeIsRed: function (node) {
        return !!(node && node.red);
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {*}
     * @private
     */
    _nodeSibling: function (node) {
        if (node && node.parent) {
            return node == node.parent.left ? node.parent.right : node.parent.left;
        } else {
            return null;
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeColorFlip: function (node) {
        node.red = !node.red;
        node.left.red = !node.left.red;
        node.right.red = !node.right.red;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRotateLeft: function (node) {
        /**
         *
         * @type {null|RedBlackTreeNode}
         */
        var target = node.right;
        target.parent = node.parent;
        target.count = node.count;
        node.count -= target.right ? target.right.count + 1 : 1;
        if (node.parent) {
            if (node.parent.left == node) {
                node.parent.left = target;
            } else {
                node.parent.right = target;
            }
        } else {
            this.root = target;
        }
        node.right = target.left;
        if (node.right) {
            node.right.parent = node;
        }
        target.left = node;
        node.parent = target;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRotateRight: function (node) {
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var target = node.left;
        target.parent = node.parent;
        target.count = node.count;
        node.count -= target.left ? target.left.count + 1 : 1;
        if (node.parent) {
            if (node.parent.right === node) {
                node.parent.right = target;
            } else {
                node.parent.left = target;
            }
        } else {
            this.root = target;
        }
        node.left = target.right;
        if (node.left) {
            node.left.parent = node;
        }
        target.right = node;
        node.parent = target;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    prepend: function (node) {
        return this.insertAfter(null, node)
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    append: function (node) {
        return this.insertBefore(null, node)
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertBefore: function (node, newNode) {
        if (this.length == 0) {
            this.root = newNode;
            this.length = 1;
            newNode.red = false;
            return newNode;
        } else if (!node) {
            return this.insertAfter(this.last(), newNode);
        } else if (!node.left) {
            node.left = newNode;
            newNode.parent = node;
            var parent = node;
            while (parent) {
                parent.count++;
                parent = parent.parent;
            }
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertAfter(node.left && node.left.rightMost(), newNode);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} newNode
     * @returns {RedBlackTreeNode}
     */
    insertAfter: function (node, newNode) {
        if (this.length == 0) {
            this.root = newNode;
            this.length = 1;
            newNode.red = false;
            return newNode;
        } else if (!node) {
            return this.insertBefore(this.first(), newNode);
        } else if (!node.right) {
            node.right = newNode;
            newNode.parent = node;
            var parent = node;
            while (parent) {
                parent.count++;
                parent = parent.parent;
            }
            this._nodeInsertFixUp(newNode);
            return newNode;
        } else {
            return this.insertBefore(node.right && node.right.leftMost(), newNode);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeInsertFixUp: function (node) {
        // Case 1
        // assert node.red
        if (!node.parent) {
            node.red = false;
        } else if (node.parent.red) {
            // Case 2
            // Always has a grand parent
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var p = node.parent;
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var g = p.parent;
            /**
             *
             * @type {RedBlackTreeNode}
             */
            var u = g.left === p ? g.right : g.left;
            if (this._nodeIsRed(u)) {
                // Case 3
                this._nodeColorFlip(g);
                return this._nodeInsertFixUp(g);
            } else {
                // Case 4
                if (node === p.right && p === g.left) {
                    g.left = node;
                    node.parent = g;
                    if ((p.right = node.left)) {
                        p.right.parent = p;
                    }
                    node.count = p.count;
                    p.count -= node.right ? node.right.count + 1 : 1;
                    node.left = p;
                    p.parent = node;
                    p = node;
                    node = node.left;
                } else if (node === p.left && p === g.right) {
                    g.right = node;
                    node.parent = g;
                    if ((p.left = node.right)) {
                        p.left.parent = p;
                    }
                    node.count = p.count;
                    p.count -= node.left ? node.left.count + 1 : 1;
                    node.right = p;
                    p.parent = node;
                    p = node;
                    node = node.right;
                }
                // Case 5
                p.red = false;
                g.red = true;
                if (node == p.left) {
                    this._nodeRotateRight(g);
                } else {
                    this._nodeRotateLeft(g);
                }
            }
        }
        return node;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {RedBlackTreeNode} parent
     * @param {RedBlackTreeNode} sibling
     * @private
     */
    _nodeRemoveFixUp: function (node, parent, sibling) {
        if (parent === null) {
            return;
        }

        // Case 2
        // sibling's black rank is 1 more than node's.
        // Always have a parent
        // Always have a sibling
        // Not always have the node.
        if (this._nodeIsRed(sibling)) {
            parent.red = true;
            sibling.red = false;
            if (node === parent.left) {
                this._nodeRotateLeft(parent);
                sibling = parent.right;
            } else {
                this._nodeRotateRight(parent);
                sibling = parent.left;
            }
        }

        // Now sibling is black
        if (!this._nodeIsRed(sibling.left) && !this._nodeIsRed(sibling.right)) {
            sibling.red = true;
            if (!this._nodeIsRed(parent)) {
                // Case 3
                this._nodeRemoveFixUp(parent, parent.parent, this._nodeSibling(parent));
            } else {
                // Case 4
                parent.red = false;
            }
        } else {
            // Case 5
            if (node === parent.left && !this._nodeIsRed(sibling.right) && this._nodeIsRed(sibling.left)) {
                sibling.red = true;
                sibling.left.red = false;
                this._nodeRotateRight(sibling);
                sibling = sibling.parent;
            } else if (node === parent.right && !this._nodeIsRed(sibling.left) && this._nodeIsRed(sibling.right)) {
                sibling.red = true;
                sibling.right.red = false;
                this._nodeRotateLeft(sibling);
                sibling = sibling.parent;
            }

            // Case 6
            // Now sibling's far child is red.
            // node, sibling, sibling's near child are black.
            sibling.red = parent.red;
            parent.red = false;
            if (node === parent.left) {
                this._nodeRotateLeft(parent);
                sibling.right.red = false;
            } else {
                this._nodeRotateRight(parent);
                sibling.left.red = false;
            }
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @param {Function} fn
     * @param arg
     * @private
     */
    _nodeIterate: function (node, fn, arg) {
        if (node.left) {
            this._nodeIterate(node.left, fn, arg);
        }
        fn.call(arg || this, node.data, node);
        if (node.right) {
            this._nodeIterate(node.right, fn, arg);
        }
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @private
     */
    _nodeRemoveLeftMost: function (node) {
        // Note: child is nullable.
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var child = node.left || node.right;
        /**
         *
         * @type {RedBlackTreeNode}
         */
        var sibling = this._nodeSibling(node);
        if (child) {
            child.parent = node.parent;
        }
        if (node.parent) {
            if (node.parent.left === node) {
                node.parent.left = child;
            } else {
                node.parent.right = child;
            }
        } else {
            this.root = child;
        }

        var parent = node.parent;
        while (parent) {
            parent.count--;
            parent = parent.parent;
        }
        if (!node.red) {
            if (this._nodeIsRed(child)) {
                child.red = false;
            } else {
                this._nodeRemoveFixUp(child, node.parent, sibling);
            }
        }
        node.left = node.right = node.parent = null;
        node.red = false;
    }
};

exports.RedBlackTreeNode = RedBlackTreeNode;
exports.RedBlackTree = RedBlackTree;
});

require.define("/datastructure/BinarySearchTree.js",function(require,module,exports,__dirname,__filename,process,global){var fast = require('../fast'),
    RedBlackTree = fast.ds.RedBlackTree,
    RedBlackTreeNode = RedBlackTree.NODE_TYPE;
/**
 * @class
 * @extends RedBlackTree
 * @param {Function} lessTest
 * @constructor
 */
var BinarySearchTree = function (lessTest) {
    if (lessTest) {
        this.lessTest = lessTest;
    }
};

var BinarySearchTree_prototype = BinarySearchTree.prototype = new RedBlackTree();

/**
 *
 * @param a
 * @param b
 * @returns {boolean}
 */
BinarySearchTree_prototype.lessTest = function (a, b) {
    return a < b;
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
 */
BinarySearchTree_prototype.search = function (data) {
    return this._nodeSearch(this.root, data);
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
 */
BinarySearchTree_prototype.searchMaxSmallerThan = function (data) {
    return this._nodeSearchMaxSmallerThan(this.root, data);
};

/**
 *
 * @param data
 * @returns {RedBlackTreeNode}
 */
BinarySearchTree_prototype.searchMinGreaterThan = function (data) {
    return this._nodeSearchMinGreaterThan(this.root, data);
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearch = function (node, data) {
    var test = this.lessTest;
    while (node && node.data !== data) {
        if (test(data, node.data)) {
            node = node.left;
        } else {
            node = node.right;
        }
    }
    return node;
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearchMaxSmallerThan = function (node, data) {
    var test = this.lessTest,
        last = null;
    while (node) {
        if (test(node.data, data)) {
            last = node;
            node = node.right;
        } else {
            node = node.left;
        }
    }
    return last;
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeSearchMinGreaterThan = function (node, data) {
    var test = this.lessTest,
        last = null;
    while (node) {
        if (test(data, node.data)) {
            last = node;
            node = node.left;
        } else {
            node = node.right;
        }
    }
    return last;
};

/**
 *
 * @param data
 * @return {RedBlackTreeNode}
 */
BinarySearchTree_prototype.insert = function (data) {
    if (this.length === 0) {
        this.length++;
        this.root = new RedBlackTreeNode(data);
        this.root.red = false;
        return this.root;
    } else {
        this.length++;
        return this._nodeInsert(this.root, data, this.lessTest);
    }
};

/**
 *
 * @param {RedBlackTreeNode} node
 * @param data
 * @param lessTest
 * @returns {RedBlackTreeNode}
 * @private
 */
BinarySearchTree_prototype._nodeInsert = function (node, data, lessTest) {
    if (lessTest(data, node.data)) {
        if (!node.left) {
            return this.insertBefore(node, new RedBlackTreeNode(data));
        } else {
            return this._nodeInsert(node.left, data, lessTest);
        }
    } else {
        if (!node.right) {
            return this.insertAfter(node, new RedBlackTreeNode(data));
        } else {
            return this._nodeInsert(node.right, data, lessTest);
        }
    }
};

/**
 *
 * @param data
 */
BinarySearchTree_prototype.remove = function (data) {
    if (this.length) {
        this.removeNode(this.search(data));
    }
};

exports.BinarySearchTree = BinarySearchTree;
});

require.define("/datastructure/LinkedList.js",function(require,module,exports,__dirname,__filename,process,global){/**
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

});

require.define("/datastructure/ImmutableArray.js",function(require,module,exports,__dirname,__filename,process,global){/**
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

});

require.define("/numbertheory/Basics.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Greatest common divisor of two integers
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
function gcd(a, b) {
    var temp, d;
    // Stein's algorithm
    a |= 0;
    b |= 0;
    if (a < 0) {
        a = -a;
    }
    if (b < 0) {
        b = -b;
    }
    if (a === 0) {
        return b;
    }
    if (b === 0) {
        return a;
    }
    if (a === b) {
        return a;
    }
    d = 0;
    while ((a & 1) === 0 && (b & 1) === 0) {
        d++;
        a >>= 1;
        b >>= 1;
    }
    while ((a & 1) === 0) {
        a >>= 1;
    }
    while ((b & 1) === 0) {
        b >>= 1;
    }
    while (a && b && a != b) {
        if (a < b) {
            temp = a;
            a = (b - a) >> 1;
            b = temp;
            while ((a & 1) === 0) {
                a >>= 1;
            }
        } else {
            temp = b;
            b = (a - b) >> 1;
            a = temp;
            while ((b & 1) === 0) {
                b >>= 1;
            }
        }
    }
    return a << d;
}

/**
 * Returns a * b % n concerning interger overflow.
 * @param {Number} a
 * @param {Number} b
 * @param {Number} n
 * @returns {Number}
 */
function multMod(a, b, n) {
    a >>>= 0;
    b >>>= 0;
    n >>>= 0;
    a %= n;
    b %= n;
    if (a === 0) return 0;
    if (b === 0) return 0;
    if (n < 65536 || (2147483647 / a >= b)) {
        return a * b % n;
    }
    var result = 0;
    for (var r = 1; r <= b; r += r) {
        if (r & b) {
            result += a;
            result %= n;
        }
        a += a;
        a %= n;
    }
    return result;
}

/**
 * Returns pow(a,b) % n with exponentiation by squaring
 * algorithm.
 * @param a
 * @param b
 * @param n
 * @returns {number}
 */
function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    if (a == 0) {
        return 0;
    }
    if (b == 0) {
        return 1;
    }
    a %= n;
    var result = 1;
    while (b) {
        if (b & 1) {
            result = multMod(result, a, n);
        }
        a = multMod(a, a, n);
        b >>= 1;
    }
    return result;
}

exports.gcd = gcd;
exports.powerMod = powerMod;
exports.multMod = multMod;
});

require.define("/numbertheory/PrimalityTest.js",function(require,module,exports,__dirname,__filename,process,global){var fast = require('../fast');
/**
 * Miller-Rabin Primality Test with base a, odd index d and modular n,
 * and n = 2^s * d.
 * @param a
 * @param s
 * @param d
 * @param n
 * @returns {boolean}
 */
function millerRabinPrimalityTest(a, s, d, n) {
    var c = fast.nt.powerMod(a, d, n);
    if (c === 1) {
        return true;
    }
    for (var r = 0; r < s; r++) {
        if (c === n - 1) {
            return true;
        }
        c = fast.nt.multMod(c, c, n);
    }
    return false;
}

var SMALL_PRIMES = null;

/**
 * Generates all primes less than 1M using Sieve of
 * Eratosthenes algorithm.
 */
function preparePrimes() {
    SMALL_PRIMES = new Uint32Array(82025);
    SMALL_PRIMES[0] = 2;
    var index = 1;
    var bitmap = new Uint32Array(32768);
    for (var i = 3; i <= 1024; i += 2) {
        if (0 == (bitmap[i >> 5] & (1 << (i & 31)))) {
            SMALL_PRIMES[index++] = i;
            for (var j = i * i | 0, i2 = i + i; j < 1048576; j += i2) {
                bitmap[j >> 5] |= (1 << (j & 31));
            }
        }
    }
    for (; i < 1048576; i += 2) {
        if (0 == (bitmap[i >> 5] & (1 << (i & 31)))) {
            SMALL_PRIMES[index++] = i;
        }
    }
}

/**
 * Test if a small number (i.e. number can be fit into a 31-bit integer)
 * is a prime number.
 *
 * Using Miller-Rabin Primality test with base 2, 7 and 61 which covers
 * all positive integer less than 4759123141 with no false positive.
 *
 * @param {Number} small_number
 * @returns {Boolean}
 */
function primeQ(small_number) {
    small_number |= 0;
    if (small_number <= 0) {
        return false;
    }
    if (!SMALL_PRIMES) {
        preparePrimes();
    }
    if (small_number < 1048576) {
        return fast.seq.binarySearch(SMALL_PRIMES, small_number) !== -1;
    }
    if ((small_number & 1) == 0) {
        return false;
    }
    var d = (small_number - 1) >> 1;
    var s = 1;
    while ((d & 1) === 0) {
        s++;
        d >>= 1;
    }
    return millerRabinPrimalityTest(2, s, d, small_number) &&
        millerRabinPrimalityTest(7, s, d, small_number) &&
        millerRabinPrimalityTest(61, s, d, small_number);
}


exports.primeQ = primeQ;
});

require.define("/numbertheory/FNTT.js",function(require,module,exports,__dirname,__filename,process,global){/**
 *
 * @param depth
 * @param mod
 * @param root
 * @param iroot
 * @constructor
 */
function FastNumberTheoreticTransform(depth, mod, root, iroot) {
    var n = this.length = 1 << depth, c, k, rev;
    this.root = root;
    this.mod = mod;
    this.rootTable = {};
    this.inverseRootTable = {};
    for (var i = 0; i < depth; i++) {
        this.rootTable[n >> i + 1] = root;
        this.inverseRootTable[n >> i + 1] = iroot;
        root *= root;
        root %= mod;
        iroot *= iroot;
        iroot %= mod;
    }
    this.rootTable[1] = 1;
    this.inverseRootTable[1] = 1;
    this.reverseTable = FastNumberTheoreticTransform.reverseTable[n];
    if (!this.reverseTable) {
        FastNumberTheoreticTransform.reverseTable[n] = this.reverseTable = [];
        for (i = 0; i < n; i++) {
            c = n >> 1;
            k = i;
            rev = 0;
            while (c) {
                rev <<= 1;
                rev |= k & 1;
                c >>= 1;
                k >>= 1;
            }
            this.reverseTable[i] = rev;
        }
    }
    // Find smallest prime length * k + 1 > mod
    // Using BLS test: http://www.math.dartmouth.edu/~carlp/PDF/110.pdf
}

FastNumberTheoreticTransform.reverseTable = {};

FastNumberTheoreticTransform.prototype.forward = function (list) {
    var n = this.length, i, rev, reverseTable = this.reverseTable, a;
    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i];
            list[i] = list[rev];
            list[rev] = a;
        }
    }
    this.__fnttcore(list, this.rootTable);
    return list;
};

FastNumberTheoreticTransform.prototype.backward = function (list) {
    var n = this.length, i, rev, reverseTable = this.reverseTable, a;
    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i];
            list[i] = list[rev];
            list[rev] = a;
        }
    }
    this.__fnttcore(list, this.inverseRootTable);
    for (i = 0; i < n; i++) {
        list[i] *= 253;
        list[i] %= this.mod;
    }
    return list;
};

FastNumberTheoreticTransform.prototype.__fnttcore = function (list, rootTable) {
    var n = this.length,
        mod = this.mod,
        i, m, k, om, o, t;
    m = 1;
    while (m < n) {
        om = rootTable[m];
        o = 1;
        for (k = 0; k < m; k++) {
            for (i = k; i < n; i += m << 1) {
                t = o * list[i + m];
                list[i + m] = list[i] - t;
                list[i] += t;
            }
            o *= om;
            o %= mod;
        }
        m = m << 1;
    }
    for (i = 0; i < n; i++) {
        list[i] %= mod;
        list[i] += mod;
        list[i] %= mod;
    }
};

exports.FastNumberTheoreticTransform = FastNumberTheoreticTransform;
});

require.define("/numeric/FastFourierTransform.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Created with JetBrains WebStorm.
 * User: Bei ZHANG
 * Date: 12/28/12
 * Time: 1:51 AM
 * To change this template use File | Settings | File Templates.
 */


function FastFourierTransform(length) {
    var n, k, d, i, c, rev;
    n = this.length = length;
    this.sinTable = FastFourierTransform.sinTable;
    this.cosTable = FastFourierTransform.cosTable;
    for (d = 1; d < n; d <<= 1) {
        if (!(d in this.sinTable)) {
            this.sinTable[d] = Math.sin(-Math.PI / d);
            this.cosTable[d] = Math.cos(Math.PI / d);
        }
    }
    this.reverseTable = [];
    for (i = 0; i < n; i++) {
        c = n >> 1;
        k = i;
        rev = 0;
        while (c) {
            rev <<= 1;
            rev |= k & 1;
            c >>= 1;
            k >>= 1;
        }
        this.reverseTable[i] = rev;
    }
}

FastFourierTransform.sinTable = {};

FastFourierTransform.cosTable = {};

FastFourierTransform.prototype = {
    _fftcore: function (list) {
        var n = this.length,
            i, m, k, omreal, omimag, oreal, oimag, id1, id2,
            tr, ti, tmpReal,
            sinTable = this.sinTable,
            cosTable = this.cosTable;
        m = 1;
        while (m < n) {
            omreal = cosTable[m];
            omimag = sinTable[m];
            oreal = 1;
            oimag = 0;
            for (k = 0; k < m; k++) {
                for (i = k; i < n; i += m << 1) {
                    id1 = i << 1;
                    id2 = (i + m) << 1;
                    tr = (oreal * list[id2]) - (oimag * list[id2 + 1]);
                    ti = (oreal * list[id2 + 1]) + (oimag * list[id2]);

                    list[id2] = list[id1] - tr;
                    list[id2 + 1] = list[id1 + 1] - ti;
                    list[id1] += tr;
                    list[id1 + 1] += ti;
                }
                tmpReal = oreal;
                oreal = (tmpReal * omreal) - (oimag * omimag);
                oimag = (tmpReal * omimag) + (oimag * omreal);
            }
            m = m << 1;
        }
    },
    forward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            list.push(0);
            return list;
        } else {
            for (i = 0; i < n; i++) {
                rev = reverseTable[i];
                if (rev < i) {
                    a = list[i];
                    list[i] = list[rev];
                    list[rev] = a;
                }
            }
            // Expand to complex
            list.length = n * 2;
            for (i = n - 1; i >= 0; i--) {
                list[i * 2 + 1] = 0;
                list[i * 2] = list[i];
            }
            this._fftcore(list);
        }
        return list;
    },
    backward: function (list) {
        var n = this.length, i, rev, reverseTable = this.reverseTable, a;
        if (n == 1) {
            list.length = 1;
            return list;
        } else {
            for (i = 0; i < n; i++) {
                rev = reverseTable[i];
                if (rev < i) {
                    a = list[i * 2];
                    list[i * 2] = list[rev * 2];
                    list[rev * 2] = a;
                    a = list[i * 2 + 1];
                    list[i * 2 + 1] = list[rev * 2 + 1];
                    list[rev * 2 + 1] = a;
                }
            }
            for (i = 0; i < n; i++) {
                list[i * 2 + 1] = -list[i * 2 + 1];
            }
            this._fftcore(list);
            for (i = 0; i < n; i++) {
                list[i] = list[i << 1] / n;
            }
            list.length = n;
            return list;
        }
    }
};

function fft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        expn = 1 << Math.ceil(Math.log(n) / Math.log(2));
    list.length = expn;
    for (i = len; i < expn; i++) {
        list[i] = 0;
    }
    if (!FastFourierTransform[expn]) {
        FastFourierTransform[expn] = new FastFourierTransform(expn);
    }
    return FastFourierTransform[expn].forward(list);
}

function ifft(list, length) {
    var i,
        len = list.length,
        n = length || len,
        expn = 1 << Math.ceil(Math.log(n) / Math.log(2));
    list.length = expn;
    for (i = len; i < expn; i++) {
        list[i] = 0;
    }
    if (!FastFourierTransform[expn / 2]) {
        FastFourierTransform[expn / 2] = new FastFourierTransform(expn / 2);
    }
    return FastFourierTransform[expn / 2].backward(list);
}

exports.fft = fft;
exports.ifft = ifft;
});

require.define("/numeric/CubicPolynomialSolver.js",function(require,module,exports,__dirname,__filename,process,global){var PI2_3 = 2.0943951023931953; // 120 Deg

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
});

require.define("/browser.js",function(require,module,exports,__dirname,__filename,process,global){global.fast = require("./fast.js");
});
require("/browser.js");
})();
