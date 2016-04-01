import { IRule } from "../Rules";

export interface IRuleBuilder {
    getTopLevelRules() : IRule[];
}
