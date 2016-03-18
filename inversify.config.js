"use strict";
var inversify_1 = require("inversify");
var LeadershipManager_1 = require("./LeadershipManager");
var HealthStatus_1 = require("./HealthStatus");
var kernel = new inversify_1.Kernel();
kernel.bind("ILeadershipManager").to(LeadershipManager_1.ConsulLeadershipManager).inSingletonScope();
kernel.bind("IHealthStatus").to(HealthStatus_1.HealthStatus).inSingletonScope();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = kernel;
//# sourceMappingURL=inversify.config.js.map