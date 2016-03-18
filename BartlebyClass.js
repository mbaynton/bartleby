'use strict';
// Eventually, should refactor all of Bartleby.ts into this class
var os = require("os");
var BartlebyClass = (function () {
    function BartlebyClass() {
    }
    // Returns the node name consul identifies this node as.
    BartlebyClass.getMyConsulNodeName = function () {
        return os.hostname().split('.')[0];
    };
    return BartlebyClass;
}());
exports.BartlebyClass = BartlebyClass;
//# sourceMappingURL=BartlebyClass.js.map