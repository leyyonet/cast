import { $dev, ClassLike, List } from '@leyyo/common';

import { CastDiscoverLike } from './index.types';
import { CastBase, CastName, CastNamePlain, CastPoolLike } from '../pool';
import { CastClass } from '../basic';
import { FQN } from '../internal';
import { CastTokenized } from '../tokenizer';
import { Fqn } from '@leyyo/core';

@Fqn(FQN)
export class CastDiscover implements CastDiscoverLike {
    constructor(private pool: CastPoolLike) {}

    find(clazz: CastName, required?: boolean): CastClass {
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
                            throw $dev.developerError2(FQN, 100, {
                                message: 'Invalid generics array pattern',
                                value: clazz,
                                where: `${FQN}.CastDiscover`,
                                method: 'find',
                            });
                    }
                }
                const status = this.pool.fetch.analyse(clazz as CastClass);
                switch (status) {
                    case 'basic-instance':
                    case 'basic-static':
                        return this.findWithNative(clazz as CastClass);
                    default:
                        throw $dev.developerError2(FQN, 100, {
                            message: 'Class is not a cast class',
                            value: clazz,
                            where: `${FQN}.CastDiscover`,
                            field: 'status',
                            status,
                            method: 'find',
                        });
                }
            default:
                if (required) {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid class name',
                        value: clazz,
                        type: typeof clazz,
                        where: `${FQN}.CastDiscover`,
                        method: 'find',
                    });
                }
                return undefined;
        }
    }

    run(clazz: CastName, value: unknown): unknown {
        return this.find(clazz, true).cast(value);
    }

    private findWithString(clazz: string): CastClass {
        return this.build(this.pool.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private findWithSystem(clazz: ClassLike): CastClass {
        return this.build(this.pool.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private findEmptyGenerics(clazz: ClassLike): CastClass {
        return this.build({ base: this.pool.tokenizer.className(clazz), children: [{ base: 'Any' }] })?.value?.clazz;
    }

    private findWithShortcutArray(clazz: CastNamePlain): CastClass {
        switch (typeof clazz) {
            case 'string':
            case 'object':
            case 'function':
                return this.build({
                    base: 'Array',
                    kind: 'basic',
                    children: [{ base: this.pool.tokenizer.className(clazz) }],
                })?.value?.clazz;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid class name',
                    value: clazz,
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: `${FQN}.CastDiscover`,
                    method: 'findWithShortcutArray',
                });
        }
    }

    private findWithShortcutRecord(keyClass: CastNamePlain, valueClass: CastNamePlain): CastClass {
        let key: string;
        let value: string;

        switch (typeof keyClass) {
            case 'string':
            case 'object':
            case 'function':
                key = this.pool.tokenizer.className(keyClass);
                break;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid key class for map',
                    value: keyClass,
                    type: typeof keyClass,
                    expected: ['string', 'object', 'function'],
                    where: `${FQN}.CastDiscover`,
                    method: 'findWithShortcutRecord',
                });
        }
        switch (typeof valueClass) {
            case 'string':
            case 'object':
            case 'function':
                value = this.pool.tokenizer.className(valueClass);
                break;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid key class for map',
                    value: valueClass,
                    type: typeof valueClass,
                    expected: ['string', 'object', 'function'],
                    where: `${FQN}.CastDiscover`,
                    method: 'findWithShortcutRecord',
                });
        }
        return this.build(this.pool.tokenizer.parse(`Record<${key},${value}>`))?.value?.clazz;
    }

    private findWithNative(clazz: CastClass): CastClass {
        if (this.pool.depot.has(clazz)) {
            return clazz;
        }

        const status = this.pool.fetch.analyse(clazz);
        switch (status) {
            case 'basic-instance':
            case 'basic-static':
                const tokenized = this.pool.tokenizer.parse(clazz, true);
                const base = this.pool.fetch.save(clazz, { tokenized });
                base.value.tags.push('from-native');
                return clazz;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Class is not a cast class',
                    value: clazz,
                    where: `${FQN}.CastDiscover`,
                    field: 'status',
                    status,
                    method: 'find',
                });
        }
    }

    build(tokenized: CastTokenized): CastBase {
        const base = this.pool.depot.get(this.pool.tokenizer.stringify(tokenized));
        if (base) {
            return base;
        }
        switch (tokenized.kind) {
            case 'generics':
                return this.pool.generics.build(tokenized);
            case 'union':
                return this.pool.union.build(tokenized);
            case 'tuple':
                return this.pool.tuple.build(tokenized);
        }
        return this.pool.basic.build(tokenized);
    }
}
