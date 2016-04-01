/*
Because Bartleby is designed to merely react to changes by making network calls to other services,
a single instance should be sufficient to handle even large environments. However, for high availability, many
instances may be deployed, with others ready to take control if necessary. This module makes sure there is always
a leader and notifies registered callbacks about leadership changes.
 */
/// <reference path='../declarations/node.d.ts' />
import * as os from "os";
import * as Promise from "bluebird";
import { BartlebyClass } from "./Bartleby/Bartleby";
// npm modules lacking Typescript typedefs
import consul = require("consul");
consul = consul({'promisify': Promise.fromCallback});
import config = require("config");

export interface ILeadershipChangeCallback {
    () : void;
}

export interface ILeadershipManager {
    run() : void;

    registerLeadershipStartedCallback(callback : ILeadershipChangeCallback) : void;

    registerLeadershipEndedCallback(callback : ILeadershipChangeCallback) : void;

    isLeader() : boolean;
}

export class ConsulLeadershipManager implements ILeadershipManager {
    private kvKey : string = 'service/bartleby/leader';
    private sessionLockDelay : number;
    private startedCallbacks:ILeadershipChangeCallback[];
    private endedCallbacks:ILeadershipChangeCallback[];
    private _isLeader : boolean = null;
    private p_consulLock : Promise<any>;
    private runRequested : boolean = false;

    constructor() {
        this.startedCallbacks = [];
        this.endedCallbacks = [];

        // Consul session details from config
        var bartlebyConfig = config.get('Bartleby');
        this.sessionLockDelay = bartlebyConfig['leader transfer minimum secs'];

        // consul lock promisified because it is dependent on finding the appropriate consul CheckID to couple to.
        this.p_consulLock = consul.health.checks({"service": bartlebyConfig['consul service'], "near": "_agent"})
        .then(function(data : Array<any>) {
            // Find checks for this node
            var ourChecks = [];

            var hostname = BartlebyClass.getMyConsulNodeName();
            for (var i : number = 0; i < data.length; i++) {
                var checkObj = data[i];
                if (checkObj["Node"] == hostname) {
                    ourChecks.push(checkObj);
                }
            }

            if (ourChecks.length == 0) {
                throw new Error("Unable to locate consul health checks registered to node " + hostname + " for service " + bartlebyConfig['consul service']);
            } else {
                // favor non-serfHealth
                var customChecks = ourChecks.filter(function(checkObj) { return checkObj['CheckID'] != 'serfHealth'});
                if (customChecks.length) {
                    return customChecks[0]['CheckID'];
                } else {
                    return ourChecks[0]['CheckID'];
                }
            }
        })
        .then((checkId) => {
            var consulLock = consul.lock({ key: this.kvKey, session: {
                lockdelay: this.sessionLockDelay + 's',
                checks: [
                    checkId
                ],
                name: 'Bartleby leadership'
            }
            });
            consulLock.on('acquire', this.handleLeadershipAcquisition);
            consulLock.on('release', this.handleLeadershipLoss);
            consulLock.on('end', this.handleLeadershipLoss);
            consulLock.on('retry', this.handleLeadershipLoss);
            consulLock.on('error', this.handleLeadershipElectionError)
            return consulLock;
        });
    }

    registerLeadershipStartedCallback(callback : ILeadershipChangeCallback) {
        this.startedCallbacks.push(callback);
        if (this._isLeader !== null && this.isLeader()) {
            this.invokeCallback(callback);
        }
    }

    registerLeadershipEndedCallback(callback : ILeadershipChangeCallback) {
        this.endedCallbacks.push(callback);
        if (this._isLeader !== null && ! this.isLeader()) {
            this.invokeCallback(callback);
        }
    }

    isLeader() : boolean {
        return this._isLeader === true;
    }

    public run = () => {
        // Only try to acquire the lock once after the consul lock is available, but do not limit after that.
        if (! this.p_consulLock.isFulfilled() ) {
            if (! this.runRequested) {
                this.p_consulLock.then(function(consulLock) { consulLock.acquire() });
            }
            this.runRequested = true;
        } else {
            this.p_consulLock.then(function(consulLock) { consulLock.acquire() });
        }
    }

    private handleLeadershipAcquisition = () => {
        if (! this._isLeader) {
            this._isLeader = true;
            this.invokeCallbacks('started');
        } else {
            console.log('Unexpected leadership acquisition event from consul -- is already leader.');
        }
    }

    private handleLeadershipLoss = (evt) => {
        if (this._isLeader || this._isLeader === null) {
            this._isLeader = false;
            this.invokeCallbacks('ended');
        }
    }

    private handleLeadershipElectionError = (evt) => {
        // If the consul and/or node-consul leadership election mechanism experiences trouble,
        // TODO: retry lock acquisition a few times. If that does not work, we must fail this instance.
        this._isLeader = null;
        console.log('Leadership election error');
        console.log(evt);
    }

    private invokeCallbacks(type : string) : void {
        var callbacks : ILeadershipChangeCallback[];
        switch(type) {
            case 'started':
                callbacks = this.startedCallbacks;
                break;
            case 'ended':
                callbacks = this.endedCallbacks;
                break;
        }

        for(var i : number = 0; i < callbacks.length; i++) {
            this.invokeCallback(callbacks[i]);
        }
    }

    private invokeCallback(callback : ILeadershipChangeCallback) {
        callback();
    }
}
