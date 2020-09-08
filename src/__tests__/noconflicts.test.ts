import ComplexFlow from '..';

export const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};

interface TestObject {
    one: number;
}

const calc1 = async (object: TestObject) => {
    await sleep(50);
    object.one *= 2;
    return object;
};

const calc2 = async (object: TestObject) => {
    await sleep(100);
    object.one += 10;
    return object;
};

test('Parallel Functions', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({ one: 10 });
    cf.add({
        fn: calc1,
    });
    cf.add({
        fn: calc2,
    });
    const result = await cf.run();
    expect(result).toEqual({ one: 30 });
});

test('Serial A -> B Functions', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({ one: 10 });
    cf.add({
        fn: calc1,
    });
    cf.add({
        fn: calc2,
        depends: [calc1],
    });
    const result = await cf.run();
    expect(result).toEqual({ one: 30 });
});

test('Serial B -> A Functions', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({ one: 10 });
    cf.add({
        fn: calc1,
        depends: [calc2],
    });
    cf.add({
        fn: calc2,
    });
    const result = await cf.run();
    expect(result).toEqual({ one: 40 });
});
