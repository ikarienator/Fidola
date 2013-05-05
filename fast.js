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
includes(ds, require("./datastructure/RedBlackTree.js"));

var nt = fast.nt = {};
includes(nt, require("./nt/PrimalityTest.js"));

var mp = fast.mp = {};
includes(mp, require("./mp/BigInteger.js"));

var dsp = fast.dsp = {};
includes(dsp, require("./dsp/FFT.js"));
includes(dsp, require("./dsp/FNTT.js"));
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
        pivot = rng() * (i + 1);
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

    data: null
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

RedBlackTree.prototype = {
    root: null,

    length: 0,

    /**
     * @returns {RedBlackTreeNode}
     */
    first: function () {
        return this._nodeLeftMost(this.root);
    },

    /**
     *
     * @returns {RedBlackTreeNode}
     */
    last: function () {
        return this._nodeRightMost(this.root);
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     */
    next: function (node) {
        if (node.right) {
            return this._nodeLeftMost(node.right);
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
            return this._nodeRightMost(node.left);
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
            if (node.right) {
                this.swap(node, this._nodeLeftMost(node.right));
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
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeLeftMost: function (node) {
        while (node && node.left) {
            node = node.left;
        }
        return node;
    },

    /**
     *
     * @param {RedBlackTreeNode} node
     * @returns {RedBlackTreeNode}
     * @private
     */
    _nodeRightMost: function (node) {
        while (node && node.right) {
            node = node.right;
        }
        return node;
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
        return this.insertBefore(null, node)
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
            return this.insertAfter(this._nodeRightMost(node.left), newNode);
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
            return this.insertBefore(this._nodeLeftMost(node.right), newNode);
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
        if (parent !== null) {
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
exports.RedBlackTree = RedBlackTree;
});

require.define("/nt/PrimalityTest.js",function(require,module,exports,__dirname,__filename,process,global){function sqrMult(a, b, n) {
    a |= 0;
    b |= 0;
    n |= 0;
    a %= n;
    b %= n;
    if (n < 65536 || (4294967296 / a >= b)) {
        return a * b % n;
    }
    var result = 0;
    for (var r = 1; r <= b; r <<= 1) {
        if (r & b) {
            result += a;
            result %= n;
        }
        a <<= 1;
        a %= n;
    }
    return result;
}

function powerMod(a, b, n) {
    // Optimization for compiler.
    a |= 0;
    b |= 0;
    n |= 0;
    if (n === 1) {
        return 0;
    }
    if (b === 0) {
        return 1;
    }
    if (a === 0) {
        return 0;
    }
    if (a === 1) {
        return 1;
    }
    var result = 1;
    while (b) {
        if (b & 1) {
            result = sqrMult(result, a, n);
        }
        a = sqrMult(a, a, n);
        b >>= 1;
    }
    return result;
}

function millerRabinPrimalityTest(a, s, d, n) {
    var c = powerMod(a, d, n);
    if (c === 1) {
        return true;
    }
    for (var r = 0; r < s; r++) {
        if (c === n - 1) {
            return true;
        }
        c = sqrMult(c, c, n);
        if (c == 1) {
            return false;
        }
    }
    return false;
}

var SMALL_PRIMES = null;

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
    SMALL_PRIMES.indexOf = function (a) {
        var lo = 0, hi = SMALL_PRIMES.length;
        while (lo + 1 < hi) {
            var mid = (lo + hi) >> 1;
            if (this[mid] === a) {
                return mid;
            } else if (this[mid] < a) {
                lo = mid + 1;
            } else {
                hi = mid;
            }
        }
        if (this[lo] == a) {
            return lo;
        }
        return -1;
    };
}

/**
 *
 * @param {Number} small_number
 * @returns {Boolean}
 */
function primeQ(small_number) {
    small_number = small_number | 0;
    if (small_number <= 0) {
        return false;
    }
    if (!SMALL_PRIMES) {
        preparePrimes();
    }
    if (small_number < 1048576) {
        return SMALL_PRIMES.indexOf(small_number) !== -1;
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

require.define("/mp/BigInteger.js",function(require,module,exports,__dirname,__filename,process,global){/**
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

var dsp = require("../dsp/FFT.js"),
    fft = dsp.fft,
    ifft = dsp.ifft,
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
});

require.define("/dsp/FFT.js",function(require,module,exports,__dirname,__filename,process,global){/**
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
    this.reverseTable = FastFourierTransform.reverseTable[n];
    if (!this.reverseTable) {
        FastFourierTransform.reverseTable[n] = this.reverseTable = [];
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
}

FastFourierTransform.sinTable = {};

FastFourierTransform.cosTable = {};

FastFourierTransform.reverseTable = {};

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

require.define("/dsp/FNTT.js",function(require,module,exports,__dirname,__filename,process,global){function FastNumberTheoreticTransform(depth, mod, root, iroot) {
    var n = this.length = 1 << depth, c, k, rev;
    this.root = root;
    this.mod = mod;
    this.rootTable = {};
    this.inverseRootTable = {};
    for (var i = 0; i < depth; i++) {
        this.rootTable[n >> i] = root;
        this.inverseRootTable[n >> i] = iroot;
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
        this.__fnttcore(list, this.rootTable);
    }
    return list;
};

FastNumberTheoreticTransform.prototype.backward = function (list) {
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
        this.__fnttcore(list, this.inverseRootTable);
        for (i = 0; i < n; i++) {
            list /= n;
        }
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
                t = o * list[i + m] % mod;
                list[i + m] = list[i] - t;
                list[i] += t;
            }
            o *= om;
            o %= mod;
        }
        m = m << 1;
    }
};

exports.FastNumberTheoreticTransform = FastNumberTheoreticTransform;
});

require.define("/browser.js",function(require,module,exports,__dirname,__filename,process,global){global.fast = require("./fast.js");
});
require("/browser.js");
})();
