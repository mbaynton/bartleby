/// <reference path="../node_modules/inversify/type_definitions/inversify/inversify.d.ts" />
/// <reference path='../declarations/node.d.ts' />
'use strict';
require("reflect-metadata");
var inversify_config_1 = require("./inversify.config");
var http = require("http");
var BartlebyClass_1 = require("./BartlebyClass");
var HealthStatus_1 = require("./HealthStatus");
// npm modules lacking Typescript typedefs
var consul = require("consul");
consul = consul();
var config = require("config");
/*
The startup sequence is:
 - If a consul service is configured for us, watch its health check. It's presumably failing, so we can't lock on it.
 - Bring up the health monitor controller and server.
 - If a consul service is configured, wait for it to exit critical state.
 - Start leadership manager.
 */
var leadershipManager = inversify_config_1.default.get("ILeadershipManager");
var bartlebyConfig = config.get('Bartleby');
var healthPort = bartlebyConfig['health port'];
var healthCheckDefined = false;
if (bartlebyConfig['consul service']) {
    healthCheckDefined = true;
}
var healthCheckWatch;
if (healthCheckDefined) {
    healthCheckWatch = consul.watch({
        method: consul.health.checks,
        options: {
            "service": bartlebyConfig['consul service'],
            "near": "_agent",
        }
    });
    healthCheckWatch.on('change', function (data, res) {
        // does Consul see Bartleby on this node as not critical?
        try {
            if (ourServiceHealthStatus(data) != 'critical') {
                healthCheckWatch.end();
                leadershipManager.run();
            }
        }
        catch (Error) {
        }
    });
}
// Start health monitor controller
var currHealthStatus = inversify_config_1.default.get("IHealthStatus");
// health server
var healthServer = http.createServer(function (request, response) {
    var httpCode = 500;
    switch (currHealthStatus.getCode()) {
        case HealthStatus_1.HealthCode.warning:
            httpCode = 429; // Consul HTTP check regards this as warning
            break;
        case HealthStatus_1.HealthCode.ok:
            httpCode = 200;
            break;
        default:
            httpCode = 500;
    }
    response.writeHead(httpCode, { 'Content-Type': 'text/plain' });
    response.end(currHealthStatus.toJson());
});
healthServer.listen(healthPort, '127.0.0.1');
if (healthCheckDefined) {
    // In case the consul already listed us not critical (fast restart?), healthChechWatch may not cause our
    // leadership willingness to be advertised.
    consul.health.checks({
        "service": bartlebyConfig['consul service'],
        "near": "_agent",
    }, function (err, result) {
        if (err) {
            console.log("Unable to poll status of " + bartlebyConfig['consul service'] + ": " + err + "\n\nWill attempt to enter the eligible leaders pool anyway, but it may fail.");
            leadershipManager.run();
        }
        else if (ourServiceHealthStatus(result) != 'critical') {
            healthCheckWatch.end();
            leadershipManager.run();
        }
        else {
            console.log('Waiting for consul to detect we are up...');
        }
    });
}
else {
    // Only retry TTL and serfHealth will be used to detect failed leaders. Session not bound to a service, so no need
    // to wait for the service to exit critical state.
    leadershipManager.run();
}
function ourServiceHealthStatus(checksResult) {
    if (Array.isArray(checksResult) && checksResult.length) {
        // Find the data for our node
        var nodeName = BartlebyClass_1.BartlebyClass.getMyConsulNodeName();
        for (var i = 0; i < checksResult; i++) {
            if (checksResult[i]['Node'] == nodeName) {
                checksResult = checksResult[i];
                break;
            }
        }
    }
    if (typeof checksResult == 'object') {
        return checksResult['Status'];
    }
    else {
        throw new Error('Incomplete input passed to ourServiceHealthStatus().');
    }
}
//# sourceMappingURL=Bartleby.js.map