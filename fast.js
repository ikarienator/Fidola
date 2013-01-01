var require = function (file, cwd) {
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
        if (exp.hasOwnProperty(symbol)) {
            module[symbol] = exp[symbol];
        }
    }
}
var seq = fast.seq = {};
includes(seq, require("./sequence/KMP"));
includes(seq, require("./sequence/LCS"));
includes(seq, require("./sequence/LCStr"));
includes(seq, require("./sequence/LIS"));
includes(seq, require("./sequence/Shuffle"));

var ds = fast.ds = {};
includes(ds, require("./datastructure/BinaryHeap.js"));
includes(ds, require("./datastructure/RedBlackTree.js"));
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

exports.LCStr = longestCommonSubarrayDP;
exports.LCStrStr = longestCommonSubstringDP;
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

exports.LIS = longestIncreasingSubsequence;
});

require.define("/sequence/Shuffle.js",function(require,module,exports,__dirname,__filename,process,global){/**
 * Randomly shuffle the array with.
 * @param {Array} array
 * @param {Function} [rng] Function generates number in (0, 1]
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

require.define("/datastructure/RedBlackTree.js",function(require,module,exports,__dirname,__filename,process,global){function RedBlackTree(lessTest) {
    if (lessTest) {
        this.lessTest = lessTest;
    }
}

function RedBlackTreeNode(data) {
    this.data = data;
}

RedBlackTreeNode.prototype = {
    parent: null,
    red: true,
    left: null,
    right: null,
    data: null
};

RedBlackTree.prototype = {
    lessTest: function (a, b) {
        return a < b;
    },

    root: null,

    length: 0,

    beforeNodeSwap: function (newNode, oldNode) {
    },

    /**
     *
     * @param {*} data
     * @return {RedBlackTreeNode} node
     */
    search: function (data) {
        return this._nodeSearch(this.root, data);
    },

    searchMaxSmallerThan: function (data) {
        return this._nodeSearchMaxSmallerThan(this.root, data);
    },

    searchMinGreaterThan: function (data) {
        return this._nodeSearchMinGreaterThan(this.root, data);
    },

    /**
     *
     * @param data
     */
    insert: function (data) {
        if (this.length === 0) {
            this.length++;
            this.root = new RedBlackTreeNode(data);
            this.root.red = false;
            return this.root;
        } else {
            this.length++;
            return this._nodeInsert(this.root, data, this.lessTest);
        }

    },

    first: function () {
        return this._nodeLeftMost(this.root);
    },

    last: function () {
        return this._nodeRightMost(this.root);
    },


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
     * @param data
     */
    remove: function (data) {
        if (this.length) {
            this.removeNode(this.search(data));
        }
    },

    removeNode: function (node) {
        var minNode;
        if (node) {
            if (node.right) {
                minNode = this._nodeLeftMost(node.right);
                this.swap(node, minNode);
                this._nodeRemoveMin(minNode);
            } else {
                this._nodeRemoveMin(node);
            }
            this.length--;
        }
    },

    swap: function (node1, node2) {
        var data1 = node1.data, data2 = node2.data;
        this.beforeNodeSwap(node1, node2);
        node1.data = data2;
        node2.data = data1;
    },

    _nodeLeftMost: function (node) {
        while (node && node.left) {
            node = node.left;
        }
        return node;
    },

    _nodeRightMost: function (node) {
        while (node && node.right) {
            node = node.right;
        }
        return node;
    },

    _nodeIsRed: function (node) {
        return node && node.red;
    },

    _nodeSibling: function (node) {
        if (node && node.parent) {
            return node == node.parent.left ? node.parent.right : node.parent.left;
        } else {
            return null;
        }
    },

    _nodeColorFlip: function (node) {
        node.red = !node.red;
        node.left.red = !node.left.red;
        node.right.red = !node.right.red;
    },

    _nodeRotateLeft: function (node) {
        var target = node.right;
        target.parent = node.parent;
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

    _nodeRotateRight: function (node) {
        var target = node.left;
        target.parent = node.parent;
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

    _nodeSearch: function (node, data) {
        var test = this.lessTest;
        while (node && node.data !== data) {
            if (test(data, node.data)) {
                node = node.left;
            } else {
                node = node.right;
            }
        }
        return node;
    },

    _nodeSearchMaxSmallerThan: function (node, data) {
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
    },

    _nodeSearchMinGreaterThan: function (node, data) {
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
    },

    _nodeInsertFixUp: function (node) {
        // Case 1
        // assert node.red
        if (!node.parent) {
            node.red = false;
        } else if (node.parent.red) {
            // Case 2
            // Always has a grand parent
            var p = node.parent,
                g = p.parent,
                u = g.left === p ? g.right : g.left;
            if (this._nodeIsRed(u)) {
                // Case 3
                this._nodeColorFlip(g);
                this._nodeInsertFixUp(g);
            } else {
                // Case 4
                if (node === p.right && p === g.left) {
                    g.left = node;
                    node.parent = g;
                    if ((p.right = node.left)) {
                        p.right.parent = p;
                    }
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

    _nodeInsert: function (node, data, lessTest) {
        var result;
        // assert node !== null
        if (lessTest(data, node.data)) {
            if (!node.left) {
                result = node.left = new RedBlackTreeNode(data);
                node.left.parent = node;
                this._nodeInsertFixUp(node.left);
                return result;
            } else {
                return this._nodeInsert(node.left, data, lessTest);
            }
        } else {
            if (!node.right) {
                result = node.right = new RedBlackTreeNode(data);
                node.right.parent = node;
                this._nodeInsertFixUp(node.right);
                return result;
            } else {
                return this._nodeInsert(node.right, data, lessTest);
            }
        }
    },

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

    _nodeIterate: function (node, fn, arg) {
        if (node.left) {
            this._nodeIterate(node.left, fn, arg);
        }
        fn.call(arg || this, node.data, node);
        if (node.right) {
            this._nodeIterate(node.right, fn, arg);
        }
    },

    _nodeRemoveMin: function (node) {
        // Note: child is nullable.
        var child = node.left || node.right,
            sibling = this._nodeSibling(node);
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
exports.RedBlackTree = RedBlackTree;
});

require.define("/browser.js",function(require,module,exports,__dirname,__filename,process,global){global.fast = require("./fast.js");
});
require("/browser.js");
