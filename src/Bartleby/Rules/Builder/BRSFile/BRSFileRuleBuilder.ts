import { inject } from "inversify";
import { IRuleBuilder } from "../../Builder";
import * as Rules from "../../../Rules";
// npm modules lacking Typescript typedefs
import config = require("config");
import p = require("./RuleParser.js");
import fs = require("fs");
import { HealthStatus } from "../../../../Bartleby/Bartleby";

@inject("IBRSFileLoader")
export default class BRSFileRuleBuilder implements IRuleBuilder {
    private loader : IBRSFileLoader;

    constructor(loader : IBRSFileLoader) {
        this.loader = loader;
    }

    getTopLevelRules() : Rules.IRule[] {
        var parser = p.parser;
        parser.yy = { Rules: Rules, HealthStatus: HealthStatus };

        var f = this.loader.getNextFile();
        var rules : Rules.IRule[] = [];
        while (f) {
            var newRules = parser.parse(f.contents);
            console.log(newRules.length);
            Array.prototype.push.apply(rules, newRules);
            f = this.loader.getNextFile();
        }

        return rules;
    }
}

export interface IBRSFileLoader {
    getNextFile() : BRSFile;
}

export class BRSFile {
    filename : string; // for keeping track if desired in parse error output
    contents : string;

    constructor(filename : string, contents : string) {
        this.filename = filename;
        this.contents = contents;
    }
}

export class BRSFileLoader implements IBRSFileLoader {
    private isDone : boolean = false;

    getNextFile() : BRSFile {
        if (this.isDone) {
            return null;
        } else {
            var path = config.get("Bartleby.Rules.Builder.BRSFile.path");
            var brs = fs.readFileSync(path, "utf8");
            this.isDone = true;
            return new BRSFile(path, brs);
        }
    }
}