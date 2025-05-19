import {fqnHandler} from '@leyyo/core';
import { $dev, Arr, ClassLike, Func, List } from '@leyyo/common';

import { CastDiscoverLike } from './index.types';
import {CastName, CastNamePlain, CastPoolLike} from '../pool';
import { CastPointer } from '../basic';
import {FQN} from "../internal";
import {CastTokenized} from "../tokenizer";

export class CastDiscover implements CastDiscoverLike {
    protected readonly _CAST_FUNCTIONS = ['cast', 'doc'] as Array<keyof CastPointer>;
    protected readonly _GEN_FUNCTIONS = ['castGen', 'docGen'] as Array<keyof CastPointer>;

    constructor(private pool: CastPoolLike) {}

    find(clazz: CastName, required?: boolean): CastPointer {
        switch (typeof clazz) {
            case 'string':
                return this.findWithString(clazz);
            case 'boolean':
                return this.findWithSystem(Boolean);
            case 'object':
            case 'function':
                if ([String, Number, BigInt, Boolean, Object].includes(clazz as StringConstructor)) {
                    return this.findWithSystem(clazz as ClassLike);
                }
                if ([Array, List].includes(clazz as ArrayConstructor)) {
                    return this.findEmptyGenerics(clazz as ClassLike);
                }
                if (typeof clazz === 'function') {
                    return this.findWithSystem(clazz as ClassLike);
                }
                if (Array.isArray(clazz)) {
                    switch (clazz.length) {
                        case 0:
                            return this.findEmptyGenerics(Array);
                        case 1:
                            return this.findWithShortcutArray(clazz[0]);
                        case 2:
                            return this.findWithShortcutRecord(clazz[0], clazz[1]);
                        default:
                            throw $dev.invalidError({
                                issue: 'invalid.generics.array.pattern',
                                value: clazz,
                                where: 'leyyo.cast.CastPool',
                                method: 'find',
                            });
                    }
                }
                const status = this.pool.fetch.analyse(clazz as CastPointer);
                switch (status) {
                    case 'type-instance':
                    case 'type-static':
                        return this.findWithNative(clazz as CastPointer);
                    default:
                        throw $dev.invalidError({
                            issue: 'invalid.analysis',
                            value: clazz,
                            field: 'status',
                            status,
                            where: 'leyyo.cast.CastPool',
                            method: 'find',
                        });
                }
            default:
                if (required) {
                    throw $dev.invalidError({
                        issue: 'invalid.casting',
                        value: clazz,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
                }
                return undefined;
        }
    }

    run(clazz: CastName, value: unknown): unknown {
        return this.find(clazz, true).cast(value);
    }

    private findWithString(clazz: string): CastPointer {
        return this.buildPointer(this.pool.tokenizer.parse(clazz, true));
    }

    private findWithSystem(clazz: ClassLike): CastPointer {
        return this.buildPointer(this.pool.tokenizer.parse(clazz, true));
    }

    private findEmptyGenerics(clazz: ClassLike): CastPointer {
        return this.buildPointer({ base: this.pool.tokenizer.className(clazz), children: [{ base: 'Any' }] });
    }

    private findWithShortcutArray(clazz: CastNamePlain): CastPointer {
        switch (typeof clazz) {
            case 'string':
            case 'object':
            case 'function':
                return this.buildPointer({ base: 'Array', kinds: ['type'], children: [{ base: this.pool.tokenizer.className(clazz) }] });
            default:
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.CastPool',
                    method: 'findWithShortcutArray',
                });
        }
    }

    private findWithShortcutRecord(keyClass: CastNamePlain, valueClass: CastNamePlain): CastPointer {
        let key: string;
        let value: string;

        switch (typeof keyClass) {
            case 'string':
            case 'object':
            case 'function':
                key = this.pool.tokenizer.className(keyClass);
                break;
            default:
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof keyClass,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.CastPool',
                    method: 'findWithShortcutArray',
                });
        }
        switch (typeof valueClass) {
            case 'string':
            case 'object':
            case 'function':
                value = this.pool.tokenizer.className(valueClass);
                break;
            default:
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof valueClass,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.CastPool',
                    method: 'findWithShortcutArray',
                });
        }
        return this.buildPointer(this.pool.tokenizer.parse(`Record<${key},${value}>`));
    }

    copy(source: unknown, target: Func | ClassLike): boolean {
        if (source) {
            let copied = false;
            [this._CAST_FUNCTIONS, this._GEN_FUNCTIONS].forEach((functions) => {
                functions.forEach((fn) => {
                    if (typeof source[fn] === 'function') {
                        // @ts-ignore
                        target[fn] = (...a: Arr) => source[fn](...a);
                        copied = true;
                    }
                });
            });
            return copied;
        }
        return false;
    }

    private findWithNative(clazz: CastPointer): CastPointer {
        if (this.pool.depot.has(clazz)) {
            return clazz;
        }

        const status = this.pool.fetch.analyse(clazz);
        switch (status) {
            case 'type-instance':
            case 'type-static':
                const tokenized = this.pool.tokenizer.parse(clazz, true);
                this.pool.fetch.save(clazz, tokenized, [], ['type', 'from-native'], {});
                return clazz;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid cast class',
                    kind: 'type',
                    class: fqnHandler.get(clazz),
                    where: 'leyyo.cast.CastPool',
                    method: 'find',
                });
        }
    }

    buildPointer(tokenized: CastTokenized): CastPointer {
        const base = this.pool.depot.get(this.pool.tokenizer.stringify(tokenized));
        if (base) {
            return base.value;
        }

        if (tokenized.kinds.includes('generics')) {
            return this.pool.generics.buildPointer(tokenized);
        }
        if (tokenized.kinds.includes('union')) {
            return this.pool.union.buildPointer(tokenized);
        }
        if (tokenized.kinds.includes('tuple')) {
            return this.pool.tuple.buildPointer(tokenized);
        }
        return this.pool.type.buildPointer(tokenized);
    }
}
