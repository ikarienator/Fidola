/**
 * Randomly shuffle the array with.
 * @param {Array} array
 */
function shuffle(array) {
    var i, n = array.length, pivot, temp;
    for (i = n - 2; i > 0; i--) {
        pivot = Math.random() * (i + 1);
        if (pivot >= i) {
            continue;
        }
        temp = array[i];
        array[i] = array[pivot];
        array[pivot] = temp;
    }
}

exports.shuffle = shuffle;