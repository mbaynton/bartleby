"use strict";
var Promise = require("bluebird");
var BartlebyClass_1 = require("./BartlebyClass");
// npm modules lacking Typescript typedefs
var consul = require("consul");
consul = consul({ 'promisify': Promise.fromCallback });
var config = require("config");
var ConsulLeadershipManager = (function () {
    function ConsulLeadershipManager() {
        var _this = this;
        this.kvKey = 'service/bartleby/leader';
        this._isLeader = null;
        this.runRequested = false;
        this.run = function () {
            // Only try to acquire the lock once after the consul lock is available, but do not limit after that.
            if (!_this.p_consulLock.isFulfilled()) {
                if (!_this.runRequested) {
                    _this.p_consulLock.then(function (consulLock) { consulLock.acquire(); });
                }
                _this.runRequested = true;
            }
            else {
                _this.p_consulLock.then(function (consulLock) { consulLock.acquire(); });
            }
        };
        this.handleLeadershipAcquisition = function () {
            if (!_this._isLeader) {
                _this._isLeader = true;
                _this.invokeCallbacks('started');
            }
            else {
                console.log('Unexpected leadership acquisition event from consul -- is already leader.');
            }
        };
        this.handleLeadershipLoss = function (evt) {
            if (_this._isLeader || _this._isLeader === null) {
                _this._isLeader = false;
                _this.invokeCallbacks('ended');
            }
        };
        this.handleLeadershipElectionError = function (evt) {
            // If the consul and/or node-consul leadership election mechanism experiences trouble,
            // TODO: retry lock acquisition a few times. If that does not work, we must fail this instance.
            _this._isLeader = null;
            console.log('Leadership election error');
            console.log(evt);
        };
        this.startedCallbacks = [];
        this.endedCallbacks = [];
        // Consul session details from config
        var bartlebyConfig = config.get('Bartleby');
        this.sessionLockDelay = bartlebyConfig['leader transfer minimum secs'];
        // consul lock promisified because it is dependent on finding the appropriate consul CheckID to couple to.
        this.p_consulLock = consul.health.checks({ "service": bartlebyConfig['consul service'], "near": "_agent" })
            .then(function (data) {
            // Find checks for this node
            var ourChecks = [];
            var hostname = BartlebyClass_1.BartlebyClass.getMyConsulNodeName();
            for (var i = 0; i < data.length; i++) {
                var checkObj = data[i];
                if (checkObj["Node"] == hostname) {
                    ourChecks.push(checkObj);
                }
            }
            if (ourChecks.length == 0) {
                throw new Error("Unable to locate consul health checks registered to node " + hostname + " for service " + bartlebyConfig['consul service']);
            }
            else {
                // favor non-serfHealth
                var customChecks = ourChecks.filter(function (checkObj) { return checkObj['CheckID'] != 'serfHealth'; });
                if (customChecks.length) {
                    return customChecks[0]['CheckID'];
                }
                else {
                    return ourChecks[0]['CheckID'];
                }
            }
        })
            .then(function (checkId) {
            var consulLock = consul.lock({ key: _this.kvKey, session: {
                    lockdelay: _this.sessionLockDelay + 's',
                    checks: [
                        checkId
                    ],
                    name: 'Bartleby leadership'
                }
            });
            consulLock.on('acquire', _this.handleLeadershipAcquisition);
            consulLock.on('release', _this.handleLeadershipLoss);
            consulLock.on('end', _this.handleLeadershipLoss);
            consulLock.on('retry', _this.handleLeadershipLoss);
            consulLock.on('error', _this.handleLeadershipElectionError);
            return consulLock;
        });
    }
    ConsulLeadershipManager.prototype.registerLeadershipStartedCallback = function (callback) {
        this.startedCallbacks.push(callback);
        if (this._isLeader !== null && this.isLeader()) {
            this.invokeCallback(callback);
        }
    };
    ConsulLeadershipManager.prototype.registerLeadershipEndedCallback = function (callback) {
        this.endedCallbacks.push(callback);
        if (this._isLeader !== null && !this.isLeader()) {
            this.invokeCallback(callback);
        }
    };
    ConsulLeadershipManager.prototype.isLeader = function () {
        return this._isLeader === true;
    };
    ConsulLeadershipManager.prototype.invokeCallbacks = function (type) {
        var callbacks;
        switch (type) {
            case 'started':
                callbacks = this.startedCallbacks;
                break;
            case 'ended':
                callbacks = this.endedCallbacks;
                break;
        }
        for (var i = 0; i < callbacks.length; i++) {
            this.invokeCallback(callbacks[i]);
        }
    };
    ConsulLeadershipManager.prototype.invokeCallback = function (callback) {
        callback();
    };
    return ConsulLeadershipManager;
}());
exports.ConsulLeadershipManager = ConsulLeadershipManager;
//# sourceMappingURL=LeadershipManager.js.map