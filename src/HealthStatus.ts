'use strict';
import {ILeadershipManager} from "./LeadershipManager";
import { inject } from "inversify";
import {ILeadershipChangeCallback} from "./LeadershipManager";

export interface IHealthStatus {
    getCode() : HealthCode;
    getMessage() : string;
    toJson() : string;
}

@inject("ILeadershipManager")
export class HealthStatus implements IHealthStatus {
    code : HealthCode;
    message : string;

    constructor(leadershipManager : ILeadershipManager) {
        leadershipManager.registerLeadershipStartedCallback(() : void  => {
            this.code = HealthCode.ok;
            this.message = 'Up. Operating as leader.';
            this.consoleMessage();
        });

        leadershipManager.registerLeadershipEndedCallback(() : void => {
            this.code = HealthCode.ok;
            this.message = 'Up. Not leader, standing by...';
            this.consoleMessage();
        });

        // Set a default status until the ILeadershipManager tells us what's going on.
        this.code = HealthCode.warning;
        this.message = 'Up. Obtaining leadership status...';
    }

    toJson() : string {
        return JSON.stringify({'code': this.code, 'message': this.message})
    }

    getCode() : HealthCode {
        return this.code;
    }

    getMessage() : string {
        return this.message;
    }

    consoleMessage() : void {
        console.log('Health status is ' + this.code + ': ' + this.message);
    }
}

export enum HealthCode {ok, warning, critical};
