/// <reference path='../../../../../../declarations/chai.d.ts' />
import {MockBRSFileLoader} from "./Mocks";
import BRSFileRuleBuilder from "../../../../../Bartleby/Rules/Builder/BRSFile/BRSFileRuleBuilder";
import chai = require('chai');
import {IRule, CatalogType } from "../../../../../Bartleby/Rules";
import {HealthStatus} from "../../../../../Bartleby/Bartleby";

var expect = chai.expect;

describe('BRSFileRuleBuilder', function() {
    var baseCase = 'Node = passing { console.log("a node is passing"); }';

    it('Should throw when the file is empty', function() {
        var sysInTest = new BRSFileRuleBuilder(new MockBRSFileLoader(''));
        expect(sysInTest.getTopLevelRules).to.throw();
    });

    it('Produces the expected rule from the base case file', function() {
        var sysInTest = new BRSFileRuleBuilder(new MockBRSFileLoader(baseCase));
        var rules = sysInTest.getTopLevelRules();
        expect(rules).to.have.length(1);
        var rule : IRule = rules[0];
        expect(rule.getSelector().getCatalogType()).to.equal(CatalogType.Node);
        expect(rule.getComparisonOperator()).to.equal("=");
        expect(rule.getHealthStatus()).to.equal(HealthStatus.passing);
        expect(rule.getReactions()).to.have.length(1);
        expect(rule.getNextChild()).to.be.null;
    });
});

