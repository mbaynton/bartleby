'use strict';
import * as os from "os";
import config = require("config");

export class Bartleby {
    // Returns the node name consul identifies this node as.
    static getMyConsulNodeName() {
        return os.hostname().split('.')[0];
    }
}

export enum HealthStatus {passing, warning, critical};
