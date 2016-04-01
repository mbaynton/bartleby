'use strict';
import {ILeadershipManager} from "./LeadershipManager";
import { inject } from "inversify";
import {ILeadershipChangeCallback} from "./LeadershipManager";
import {HealthStatus} from "./Bartleby/Bartleby";

export interface ISelfHealthStatus {
    getCode() : HealthStatus;
    getMessage() : string;
    toJson() : string;
}

@inject("ILeadershipManager")
export class SelfHealthStatus implements ISelfHealthStatus {
    code : HealthStatus;
    message : string;

    constructor(leadershipManager : ILeadershipManager) {
        leadershipManager.registerLeadershipStartedCallback(() : void  => {
            this.code = HealthStatus.passing;
            this.message = 'Up. Operating as leader.';
            this.consoleMessage();
        });

        leadershipManager.registerLeadershipEndedCallback(() : void => {
            this.code = HealthStatus.passing;
            this.message = 'Up. Not leader, standing by...';
            this.consoleMessage();
        });

        // Set a default status until the ILeadershipManager tells us what's going on.
        this.code = HealthStatus.warning;
        this.message = 'Up. Obtaining leadership status...';
    }

    toJson() : string {
        return JSON.stringify({'code': this.code, 'message': this.message})
    }

    getCode() : HealthStatus {
        return this.code;
    }

    getMessage() : string {
        return this.message;
    }

    consoleMessage() : void {
        console.log('Health status is ' + this.code + ': ' + this.message);
    }
}
