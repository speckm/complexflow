"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _ = __importStar(require("lodash"));
const perf_hooks_1 = require("perf_hooks");
class ComplexFlow {
    constructor(arg) {
        this.fns = [];
        this.executedLabels = [];
        this.duration = 0;
        this.storage = _.cloneDeep(arg);
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
            const pRun = nNextExecuted.map((item) => item.fn(_.cloneDeep(this.storage)));
            const rResults = await Promise.all(pRun);
            let aChanges = [];
            for (const result of rResults) {
                const newChanges = _.pickBy(result, (value, key) => {
                    return !_.isEqual(this.storage[key], value);
                });
                const changedKeys = Object.keys(newChanges);
                if (_.intersection(aChanges, changedKeys).length > 0) {
                    throw new Error('Concurrent property access ' + _.intersection(aChanges, changedKeys).join(', '));
                }
                aChanges = aChanges.concat(changedKeys);
            }
            for (const result of rResults) {
                _.assign(this.storage, result);
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