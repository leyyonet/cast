import {strict as assert} from 'assert';
import {castPool} from "../src";
import {MyStr} from "../src/samples/z-cast-class";
import {fqn} from "@leyyo/fqn";

describe('callback', () => {
    it('Add - duplicated', () => {
        assert.throws(() => castPool.add({source: MyStr, aliases: ['leyyo.cast.MyStr', 'aaa.str']}));
    });
    it('Add - empty function', () => {
        assert.throws(() => castPool.add({source: null, aliases: ['leyyo.cast.MyStr', 'aaa.str']}));
    });
    it('Add - invalid function', () => {
        assert.throws(() => castPool.add({source: 5 as unknown as string, aliases: ['leyyo.cast.MyStr', 'aaa.str']}));
    });
    it('Add - empty name', () => {
        assert.throws(() => castPool.add({source: MyStr}));
    });
    it('has - fqn - source', () => {
        assert.equal(castPool.has('leyyo.cast.MyStr'), true);
    });
    it('has - basic - source', () => {
        assert.equal(castPool.has('MyStr'), true);
    });
    it('has - fqn - alias', () => {
        assert.equal(castPool.has('aaa.str'), true);
    });
    it('has - basic - alias', () => {
        assert.equal(castPool.has('str'), true);
    });

    it('get - fqn - source', () => {
        assert.equal(castPool.get('leyyo.cast.MyStr').source, fqn.name(MyStr));
    });
    it('get - basic - source', () => {
        assert.equal(castPool.get('MyStr').source, fqn.name(MyStr));
    });
    it('get - basic - alias', () => {
        assert.equal(castPool.get('aaa.str').source, fqn.name(MyStr));
    });
    it('get - fqn - alias', () => {
        assert.equal(castPool.get('str').source, fqn.name(MyStr));
    });
    // get bucket(): string;
    // get sources(): Record<string, T>;
    // get all(): Record<string, T>;
    // buildName(name: unknown, field?: string): CallbackName;
    // get(name: ClassOrName): T | undefined;
    // has(name: ClassOrName): boolean;
    // add(value: T, source: ClassOrName, ...aliases: Array<string>): void;
    // update(value: T, source: ClassOrName, throwable?: boolean): boolean;
    // remove(source: ClassOrName): number;
    // isSource(source: ClassOrName): boolean;
    // isAlias(alias: ClassOrName): boolean;
    // findAliasesBySource(source: ClassOrName): Array<string>;
    // findSourceByAlias(alias: ClassOrName): string | undefined;
});