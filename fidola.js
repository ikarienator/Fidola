/*
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright
    notice, this list of conditions and the following disclaimer in the
    documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/(function(){var require = function (file, cwd) {
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

require.define("/fidola.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * @namespace fidola
 */
var fidola = exports;
function includes(module, exp) {
    for (var symbol in exp) {
        module[symbol] = exp[symbol];
    }
}

/**
 * @namespace fidola.seq
 */
var seq = fidola.seq = {};
includes(seq, require("./sequence/BinarySearch"));
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

/**
 * @namespace fidola.ds
 */
var ds = fidola.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/CartesianTree.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
includes(ds, require("./datastructure/BinarySearchTree.js"));
includes(ds, require("./datastructure/LinkedList.js"));
includes(ds, require("./datastructure/ImmutableArray.js"));

/**
 * @namespace fidola.nt
 */
var nt = fidola.nt = {};
includes(nt, require("./numbertheory/Basics.js"));
includes(nt, require("./numbertheory/PrimalityTest.js"));
includes(nt, require("./numbertheory/FNTT.js"));
includes(nt, require("./arithmatic/Unsigned.js"));
includes(nt, require("./arithmatic/Integer.js"));

/**
 * @namespace fidola.numeric
 */
var numeric = fidola.numeric = {};
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
        heads = [], ln3, k, l, target = [],
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

require.define("/datastructure/BinaryHeap.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * This class provides a classic binary heap implementation.
 *
 * A binary heap is a complete binary tree that each node contains a value that is not greater than
 * that of its parent node, if present.
 *
 * - Binary heap can be constructed in O(N) time, in the sense that N is the number of elements.
 * - You can insert/delete a value to the binary heap in O(log(N)) time.
 * - You can query the minimum value of the binary heap in O(1) time.
 * - Binary heap requires O(N) space complexity.
 *
 * More about binary heap, see: http://en.wikipedia.org/wiki/Binary_heap
 *
 * @param {Array} values List of values to be used on O(n) initialization of the heap.
 * @param {Function?} orderTest The custom order test. Similar to C++'s operator < .
 * @constructor
 */
function BinaryHeap(values, orderTest) {
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

/**
 * Pull element up to the right place.
 * @param {Number} k Index of the number.
 * @private
 */
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
 * Push element down to the right place.
 * @param {Number} k Index of the number.
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

/**
 * Insert element into binary heap.
 * @param {*} el
 */
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

/**
 * Query the minimum element of the binary heap.
 * @returns {*} The minimum element of the binary heap.
 */
binaryHeap_prototype.peek = function () {
    return this._arr[0];
};

/**
 * Query the minimum element of the binary heap and remove it.
 * @returns {*} The minimum element of the binary heap.
 */
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

/**
 * Remove an element from binary heap.
 * @param data
 * @returns {boolean} Indicates whether this operation succeeded or not.
 */
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

/**
 * Get the size of the binary heap.
 * @returns {Number}
 */
binaryHeap_prototype.size = function () {
    return this._arr.length;
};

exports.BinaryHeap = BinaryHeap;

});

require.define("/datastructure/CartesianTree.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Cartesian tree is a valued binary tree generated from a sequence of objects
 * with there properties:
 * * It's a heap. i.e. value on parent node , if present, is not greater than its children's.
 * * Its in-order traversal recovers the original sequence.
 *
 * - Values in BST must be defined with an order; you can define customized order using "less test"
 *   which is similar to C++'s operator < .
 * - Like other heaps, creating a cartesian tree needs O(N) time where N is the number of elements.
 * - Searching for the minimum element in given range of indices is an O(log(N)) operation.
 * - You can add element to the end of the heap. This operation is O(N) worse case time and O(1) amortized time.
 * - Given two nodes in the tree, the minimum element between them in the original sequence is their
 *   lowest common ancestor.
 * - Cartesian tree is used in linear RMQ algorithm to convert general data in to ±1 data.
 *
 * More about Cartesian Tree, see: http://en.wikipedia.org/wiki/Cartesian_tree
 *
 * @param {Array} values The elements to initialize CartesianTree with.
 * @param {Function?} lessTest
 * @constructor
 */
function CartesianTree(values, lessTest) {
    if (typeof lessTest === 'undefined') {
        lessTest = function (a, b) {
            return a < b;
        }
    }

    this.lessTest = lessTest;
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

/**
 * Insert value to the end of the tree.
 * @param {*} value
 */
cartesianTree_prototype.push = function (value) {
    var orderTest = this.lessTest;
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

/**
 * Get the size of the tree.
 * @returns {Number}
 */
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
RedBlackTreeNode = function (data) {
    this.data = data;
};

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

require.define("/datastructure/BinarySearchTree.js",function(require,module,exports,__dirname,__filename,process,global){var fidola = require('../fidola'),
    RedBlackTree = fidola.ds.RedBlackTree,
    RedBlackTreeNode = RedBlackTree.NODE_TYPE;

/**
 * A compare based binary search tree (BST) data structure built on red black tree.
 *
 * - A BST is an ordered container. Values in BST must be defined with an order; you can define
 *   customized order using "less test" which is similar to C++'s operator < .
 *   Note: The elements must form a [strict partial order set](http://en.wikipedia.org/wiki/Partially_ordered_set#Strict_and_non-strict_partial_orders).
 * - You can insert/delete element in O(log(N)) time, in the sense that N is the number
 *   of elements in the BST.
 * - You can search the bound node of a given element in O(log(N)) time.
 * - You can find the maximum/minimum element less/greater than a given value in O(log(N)) time.
 * - BST requires O(N) space complexity. But the overhead is rather high. Consider
 *   using sorted array if performance is not an issue.
 *
 * More about BST, see: http://en.wikipedia.org/wiki/Binary_search_tree
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
 * Default less test of BST.
 * Less test defines the order of values
 * @param a
 * @param b
 * @returns {boolean}
 */
BinarySearchTree_prototype.lessTest = function (a, b) {
    return a < b;
};

/**
 * Find value in tree and returns bound node.
 *
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of data, or null if search failed.
 */
BinarySearchTree_prototype.search = function (data) {
    return this._nodeSearch(this.root, data);
};

/**
 * Find node with maximum value strictly below <code>data</code>.
 *
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of maximum value below <code>data</code>.,
 * or null if there is no value in the tree less than <code>data</code>..
 */
BinarySearchTree_prototype.searchMaxSmallerThan = function (data) {
    return this._nodeSearchMaxSmallerThan(this.root, data);
};

/**
 * Find node with minimum value strictly above <code>data</code>.
 * @param {*} data Value to search against.
 * @returns {RedBlackTreeNode} Bound node of minimum value above <code>data</code>.,
 * or null if there is no value in the tree greater than <code>data</code>..
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
 * Insert data into BST.
 * @param {*} data Value to insert.
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
 * @param {*} data
 * @param {Function} lessTest
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
 * Remove element from BST if it exists.
 * @param {*} data
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
    /**
     * Create a clone of the immutable array.
     * @returns {*}
     */
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

    /**
     * Get the nth element in the list.
     * This is a slow operation.
     *
     * @param n Index of the element.
     * @returns {*}
     */
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
     * Returns func(...func(func(z, get(0)), get(1)), get(2))... get(n))...).
     *
     * @param {*} z
     * @param {Function} func
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
     * Returns: func(get(0), func(get(1), func(get(2), ... get(n), z))...).
     *
     * @param {*} z
     * @param {Function} func
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

    /**
     * Apply <code>func</code> to all the elements and create an immutable array with the result.
     * @param {Function} func
     * @returns {ImmutableArray}
     */
    map: function (func) {
        return this.foldRight(null, function (el, res) {
            return new ImmutableArray(func(el), res);
        });
    },

    /**
     * Create an immutable array only with elements that func(el) is true.
     * @param {Function} func
     * @returns {ImmutableArray}
     */
    filter: function (func) {
        return this.foldRight(null, function (el, res) {
            if (func(el)) {
                return new ImmutableArray(el, res);
            } else {
                return res;
            }
        });
    },

    /**
     * Create an array of the elements in immutable array.
     * @returns {Array}
     */
    toArray: function () {
        return this.foldLeft([], function (res, el) {
            res.push(el);
            return res;
        });
    }
};


exports.ImmutableArray = ImmutableArray;

});

require.define("/numbertheory/Basics.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Greatest common divisor of two integers
 * @name fidola.nt.gcd
 * @param {Number} a
 * @param {Number} b
 * @returns {Number}
 */
function gcd(a, b) {
    var temp, d;
    // Stein's algorithm (binary Euclidean algorithm)
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
    if (a < b) {
        return gcd(b, a);
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
 * Extended greatest common divisor algorithm.
 * Given two integers a and b, solves the linear Diophantine equation:
 *
 *   a * s + b * t = gcd(a, b)
 *
 * where gcd(a, b) is the greatest common divisor of a and b;
 * then returns [gcd(a, b), s, t].
 *
 * @param a
 * @param b
 * @returns {Array}
 */
function egcd(a, b) {
    // Extended binary Euclidean algorithm
    // http://maths-people.anu.edu.au/~brent/pd/rpb096i.pdf
    /**
     * @type {Array}
     */
    var result;
    if (a < 0) {
        result = egcd(-a, b);
        return [result[0], -result[1], result[2]];
    }
    if (b < 0) {
        result = egcd(a, -b);
        return [result[0], result[1], -result[2]];
    }
    if (a === 0) {
        return [b, 0, 1];
    }
    if (b === 0) {
        return [a, 1, 0];
    }
    if (a === b) {
        return [a, 0, 1];
    }

    var d = 0, e = 0;
    while ((a & 1) === 0 && (b & 1) === 0) {
        d++;
        a >>= 1;
        b >>= 1;
    }
    if ((b & 1) == 0) {
        result = egcd(b, a);
        return [result[0] << d, result[2], result[1]];
    }
    while ((a & 1) == 0) {
        e++;
        a >>= 1;
    }
    result = _egcd_odd(a, b);
    while (e) {
        if ((result[1] & 1)) {
            result[1] -= b;
            result[2] += a;
        }
        result[1] >>= 1;
        e--;
    }
    return [result[0] << d, result[1], result[2]];
}

function _egcd_odd(a, b) {
    var a0 = a;
    var b0 = b;
    var m11 = 1, m12 = 0, m21 = 0, m22 = 1, temp;
    do {
        if (b < a) {
            temp = a;
            a = b;
            b = temp;
            temp = m11;
            m11 = m21;
            m21 = temp;
            temp = m12;
            m12 = m22;
            m22 = temp;
        }

        temp = a;
        a = b - a;
        b = temp;
        temp = m11;
        m11 = m21 - m11;
        m21 = temp;
        temp = m12;
        m12 = m22 - m12;
        m22 = temp;

        if (a == 0) {
            return [b, m21, m22];
        }

        while ((a & 1) == 0) {
            // Transform M_1;
            a >>= 1;
            if ((m11 & 1)) {
                m11 -= b0;
                m12 += a0;
            }
            m11 >>= 1;
            m12 >>= 1;
        }
    } while (1);
}

function multInv(a, n) {
    if (a == 0) {
        return NaN;
    }
    var e = egcd(a, n);
    if (e[0] == 1) {
        return (e[1] % n + n) % n;
    }
    return NaN;
}

/**
 * Returns a * b % n concerning interger overflow.
 * @name fidola.nt.multMod
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
 * @name fidola.nt.powerMod
 * @param {Number} a
 * @param {Number} b
 * @param {Number} n
 * @returns {Number}
 */
function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    if (b < 0) {
        a = multInv(a, n);
        if (isNaN(a)) {
            return NaN;
        }
        return powerMod(a, -b, n);
    }
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
exports.egcd = egcd;
exports.multInv = multInv;
exports.powerMod = powerMod;
exports.multMod = multMod;

});

require.define("/numbertheory/PrimalityTest.js",function(require,module,exports,__dirname,__filename,process,global){var fidola = require('../fidola');
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
    var c = fidola.nt.powerMod(a, d, n);
    if (c === 1) {
        return true;
    }
    for (var r = 0; r < s; r++) {
        if (c === n - 1) {
            return true;
        }
        c = fidola.nt.multMod(c, c, n);
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
        return fidola.seq.binarySearch(SMALL_PRIMES, small_number) !== -1;
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

require.define("/numbertheory/FNTT.js",function(require,module,exports,__dirname,__filename,process,global){var GetBitReverseTable = require('../numeric/FastFourierTransform').GetBitReverseTable;

/**
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
    this.reverseTable = GetBitReverseTable(n);
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

require.define("/numeric/FastFourierTransform.js",function(require,module,exports,__dirname,__filename,process,global){var sinTable = [];
var cosTable = [];
var _TypedArray = Float64Array;

for (var i = 0; i < 32; i++) {
    sinTable[i] = Math.sin(-Math.PI / (1 << i));
    cosTable[i] = Math.cos(Math.PI / (1 << i));
}
var reverseTables = {
    1: new Int32Array(1),
    2: new Int32Array([0, 1]),
    4: new Int32Array([0, 2, 1, 3])
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
 * Generates auxiliary data for radix-2 fft.
 *
 * @param length
 * @return {Object} Auxiliary data.
 */
function GetBitReverseTable(length) {
    if (reverseTables[length]) return reverseTables[length];
    var prevTable = GetBitReverseTable(length >> 1);
    var i, half = length >> 1;
    var table = new Int32Array(length);
    for (i = 0; i < half; i++) {
        table[i + half] = (table[i] = prevTable[i] << 1) + 1;
    }
    return table;
}

/**
 * Radix-2 Cooley–Tukey FFT algorithm.
 *
 * @param {Array} list List of components of complex numbers.
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fft_r2(list, n, offset, step) {
    var i, m, iteration, k, omreal, omimag, oreal, oimag, id1, id2,
        tr, ti, tmpReal,
        rev, a,
        reverseTable = GetBitReverseTable(n),
        offset2 = offset << 1,
        step2 = step << 1;

    for (i = 0; i < n; i++) {
        rev = reverseTable[i];
        if (rev < i) {
            a = list[i * step2 + offset2];
            list[i * step2 + offset2] = list[rev * step2 + offset2];
            list[rev * step2 + offset2] = a;
            a = list[i * step2 + 1 + offset2];
            list[i * step2 + 1 + offset2] = list[rev * step2 + 1 + offset2];
            list[rev * step2 + 1 + offset2] = a;
        }
    }

    m = 1;
    iteration = 0;
    while (m < n) {
        // Omega step.
        omreal = cosTable[iteration];
        omimag = sinTable[iteration];
        // Original omega.
        oreal = 1;
        oimag = 0;
        // Position in a stripe.
        for (k = 0; k < m; k++) {
            for (i = k; i < n; i += m << 1) {
                id1 = i * step2 + offset2;
                id2 = id1 + m * step2;
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
        iteration++;
    }
}

/**
 * Convolution of two complex list of the same size n.
 * Will be zero padded in to two radix-2 list of size a least 2n-1.
 *
 * The two lists will be destroyed.
 *
 * @private
 * @param list1
 * @param list2
 * @param n
 */
function _conv(list1, list2, n) {
    // Log 2 of 2n - 1; list1.length == 2n since its a list of complex numbers.
    var length2 = n << 1,
        i, r1, i1, r2, i2;
    _fft_r2(list1, n, 0, 1);
    _fft_r2(list2, n, 0, 1);
    for (i = 0; i < length2; i += 2) {
        r1 = list1[i];
        i1 = list1[i + 1];
        r2 = list2[i];
        i2 = list2[i + 1];
        list1[i] = (r1 * r2 - i1 * i2) / n;
        list1[i + 1] = -(r1 * i2 + i1 * r2) / n;
    }
    _fft_r2(list1, n, 0, 1);
    for (i = 1; i < length2 * 2; i += 2) {
        list1[i] = -list1[i];
    }
}

/**
 * Bluestein's algorithm to calculate non-radix 2 DFT in O(n log n) time.
 * @param list
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fft_bluestein(list, n, offset, step) {
    var length = _nextpo2(n) * 2,
        length2 = length * 2,
        an = new _TypedArray(length2),
        bn = new _TypedArray(length2),
        ro, io, cos, sin,
        offset2 = offset * 2,
        ang = Math.PI / n,
        a;
    for (var i = 0, j = 0; i < n * 2; i += 2, j++) {
        ro = list[i * step + offset2] || 0;
        io = list[i * step + offset2 + 1] || 0;
        a = j * j * ang;
        cos = Math.cos(a);
        sin = Math.sin(a);
        an[i] = cos * ro + sin * io;
        an[i + 1] = cos * io - sin * ro;
        bn[i] = cos;
        bn[i + 1] = sin;
        if (i > 0) {
          bn[length2 - i] = cos;
          bn[length2 - i + 1] = sin;
        }
    }
    _conv(an, new _TypedArray(bn), length);
    for (i = 0; i < n * 2; i += 2) {
        ro = an[i];
        io = an[i + 1];
        list[i * step + offset2] = ro * bn[i] + io * bn[i + 1];
        list[i * step + offset2 + 1] = -ro * bn[i + 1] + io * bn[i];
    }
}

/**
 * FFT of general size in O(n log n) time.
 * @param list
 * @param {Number} n Lengths of the list.
 * @param {Number} offset Offset of the list. Useful for 2D fft.
 * @param {Number} step Step of the list. Useful for 2D fft.
 * @private
 */
function _fftcore(list, n, offset, step) {
    if (n === (n & -n)) { // Power of 2.
        _fft_r2(list, n, offset, step);
    } else {
        _fft_bluestein(list, n, offset, step);
    }
}

/**
 * Perform discrete Fourier transform of list of complex numbers in O(nlogn) time.
 *
 * The size of the list is not required to be a power of 2, whereas calculating
 * such a list is way faster than general case (normally about 4~5x).
 *
 * Discrete Fourier Transform & Inverse Discrete Fourier Transform
 * ===============================================================
 * Discrete Fourier transform (DFT) convert a list of time domain samples into a list of frequencies domain samples.
 * Pseudo C++ code to define DFT:
 *
 * vector<complex<double> > dft(const vector<complex<double> >& list) {
 *   vector<complex<double> > result;
 *   for (int freq = 0; freq < list.size(); freq++) {
 *     complex<double> amp(0, 0);
 *     for (int i = 0; i < list.size(); i++) {
 *       amp +=
 *           list[j] * exp(complex<double>(0, -2 * M_PI * i * freq / list.size()));
 *     }
 *     result.push_back(amp);
 *   }
 *   return result;
 * }
 *
 * Perform inverse discrete Fourier transform to recover the original list:
 * Pseudo C++ code to define IDFT:
 *
 * vector<complex<double> > idft(const vector<complex<double> >& list) {
 *   vector<complex<double> > result;
 *   for (int i = 0; i < list.size(); i++) {
 *     complex<double> amp(0, 0);
 *     for (int i = 0; i < list.size(); i++) {
 *       amp +=
 *           list[i] * exp(complex<double>(0, 2 * M_PI * i * freq / list.size()));
 *     }
 *     result.push_back(amp/list.size());
 *   }
 *   return result;
 * }
 *
 * The core part of DFT and IDFT are pretty similar, in fact we can preprocess a list
 * and use the dft program to perform idft:
 *
 * vector<complex<double> > idft(const vector<complex<double> >& list) {
 *   for (int i = 0; i < list.size(); i++) {
 *      list[i] = conj(list[i]) / list.size();
 *   }
 *   return dft(list);
 * }
 *
 * With this property we can share most of the code and focus only on DFT.
 *
 * fidola.numeric.fft/fidola.numeric.ifft
 * ======================================
 *
 * The algorithm we implemented in Fidola is the combination of Radix-2 Cooley-Tukey fast fourier
 * transform algorithm for lists of size of a power of 2, which will calculate the DFT in O(nlogn) time;
 * For other sizes, we use Bluestein's FFT algorithm which convert the problem into a problem of the first
 * case in O(n) time, then calculate in O(nlogn) time.
 *
 * For more about DFT, Cooley-Tukey algorithm and Bluestein's algorithm:
 *
 * 1. http://en.wikipedia.org/wiki/Discrete_Fourier_transform
 * 2. http://en.wikipedia.org/wiki/Fast_Fourier_transform
 * 3. http://en.wikipedia.org/wiki/Cooley%E2%80%93Tukey_FFT_algorithm
 * 4. http://en.wikipedia.org/wiki/Bluestein's_FFT_algorithm
 *
 * @param {Array|Float32Array|Float64Array} list List complex presented as [real0, imag0, real1, imag1 ... real[n-1], imag[n-1]].
 * @param {Number} [n] Number of complex numbers. Must be no larger than half of the length of `list`.
 * @returns {*}
 */
function fft(list, n) {
    n = n || list.length >> 1;
    _fftcore(list, n, 0, 1);
    return list;
}

/**
 * Perform inverse discrete Fourier transform of list of complex numbers in O(nlogn) time.
 *
 * Refer to {#fft} for more information.
 *
 * @param {Array|Float32Array|Float64Array} list List complex presented as [real0, imag0, real1, imag1 ... real[n-1], imag[n-1]].
 * @param {Number} [n] Number of complex numbers. Must be no larger than half of the length of `list`.
 * @returns {*}
 */
function ifft(list, n) {
    n = n || list.length >> 1;
    var i, n2 = n << 1;
    for (i = 0; i < n2; i += 2) {
        list[i] = list[i] / n;
        list[i + 1] = -list[i + 1] / n;
    }
    _fftcore(list, n, 0, 1);
    for (i = 0; i < n2; i += 2) {
        list[i + 1] = -list[i + 1];
    }
    return list;
}


function fft2d(list, m, n) {
    var i;
    for (i = 0; i < n; i++) {
        _fftcore(list, m, i * m, 1);
    }
    for (i = 0; i < m; i++) {
        _fftcore(list, n, i, m);
    }
    return list;
}

function ifft2d(list, m, n) {
    var i, area = m * n, area2 = area * 2;
    for (i = 0; i < area2; i += 2) {
        list[i] = list[i] / area;
        list[i + 1] = -list[i + 1] / area;
    }
    for (i = 0; i < n; i++) {
        _fftcore(list, m, i * m, 1);
    }
    for (i = 0; i < m; i++) {
        _fftcore(list, n, i, m);
    }
    for (i = 0; i < area2; i += 2) {
        list[i + 1] = -list[i + 1];
    }
    return list;
}

exports.GetBitReverseTable = GetBitReverseTable;
exports.fft = fft;
exports.ifft = ifft;
exports.fft2d = fft2d;
exports.ifft2d = ifft2d;

});

require.define("/arithmatic/Unsigned.js",function(require,module,exports,__dirname,__filename,process,global){/**
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
    for (i = 0; i < len2; i++) {
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
    for (i = 0; i < len2; i++) {
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

});

require.define("/arithmatic/Integer.js",function(require,module,exports,__dirname,__filename,process,global){var Unsigned = require('./Unsigned').Unsigned;

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

require.define("/browser.js",function(require,module,exports,__dirname,__filename,process,global){global.fidola = require("./fidola.js");
});
require("/browser.js");
})();
