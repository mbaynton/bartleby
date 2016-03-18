/// <reference path="../node_modules/inversify/type_definitions/inversify/inversify.d.ts" />
/// <reference path='../declarations/node.d.ts' />

'use strict';
import "reflect-metadata";
import kernel from "./inversify.config";
import * as http from "http";

import {BartlebyClass} from "./BartlebyClass";
import { IHealthStatus, HealthCode } from "./HealthStatus";
import { ILeadershipManager } from "./LeadershipManager";
// npm modules lacking Typescript typedefs
import consul = require("consul");
consul = consul();
import config = require("config");

/*
The startup sequence is:
 - If a consul service is configured for us, watch its health check. It's presumably failing, so we can't lock on it.
 - Bring up the health monitor controller and server.
 - If a consul service is configured, wait for it to exit critical state.
 - Start leadership manager.
 */
var leadershipManager = kernel.get<ILeadershipManager>("ILeadershipManager");
var bartlebyConfig = config.get('Bartleby');
var healthPort : number = bartlebyConfig['health port'];
var healthCheckDefined : boolean = false;
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

    healthCheckWatch.on('change', function(data, res) {
        // does Consul see Bartleby on this node as not critical?
        try {
            if (ourServiceHealthStatus(data) != 'critical') {
                healthCheckWatch.end();
                leadershipManager.run();
            }
        } catch (Error) {
            // Changes may not pertain to our node, which throws an Error, but can be ignored.
        }
    });
}

// Start health monitor controller
var currHealthStatus = kernel.get<IHealthStatus>("IHealthStatus");

// health server
var healthServer = http.createServer(function(request, response) {
    var httpCode : number = 500;
    switch (currHealthStatus.getCode()) {
        case HealthCode.warning:
            httpCode = 429; // Consul HTTP check regards this as warning
            break;
        case HealthCode.ok:
            httpCode = 200;
            break;
        default:
            httpCode = 500;
    }
    response.writeHead(httpCode, {'Content-Type': 'text/plain'});
    response.end(currHealthStatus.toJson());
    }
);
healthServer.listen(healthPort, '127.0.0.1');

if (healthCheckDefined) {
    // In case the consul already listed us not critical (fast restart?), healthChechWatch may not cause our
    // leadership willingness to be advertised.
    consul.health.checks({
        "service": bartlebyConfig['consul service'],
        "near": "_agent",
    }, function(err, result) {
        if(err) {
            console.log ("Unable to poll status of " + bartlebyConfig['consul service'] + ": " + err + "\n\nWill attempt to enter the eligible leaders pool anyway, but it may fail.");
            leadershipManager.run();
        } else if (ourServiceHealthStatus(result) != 'critical') {
            healthCheckWatch.end();
            leadershipManager.run();
        } else {
            console.log('Waiting for consul to detect we are up...');
        }
    });
} else {
    // Only retry TTL and serfHealth will be used to detect failed leaders. Session not bound to a service, so no need
    // to wait for the service to exit critical state.
    leadershipManager.run();
}

function ourServiceHealthStatus(checksResult:any) : string {
    if (Array.isArray(checksResult) && checksResult.length) {
        // Find the data for our node
        var nodeName = BartlebyClass.getMyConsulNodeName();
        for (var i : number = 0; i < checksResult; i++) {
            if (checksResult[i]['Node'] == nodeName) {
                checksResult = checksResult[i];
                break;
            }
        }
    }
    if (typeof checksResult == 'object') {
        return checksResult['Status'];
    } else {
        throw new Error('Incomplete input passed to ourServiceHealthStatus().');
    }
}