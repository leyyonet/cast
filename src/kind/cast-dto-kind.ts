import { $descriptor, $err, $is, $repo, Arr, ClassLike, Dict, Func, MultipleException } from '@leyyo/common';
import { ClassReflectionLike, Fqn, reflectionPool } from '@leyyo/core';

import { FQN } from '../internal';
import { CastValueSign } from '../index.symbols';
import { CastClass, CastDocCallback, CastDocResponse, CastHubLike } from '../hub';
import { AssignDtoOpt, CastBasic } from '../decorators';
import { CastDtoKindLike, ToJsonLike } from './index.types';

@Fqn(FQN)
export class CastDtoKind implements CastDtoKindLike {
    private _propertyNamesMap = $repo.newMap<ClassLike, Array<string>>();

    constructor(private hub: CastHubLike) {}

    // region private
    private getPropertyNames(clazz: ClassLike): Array<string> {
        if (!this._propertyNamesMap.has(clazz)) {
            const classRef = reflectionPool.get(clazz, false);
            if (classRef) {
                this._propertyNamesMap.set(clazz, classRef.listInstancePropertyNames({ kind: 'field' }));
            } else {
                this._propertyNamesMap.set(clazz, []);
            }
        }
        return this._propertyNamesMap.get(clazz);
    }

    private addError(e: Error, errors: Array<Error>, key: string) {
        if (e instanceof MultipleException) {
            errors.push(...e.errors);
        } else {
            const err = $err.build(e);
            err.params['field'] = key;
            errors.push(err);
        }
    }

    private callToJson(val: unknown): unknown {
        const childValue = val as ToJsonLike;
        if (typeof childValue?.toJSON === 'function') {
            return childValue.toJSON();
        }
        return val;
    }

    // endregion private

    // region on-case
    onCast<T>(clazz: ClassLike<T>, value: unknown): T {
        if ($is.empty(value)) {
            return value as T;
        }
        return ($is.object(value) && value instanceof clazz ? value : new clazz(value)) as unknown as T;
    }

    onCanBe<T>(_clazz: ClassLike<T>, value: unknown): boolean {
        // todo, check field
        return $is.object(value);
    }

    onExact<T>(clazz: ClassLike<T>, value: unknown): boolean {
        return $is.object(value) && value instanceof clazz;
    }

    onDoc<T>(clazz: ClassLike<T>, openApi: CastDocCallback): CastDocResponse {
        const ref = reflectionPool.get(clazz);
        const properties = {};
        if (ref) {
            ref.listInstanceProperties({ kind: 'field' }).forEach((propRef) => {
                if (!propRef.type) {
                    properties[propRef.name] = {};
                } else {
                    const propBase = this.hub.depot.get(propRef.type, false);
                    if (propBase) {
                        properties[propRef.name] = propBase.value.clazz.doc(openApi);
                    } else {
                        properties[propRef.name] = this.onDoc(propRef.type as ClassLike, openApi);
                    }
                }
            });
        } else {
            let childNames: Array<string> = [];
            let proto: Object;
            try {
                proto = clazz.prototype;
                if ($is.object(proto)) {
                    childNames.push(...Object.getOwnPropertyNames(proto));
                }
            } catch (ignore) {}
            if (childNames.length > 0) {
                childNames.forEach((key) => {
                    const desc = $descriptor.get(proto, key);
                    if (desc) {
                        const childType = Reflect.getMetadata('design:returntype', proto, key) as Func;
                        if (childType) {
                            const propBase = this.hub.depot.get(childType, false);
                            if (propBase) {
                                properties[key] = propBase.value.clazz.doc(openApi);
                            } else {
                                properties[key] = this.onDoc(childType as ClassLike, openApi);
                            }
                        } else {
                            properties[key] = {};
                        }
                    }
                });
            }
        }
        return openApi(clazz, { type: 'object', properties });
    }

    onConstruct<T>(self: T, ...args: Arr): void {
        $descriptor.save(self, CastValueSign, {});
        const keys: Array<string> = [];
        const errors = [] as Array<Error>;

        if (args.length === 1 && $is.object(args[0])) {
            const value = args[0];
            const entries =
                value instanceof Map ? Object.fromEntries(value as Map<unknown, unknown>) : Object.entries(value);
            for (const [key, value] of entries) {
                if (typeof key !== 'symbol' && value !== undefined) {
                    try {
                        self[key] = value;
                    } catch (e) {
                        this.addError(e, errors, key);
                    }
                    keys.push(key);
                }
            }
        }
        this.getPropertyNames(self.constructor as ClassLike)
            .filter((key) => !keys.includes(key))
            .forEach((key) => {
                try {
                    self[key] = undefined;
                } catch (e) {
                    this.addError(e, errors, key);
                }
            });
        if (errors.length > 0) {
            if (errors.length === 1) {
                throw errors[0];
            }
            const multipleException = new MultipleException();
            multipleException.push(...errors);
            throw multipleException;
        }
    }

    onJson<T>(self: T, breakClass?: ClassLike): Dict {
        const breakClasses = [Object] as Array<ClassLike>;
        if (typeof breakClass === 'function') {
            breakClasses.push(breakClass);
        }

        const result = {};
        const keys: Array<string> = [];
        for (const [key, val] of Object.entries(self)) {
            if (typeof key !== 'symbol') {
                result[key] = this.callToJson(val);
                keys.push(key);
            }
        }

        const rec = $descriptor.getValue<Dict>(self, CastValueSign);
        if ($is.object(rec)) {
            for (const [key, val] of Object.entries(rec)) {
                if (typeof key !== 'symbol' && !keys.includes(key)) {
                    result[key] = this.callToJson(val);
                }
            }
        }
        return result as Dict;
    }

    // endregion on-case

    fetch(classRef: ClassReflectionLike, opt: AssignDtoOpt): void {
        this.hub.check.notDecoratedBy(classRef, CastBasic);
        const clazz = classRef.creator as CastClass;
        const bbb = this.hub.check.getOrCreate(clazz);
        if (opt.field) {
            bbb.value.discriminator = {
                field: opt.field,
                values: opt.values,
            };
        }
        bbb.value.push('from-dto');
    }

    process(classRef: ClassReflectionLike): void {
        const clazz = classRef.creator as CastClass;

        if (!$is.bareObject(clazz.priority)) {
            clazz.priority = {
                instance: [
                    [clazz, 1],
                    [Map, 2],
                ],
                object: 2,
            };
        }
        if (typeof clazz.cast !== 'function') {
            clazz.cast = (v) => this.onCast(clazz, v);
        }
        if (typeof clazz.exact !== 'function') {
            clazz.exact = (v) => this.onExact(clazz, v);
        }

        if (typeof clazz.canBe !== 'function') {
            clazz.canBe = (v) => this.onCanBe(clazz, v);
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = (v) => this.onDoc(clazz, v);
        }
        const onJson = this.onJson;
        // noinspection JSUnusedGlobalSymbols
        clazz.prototype.toJSON = function () {
            return onJson(this, clazz);
        };
    }
}
