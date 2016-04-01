/// <reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts" />
import "reflect-metadata";
import { Kernel } from "inversify";

import { ILeadershipManager, ConsulLeadershipManager } from "./LeadershipManager";
import { ISelfHealthStatus, SelfHealthStatus } from "./SelfHealthStatus";
import { IRuleBuilder } from "./Bartleby/Rules/Builder";
import BRSFileRuleBuilder from "./Bartleby/Rules/Builder/BRSFile/BRSFileRuleBuilder";
import { IBRSFileLoader, BRSFileLoader } from "./Bartleby/Rules/Builder/BRSFile/BRSFileRuleBuilder";

var kernel = new Kernel();

// Core classes
kernel.bind<ILeadershipManager>("ILeadershipManager").to(ConsulLeadershipManager).inSingletonScope();
kernel.bind<ISelfHealthStatus>("ISelfHealthStatus").to(SelfHealthStatus).inSingletonScope();

// Rules
kernel.bind<IRuleBuilder>("IRuleBuilder").to(BRSFileRuleBuilder);
kernel.bind<IBRSFileLoader>("IBRSFileLoader").to(BRSFileLoader);

export default kernel;
