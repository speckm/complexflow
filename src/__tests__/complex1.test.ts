import ComplexFlow from '..';

import * as shared from '../shared';

interface TestObject {
    one?: number;
    two?: number;
    three?: number;
    four?: number;
    five?: number;
    six?: number;
}

const calc1 = async (object: TestObject) => {
    object.one = 1;
    await shared.sleep(100);
    return object;
};

const calc2 = async (object: TestObject) => {
    object.two = 2;
    await shared.sleep(100);
    return object;
};

const calc3 = async (object: TestObject) => {
    object.three = 3;
    await shared.sleep(100);
    return object;
};

const calc4 = async (object: TestObject) => {
    object.four = 4;
    await shared.sleep(100);
    return object;
};

const calc5 = async (object: TestObject) => {
    object.five = 5;
    await shared.sleep(100);
    return object;
};

const calc35 = async (object: TestObject) => {
    object.three = 5;
    object.five = 5;
    await shared.sleep(100);
    return object;
};

const calc6 = async (object: TestObject) => {
    object.six = 6;
    await shared.sleep(100);
    return object;
};

test('Single Functions', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc1,
    });
    const result = await cf.run();
    expect(result).toEqual({ one: 1 });
});

test('Multiple Functions', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc1,
    });
    cf.add({
        fn: calc2,
        depends: [calc1],
    });
    cf.add({
        fn: calc4,
        depends: [calc2],
    });
    cf.add({
        fn: calc3,
        depends: [calc2],
    });
    cf.add({
        fn: calc5,
        depends: [calc2],
    });
    cf.add({
        fn: calc6,
        depends: [calc5, calc1],
    });
    const result = await cf.run();
    expect(result).toEqual({ one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 });
});

test('Performance', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc1,
    });
    cf.add({
        fn: calc2,
        depends: [calc1],
    });
    cf.add({
        fn: calc4,
        depends: [calc2],
    });
    cf.add({
        fn: calc3,
        depends: [calc2],
    });
    cf.add({
        fn: calc5,
        depends: [calc2],
    });
    cf.add({
        fn: calc6,
        depends: [calc5, calc1],
    });
    await cf.run();
    // Expect near 400ms runtime
    expect(Math.round(cf.duration / 100) * 100).toBe(400);
});

test('Faulty Dependency Validate', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc1,
        depends: [calc2],
    });
    cf.add({
        fn: calc2,
        depends: [calc1],
    });

    const result = await cf.validate();
    expect(result).not.toBeNull();
    if (result) {
        expect(result.message).toBe('Dependencies not valid. Could not execute calc1, calc2');
    }
});

test('Faulty Dependecy Run Exception', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc1,
        depends: [calc2],
    });
    cf.add({
        fn: calc2,
        depends: [calc1],
    });

    expect(cf.run()).rejects.toEqual(new Error('Dependencies not valid. Could not execute calc1, calc2'));
});

test('Concurrent Access Detection', async () => {
    jest.setTimeout(10000);
    const cf = new ComplexFlow<TestObject>({});
    cf.add({
        fn: calc3,
    });
    cf.add({
        fn: calc35,
    });

    expect(cf.run()).rejects.toEqual(new Error('Concurrent property access three'));
});
