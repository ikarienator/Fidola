function binarySearch(sortedArray, needle) {
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
