"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_pickby_1 = __importDefault(require("lodash.pickby"));
const lodash_intersection_1 = __importDefault(require("lodash.intersection"));
const lodash_isequal_1 = __importDefault(require("lodash.isequal"));
const perf_hooks_1 = require("perf_hooks");
class ComplexFlow {
    constructor(arg, options) {
        this.fns = [];
        this.executedLabels = [];
        this.options = {
            detectConficts: false,
        };
        this.duration = 0;
        this.options.detectConficts = (options === null || options === void 0 ? void 0 : options.detectConficts) !== undefined ? options === null || options === void 0 ? void 0 : options.detectConficts : this.options.detectConficts;
        this.storage = this.options.detectConficts ? { ...arg } : arg;
    }
    add(complexFunc) {
        this.fns.push({ depends: [], ...complexFunc, executed: false });
        return this;
    }
    async run() {
        perf_hooks_1.performance.mark('A');
        let nNextExecuted = this.fns.filter((item) => !item.executed && item.depends.every((item) => this.executedLabels.indexOf(item.name) >= 0));
        let nNotExecuted = this.fns.filter((item) => !item.executed);
        let nLastRemaining = nNotExecuted.length;
        this.duration = 0;
        while (nNotExecuted.length > 0) {
            const pRun = this.options.detectConficts ? nNextExecuted.map((item) => item.fn({ ...this.storage })) : nNextExecuted.map((item) => item.fn(this.storage));
            const rResults = await Promise.all(pRun);
            if (this.options.detectConficts) {
                let aChanges = [];
                for (const result of rResults) {
                    const newChanges = lodash_pickby_1.default(result, (value, key) => {
                        return !lodash_isequal_1.default(this.storage[key], value);
                    });
                    const changedKeys = Object.keys(newChanges);
                    if (lodash_intersection_1.default(aChanges, changedKeys).length > 0) {
                        throw new Error('Concurrent property access ' + lodash_intersection_1.default(aChanges, changedKeys).join(', '));
                    }
                    aChanges = aChanges.concat(changedKeys);
                }
                for (const result of rResults) {
                    this.storage = { ...this.storage, ...result };
                }
            }
            const aExecutedLabels = nNextExecuted.map((item) => item.fn.name);
            for (let i = 0; i < this.fns.length; i++) {
                if (aExecutedLabels.indexOf(this.fns[i].fn.name) >= 0) {
                    this.fns[i].executed = true;
                }
            }
            this.executedLabels = this.executedLabels.concat(nNextExecuted.map((item) => item.fn.name));
            nNextExecuted = this.fns.filter((item) => !item.executed && item.depends.every((item) => this.executedLabels.indexOf(item.name) >= 0));
            nNotExecuted = this.fns.filter((item) => !item.executed);
            if (nLastRemaining === nNotExecuted.length && nNotExecuted.length > 0) {
                const nNotExecuted = this.fns.filter((item) => !item.executed).map((item) => item.fn.name);
                throw new Error('Dependencies not valid. Could not execute ' + nNotExecuted.join(', '));
            }
            nLastRemaining = nNotExecuted.length;
        }
        const obs = new perf_hooks_1.PerformanceObserver((items) => {
            this.duration = items.getEntries()[0].duration;
            perf_hooks_1.performance.clearMarks();
        });
        obs.observe({ entryTypes: ['measure'] });
        perf_hooks_1.performance.mark('B');
        perf_hooks_1.performance.measure('A to B', 'A', 'B');
        return this.storage;
    }
    validate() {
        let nNextExecuted = this.fns.filter((item) => !item.executed && item.depends.every((item) => this.executedLabels.indexOf(item.name) >= 0));
        let nNotExecuted = this.fns.filter((item) => !item.executed);
        let nLastRemaining = nNotExecuted.length;
        while (nNotExecuted.length > 0) {
            const aExecutedLabels = nNextExecuted.map((item) => item.fn.name);
            for (let i = 0; i < this.fns.length; i++) {
                if (aExecutedLabels.indexOf(this.fns[i].fn.name) >= 0) {
                    this.fns[i].executed = true;
                }
            }
            this.executedLabels = this.executedLabels.concat(nNextExecuted.map((item) => item.fn.name));
            nNextExecuted = this.fns.filter((item) => !item.executed && item.depends.every((item) => this.executedLabels.indexOf(item.name) >= 0));
            nNotExecuted = this.fns.filter((item) => !item.executed);
            if (nLastRemaining === nNotExecuted.length) {
                const nNotExecuted = this.fns.filter((item) => !item.executed).map((item) => item.fn.name);
                return new Error('Dependencies not valid. Could not execute ' + nNotExecuted.join(', '));
            }
            nLastRemaining = nNotExecuted.length;
        }
        return null;
    }
}
exports.default = ComplexFlow;
//# sourceMappingURL=index.js.map