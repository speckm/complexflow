<h1 align="left" style="font-size:28px">
  complexflow
</h1>

Complexflow helps you run complex async functions with multiple dependencies by building a dependency tree and running the async functions in the minimum time required. 

[![Dependency Status](https://david-dm.org/mikro-orm/mikro-orm.svg)](https://david-dm.org/speckm/complexflow)
[![Build Status](https://github.com/mikro-orm/mikro-orm/workflows/tests/badge.svg?branch=master)](https://github.com/speckm/complexflow/actions?workflow=test)

# Installation

```shell
$ npm i -g npm
$ npm i lodash
```

# Basic Usage

```typescript
const cf = new ComplexFlow<any>(sharedObject, options);
cf.add({
    fn: async (a: any) => return a,
});
await cf.run();
console.log(sharedObject);
```

# Example Usage

```typescript
interface SharedObject {
    one: number;
}

const calc1 = async (object: SharedObject) => {
    await sleep(50);
    object.one *= 2;
    return object;
};

const calc2 = async (object: SharedObject) => {
    await sleep(100);
    object.one += 10;
    return object;
};

// Just run in Parallel - Works just like await Promises.all(...)
const object = { one: 10 };
const cf = new ComplexFlow<SharedObject>(object);
cf.add({
    fn: calc1,
});
cf.add({
    fn: calc2,
});
await cf.run();

// object now is { one: 30 } like 10 * 2 + 10

// Run with Dependencies
const object = { one: 10 };
const cf = new ComplexFlow<SharedObject>(object);
cf.add({
    fn: calc1,
    depends: [calc2],
});
cf.add({
    fn: calc2,
});
await cf.run();

// object now is { one: 40 } like (10 + 10) * 2
```

## Hints

As the complexflow-scheduler needs to be able to invoke the supplied functions on demand, it needs the functions as (not already invoked) parameters. All functions will receive the shared object as parameter. There are two modes for the scheduler to work in:

## Non-restricted common access
In this mode all function work on the same object which is passed by reference to the functions. In this mode there may be concurrent access to data in the object. You need to take care of the concurrency by yourself. You create an instance for this mode with:

```typescript
const cf = new ComplexFlow<any>(args, { detectConficts: false });   /// false is default
```

## Restricted common access
In this mode all function work a copies of the supplied object which is copied when the function is called by the scheduler. After the execution of an async function the result is merged back into the object. In this mode complexflow throws an exception when it detects concurrent access to an attribute of two different functions. Be aware, that the results of an function are only merged back into the object AFTER execution of the single function. You create a complexflow scheduler with concurrency detection with this:

```typescript
const cf = new ComplexFlow<any>(args, { detectConficts: false });   /// false is default
```

# License

MIT

# Changelog

* 0.1.0 - Initial commit.