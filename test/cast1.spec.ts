import {strict as assert} from 'assert';
import {castPool} from "../src";
import {MyClass} from "../src/samples/z-cast-class";

describe('callback', () => {
    describe('has', () => {
        it('fqn.full - source', () => {
            assert.equal(castPool.depot.has('leyyo.cast.MyStr'), true);
        });
        it('fqn.basic - source', () => {
            assert.equal(castPool.depot.has('MyStr'), true);
        });
        it('alias', () => {
            assert.equal(castPool.depot.has('Str2'), true);
        });
        it('alias', () => {
            assert.equal(castPool.depot.has('str'), true);
        });
        it('alias absent', () => {
            assert.equal(castPool.depot.has('str22'), false);
        });
    });
    describe('type', () => {
        it('str to int', () => {
            assert.equal(castPool.discover.run('MyInt', '5'), 5);
        });
        it('bool to int', () => {
            assert.equal(castPool.discover.run('MyInt', true), 1);
        });
        it('float/str to int', () => {
            assert.equal(castPool.discover.run('MyInt', '2.3'), 2);
        });
        it('float to int', () => {
            assert.equal(castPool.discover.run('MyInt', 2.3), 2);
        });

    });
    describe('dto', () => {
        it('age', () => {
            const class1 = new MyClass();
            class1.age = '4' as unknown as number;
            assert.equal(class1.age, 4);
        });
        it('name', () => {
            const class1 = new MyClass();
            class1.name = (() => 5) as unknown as string;
            assert.equal(class1.name, '5');
        });
        it('surname', () => {
            const class1 = new MyClass();
            class1.surname = false as unknown as string;
            assert.equal(class1.surname, 'false');
        });
        it('object', () => {
            const class1 = new MyClass();
            class1.age = 2;
            class1.name = 'Foo';
            class1.surname = 'Bar'
            assert.deepEqual(class1['toJSON'](), {age: 2, name: 'Foo', surname: 'Bar'});
        });
    });
});
