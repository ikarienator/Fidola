function longestIncreasingSubsequence(array) {
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
