global.describe = function (name, fn) {
    fn();
};
global.it = function (name, fn) {
    fn();
};
global.expect = require('expect.js');
require('../src/fast.node.js');
require('./spec/Sequence.spec.js');