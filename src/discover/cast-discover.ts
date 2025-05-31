import {$dev, AssertionCallback, ClassLike, DevCallback, Func, List} from '@leyyo/common';
import { Fqn, reflectionPool } from '@leyyo/core';

import { CastDiscoverLike } from './index.types';
import { CastHubLike } from '../hub';
import { CastBase, CastClass, CastName, CastNamePlain, CastTokenized } from '../shared';
import { FQN } from '../internal';

@Fqn(FQN)
export class CastDiscover implements CastDiscoverLike {
    constructor(private hub: CastHubLike) {}

    private _find(clazz: CastName): CastClass {
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
                return this.findWithNative(clazz as CastClass);
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid class name',
                    value: clazz,
                    type: typeof clazz,
                    where: `${FQN}.CastDiscover`,
                    method: 'find',
                });
        }
    }

    find(name: CastName, required?: DevCallback|true): CastClass {
        const clazz = this._find(name);
        if (!clazz && required) {
            const opt = (typeof required === 'function') ? required() : {};
            const def = {
                message: 'Class not found',
                value: name,
                type: typeof name,
                where: `${FQN}.CastDiscover`,
                method: 'find',
            };
            throw $dev.developerError2(FQN, 100, {...def, ...opt});
        }
        return clazz;
    }

    run(clazz: CastName, value: unknown): unknown {
        return this.find(clazz, true).cast(value);
    }

    private findWithString(clazz: string): CastClass {
        return this.build(this.hub.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private findWithSystem(clazz: ClassLike): CastClass {
        return this.build(this.hub.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private findEmptyGenerics(clazz: ClassLike): CastClass {
        return this.build({
            base: this.hub.tokenizer.className(clazz),
            kind: 'generics',
            children: [{ base: 'Any', kind: 'basic' }],
        })?.value?.clazz;
    }

    private findWithShortcutArray(clazz: CastNamePlain): CastClass {
        switch (typeof clazz) {
            case 'string':
            case 'object':
            case 'function':
                return this.build({
                    base: 'Array',
                    kind: 'generics',
                    children: [{ base: this.hub.tokenizer.className(clazz) }],
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
                key = this.hub.tokenizer.className(keyClass);
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
                value = this.hub.tokenizer.className(valueClass);
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
        return this.build(this.hub.tokenizer.parse(`Record<${key},${value}>`))?.value?.clazz;
    }

    private findWithNative(clazz: CastClass): CastClass {
        if (this.hub.depot.has(clazz)) {
            return clazz;
        }

        const classRef = reflectionPool.get(clazz);
        if (classRef) {
            this.hub.basic.fetch(classRef);
            this.hub.basic.process(classRef);
        } else {
            this.hub.basic.addNative(clazz as Func);
        }
        return clazz;
    }

    build(tokenized: CastTokenized): CastBase {
        const base = this.hub.depot.get(this.hub.tokenizer.stringify(tokenized));
        if (base) {
            return base;
        }
        switch (tokenized.kind) {
            case 'generics':
                return this.hub.generics.build(tokenized);
            case 'union':
                return this.hub.union.build(tokenized);
            case 'tuple':
                return this.hub.tuple.build(tokenized);
        }
        return this.hub.basic.build(tokenized);
    }
}
