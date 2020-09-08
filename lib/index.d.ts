declare type ComplexFunctionCall<T> = (arg: T) => Promise<T>;
interface ComplexOptions {
    detectConficts?: boolean;
}
interface ComplexFunction<T> {
    fn: ComplexFunctionCall<T>;
    depends?: ComplexFunctionCall<T>[];
}
declare class ComplexFlow<T> {
    private storage;
    private fns;
    private executedLabels;
    private options;
    duration: number;
    constructor(arg: T, options?: ComplexOptions);
    add(complexFunc: ComplexFunction<T>): ComplexFlow<T>;
    run(): Promise<T>;
    validate(): Error | null;
}
export default ComplexFlow;
