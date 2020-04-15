declare type ComplexFunctionCall<T> = (arg: T) => Promise<T>;
interface ComplexFunction<T> {
    fn: ComplexFunctionCall<T>;
    depends?: ComplexFunctionCall<T>[];
}
declare class ComplexFlow<T> {
    private storage;
    private fns;
    private executedLabels;
    duration: number;
    constructor(arg: T);
    add(complexFunc: ComplexFunction<T>): ComplexFlow<T>;
    run(): Promise<T>;
    validate(): Error | null;
}
export default ComplexFlow;
