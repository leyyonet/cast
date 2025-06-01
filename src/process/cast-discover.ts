import { $dev, ClassLike, DevCallback, Func, List } from '@leyyo/common';
import { Fqn, reflectionPool } from '@leyyo/core';

import { CastBase, CastClass, CastHubLike, CastName, CastNamePlain } from '../hub';
import { FQN } from '../internal';
import {CastDiscoverLike, CastTokenized} from './index.types';

@Fqn(FQN)
export class CastDiscover implements CastDiscoverLike {
    constructor(private hub: CastHubLike) {}

    // region private
    private _find(clazz: CastName): CastClass {
        switch (typeof clazz) {
            case 'string':
                return this._findWithString(clazz);
            case 'boolean':
                return this._findWithSystem(Boolean);
            case 'object':
            case 'function':
                if ([String, Number, BigInt, Boolean, Object].includes(clazz as StringConstructor)) {
                    return this._findWithSystem(clazz as ClassLike);
                }
                if ([Array, List].includes(clazz as ArrayConstructor)) {
                    return this._findEmptyGenerics(clazz as ClassLike);
                }
                if (typeof clazz === 'function') {
                    return this._findWithSystem(clazz as ClassLike);
                }
                if (Array.isArray(clazz)) {
                    switch (clazz.length) {
                        case 0:
                            return this._findEmptyGenerics(Array);
                        case 1:
                            return this._findWithShortcutArray(clazz[0]);
                        case 2:
                            return this._findWithShortcutRecord(clazz[0], clazz[1]);
                        default:
                            throw $dev.developerError2(FQN, 100, {
                                message: 'Invalid generics array pattern',
                                value: clazz,
                                where: `${FQN}.CastDiscover`,
                                method: 'find',
                            });
                    }
                }
                return this._findWithNative(clazz as CastClass);
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

    private _findWithString(clazz: string): CastClass {
        return this.build(this.hub.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private _findWithSystem(clazz: ClassLike): CastClass {
        return this.build(this.hub.tokenizer.parse(clazz, true))?.value?.clazz;
    }

    private _findEmptyGenerics(clazz: ClassLike): CastClass {
        return this.build({
            main: this.hub.tokenizer.className(clazz),
            kind: 'generics',
            children: [{ main: 'Any', kind: 'basic' }],
        })?.value?.clazz;
    }

    private _findWithShortcutArray(clazz: CastNamePlain): CastClass {
        switch (typeof clazz) {
            case 'string':
            case 'object':
            case 'function':
                return this.build({
                    main: 'Array',
                    kind: 'generics',
                    children: [{ main: this.hub.tokenizer.className(clazz) }],
                })?.value?.clazz;
            default:
                throw $dev.developerError2(FQN, 100, {
                    message: 'Invalid class name',
                    value: clazz,
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: `${FQN}.CastDiscover`,
                    method: '_findWithShortcutArray',
                });
        }
    }

    private _findWithShortcutRecord(keyClass: CastNamePlain, valueClass: CastNamePlain): CastClass {
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
                    method: '_findWithShortcutRecord',
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
                    method: '_findWithShortcutRecord',
                });
        }
        return this.build(this.hub.tokenizer.parse(`Record<${key},${value}>`))?.value?.clazz;
    }

    private _findWithNative(clazz: CastClass): CastClass {
        if (this.hub.depot.has(clazz)) {
            return clazz;
        }

        const classRef = reflectionPool.get(clazz);
        if (classRef) {
            this.hub.basic.fetch(classRef, {});
            this.hub.basic.process(classRef);
        } else {
            this.hub.basic.addNative(clazz as Func);
        }
        return clazz;
    }
    // endregion private

    find(name: CastName, required?: DevCallback | true): CastClass {
        const clazz = this._find(name);
        if (!clazz && required) {
            const opt = typeof required === 'function' ? required() : {};
            const def = {
                message: 'Class not found',
                value: name,
                type: typeof name,
                where: `${FQN}.CastDiscover`,
                method: 'find',
            };
            throw $dev.developerError2(FQN, 100, { ...def, ...opt });
        }
        return clazz;
    }

    run(clazz: CastName, value: unknown): unknown {
        return this.find(clazz, true).cast(value);
    }

    build(tokenized: CastTokenized): CastBase {
        const bbb = this.hub.depot.get(this.hub.tokenizer.stringify(tokenized));
        if (bbb) {
            return bbb;
        }
        switch (tokenized.kind) {
            case 'generics':
                return this.hub.generics.build(tokenized);
            case 'union':
                return this.hub.union.build(tokenized);
            case 'tuple':
                return this.hub.tuple.build(tokenized);
            case 'group':
                return this.hub.group.build(tokenized);
            case 'merge':
                return this.hub.merge.build(tokenized);
        }
        return this.hub.basic.build(tokenized);
    }
}
