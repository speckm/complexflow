import pickBy from 'lodash.pickby';
import intersection from 'lodash.intersection';
import isEqual from 'lodash.isequal';

import { PerformanceObserver, performance } from 'perf_hooks';

type ComplexFunctionCall<T> = (arg: T) => Promise<T>;

interface ComplexOptions {
    detectConficts?: boolean;
}

interface ComplexFunction<T> {
    fn: ComplexFunctionCall<T>;
    depends?: ComplexFunctionCall<T>[];
}

interface ComplexFunctionStorage<T> {
    fn: ComplexFunctionCall<T>;
    depends: ComplexFunctionCall<T>[];
    executed: boolean;
}

class ComplexFlow<T> {
    private storage: T;
    private fns: ComplexFunctionStorage<T>[] = [];
    private executedLabels: string[] = [];

    // Default Options
    private options: ComplexOptions = {
        detectConficts: true,
    };

    public duration = 0;
    constructor(arg: T, options?: ComplexOptions) {
        this.storage = { ...arg };
        this.options.detectConficts = options?.detectConficts !== undefined ? options?.detectConficts : this.options.detectConficts;
    }

    add(complexFunc: ComplexFunction<T>): ComplexFlow<T> {
        this.fns.push({ depends: [], ...complexFunc, executed: false });
        return this;
    }

    async run(): Promise<T> {
        // If Performance map is needed
        performance.mark('A');

        let nNextExecuted = this.fns.filter((item) => !item.executed && item.depends.every((item) => this.executedLabels.indexOf(item.name) >= 0));
        let nNotExecuted = this.fns.filter((item) => !item.executed);
        let nLastRemaining = nNotExecuted.length;

        this.duration = 0;

        while (nNotExecuted.length > 0) {
            const pRun = nNextExecuted.map((item) => item.fn({ ...this.storage }));
            const rResults = await Promise.all(pRun);

            // Merge Results
            let aChanges: string[] = [];

            for (const result of rResults) {
                // Test for concurrent updates
                const newChanges = pickBy(result as Record<string, any>, (value: any, key: string) => {
                    return !isEqual(this.storage[key], value);
                });

                const changedKeys = Object.keys(newChanges);

                // Conflict Detection
                if (this.options.detectConficts) {
                    if (intersection(aChanges, changedKeys).length > 0) {
                        throw new Error('Concurrent property access ' + intersection(aChanges, changedKeys).join(', '));
                    }
                }

                aChanges = aChanges.concat(changedKeys);
            }

            for (const result of rResults) {
                this.storage = { ...this.storage, ...result };
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

            // Check for Never Ending
            if (nLastRemaining === nNotExecuted.length && nNotExecuted.length > 0) {
                const nNotExecuted = this.fns.filter((item) => !item.executed).map((item) => item.fn.name);
                throw new Error('Dependencies not valid. Could not execute ' + nNotExecuted.join(', '));
            }
            nLastRemaining = nNotExecuted.length;
        }

        const obs = new PerformanceObserver((items) => {
            this.duration = items.getEntries()[0].duration;
            performance.clearMarks();
        });

        obs.observe({ entryTypes: ['measure'] });
        performance.mark('B');
        performance.measure('A to B', 'A', 'B');

        return this.storage;
    }

    validate(): Error | null {
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
            // Check for Never Ending
            if (nLastRemaining === nNotExecuted.length) {
                const nNotExecuted = this.fns.filter((item) => !item.executed).map((item) => item.fn.name);
                return new Error('Dependencies not valid. Could not execute ' + nNotExecuted.join(', '));
            }
            nLastRemaining = nNotExecuted.length;
        }

        return null;
    }
}

export default ComplexFlow;
