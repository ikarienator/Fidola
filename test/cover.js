global.describe = function (name, fn) {
    fn();
};
global.it = function (name, fn) {
    fn();
};

require("./test.js");