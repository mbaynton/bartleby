'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var inversify_1 = require("inversify");
var HealthStatus = (function () {
    function HealthStatus(leadershipManager) {
        var _this = this;
        leadershipManager.registerLeadershipStartedCallback(function () {
            _this.code = HealthCode.ok;
            _this.message = 'Up. Operating as leader.';
            _this.consoleMessage();
        });
        leadershipManager.registerLeadershipEndedCallback(function () {
            _this.code = HealthCode.ok;
            _this.message = 'Up. Not leader, standing by...';
            _this.consoleMessage();
        });
        // Set a default status until the ILeadershipManager tells us what's going on.
        this.code = HealthCode.warning;
        this.message = 'Up. Obtaining leadership status...';
    }
    HealthStatus.prototype.toJson = function () {
        return JSON.stringify({ 'code': this.code, 'message': this.message });
    };
    HealthStatus.prototype.getCode = function () {
        return this.code;
    };
    HealthStatus.prototype.getMessage = function () {
        return this.message;
    };
    HealthStatus.prototype.consoleMessage = function () {
        console.log('Health status is ' + this.code + ': ' + this.message);
    };
    HealthStatus = __decorate([
        inversify_1.inject("ILeadershipManager")
    ], HealthStatus);
    return HealthStatus;
}());
exports.HealthStatus = HealthStatus;
(function (HealthCode) {
    HealthCode[HealthCode["ok"] = 0] = "ok";
    HealthCode[HealthCode["warning"] = 1] = "warning";
    HealthCode[HealthCode["critical"] = 2] = "critical";
})(exports.HealthCode || (exports.HealthCode = {}));
var HealthCode = exports.HealthCode;
;
//# sourceMappingURL=HealthStatus.js.map