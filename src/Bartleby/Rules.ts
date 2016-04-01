import {HealthStatus} from "./Bartleby";

export enum CatalogType { Node, Service };

export interface ICatalogEntry {
    /**
     * Provides the consul catalog data for the represented catalog entry.
     *
     * TODO: Should the callback be a Bluebird promise instead?
     */
    fetchCatalogInfo(callback: (Object)) : void;
}

export interface ISelector {
    /**
     * Returns the catalog entries that match the selector class and filters.
     */
    getMatches() : ICatalogEntry[];

    /**
     * Indicates whether the selector matches Nodes or Services.
     */
    getCatalogType() : CatalogType;
}

export class Selector implements ISelector {
    catalogType : CatalogType;

    constructor(catalogType : CatalogType) {
        this.catalogType = catalogType;
    }

    // TODO: do we need to make this return a promise?
    getMatches() {
        return [];
    }

    getCatalogType() : CatalogType {
        return this.catalogType;
    }
}

export interface IRule {
    getSelector() : ISelector;

    getNextChild() : IRule;

    getComparisonOperator() : string;

    getHealthStatus() : HealthStatus;

    getReactions() : any[]; // Stubbing return type for now

    /**
     * Determines if the condition this rule requires is true for at least one catalog
     * entry matched by our selector.
     */
    isTrue() : boolean;
}

export class Rule implements IRule {
    selector : ISelector;
    comparisonOperator : string;
    healthStatus : HealthStatus;

    constructor(selector : ISelector, comparisonOperator : string, healthStatus : HealthStatus) {
        this.selector = selector;
        // TODO: validate for valid comparison operator
        this.comparisonOperator = comparisonOperator;
        this.healthStatus = healthStatus;
    }

    getSelector() : ISelector {
        return this.selector;
    }

    getNextChild() : IRule {
        return null;
    }

    isTrue() : boolean {
        return false;
    }

    getComparisonOperator() : string {
        return this.comparisonOperator;
    }

    getHealthStatus() : HealthStatus {
        return this.healthStatus;
    }

    getReactions() : any[] {
        return [];
    }
}
