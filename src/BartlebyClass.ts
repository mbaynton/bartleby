'use strict';
// Eventually, should refactor all of Bartleby.ts into this class
import * as os from "os";
import config = require("config");

export class BartlebyClass {
    // Returns the node name consul identifies this node as.
    static getMyConsulNodeName() {
        return os.hostname().split('.')[0];
    }
}
