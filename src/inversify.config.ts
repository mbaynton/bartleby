import { Kernel } from "inversify";

import { ILeadershipManager, ConsulLeadershipManager } from "./LeadershipManager";
import { IHealthStatus, HealthStatus } from "./HealthStatus";

var kernel = new Kernel();

kernel.bind<ILeadershipManager>("ILeadershipManager").to(ConsulLeadershipManager).inSingletonScope();
kernel.bind<IHealthStatus>("IHealthStatus").to(HealthStatus).inSingletonScope();

export default kernel;
