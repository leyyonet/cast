import { Fqn, fqnHandler, FqnNaming, nameHandler, reflectionPool } from '@leyyo/core';
import { $descriptor, $err, $is, $repo, Arr, ClassLike, Dict, MultipleException } from '@leyyo/common';

import { DtoHelperLike, ToJsonLike } from './index.types';
import { FQN } from '../internal';
import { CastValueSign } from '../index.symbols';
import { CastDocCallback, CastDocResponse } from '../pool';
import { CastClass } from '../basic';

@Fqn(FQN)
export class DtoHelper implements DtoHelperLike {
    private propertyNamesMap = $repo.newMap<ClassLike, Array<string>>();
    private counter: number = 0;

    private getPropertyNames(clazz: ClassLike): Array<string> {
        if (!this.propertyNamesMap.has(clazz)) {
            const classRef = reflectionPool.get(clazz, false);
            if (classRef) {
                this.propertyNamesMap.set(clazz, classRef.listInstancePropertyNames({ kind: 'field' }));
            } else {
                this.propertyNamesMap.set(clazz, []);
            }
        }
        return this.propertyNamesMap.get(clazz);
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

    changeNaming(clazz: CastClass, v1: FqnNaming | string): void {
        if ($is.bareObject(v1)) {
            const naming = v1 as FqnNaming;
            nameHandler.set(clazz, naming.basic);
            fqnHandler.clazz(clazz, naming.pck);
        } else {
            if (typeof v1 !== 'string') {
                nameHandler.set(clazz, nameHandler.anonymous('Dto', this.counter));
                this.counter++;
            } else {
                nameHandler.set(clazz, v1);
            }
            fqnHandler.clazz(clazz, FQN);
        }
    }

    checkClass(clazz: CastClass): void {
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
            clazz.cast = (v) => dtoHelper.onCast(clazz, v);
        }
        if (typeof clazz.is !== 'function') {
            clazz.is = (v) => dtoHelper.onIs(clazz, v);
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = (v) => dtoHelper.onDoc(clazz, v);
        }
        // noinspection JSUnusedGlobalSymbols
        clazz.prototype.toJSON = function () {
            return dtoHelper.toJson(this, clazz);
        };
    }

    buildClass(original?: ClassLike): CastClass {
        let clazz: CastClass;
        if (original) {
            clazz = class extends original {
                constructor(...args: Array<unknown>) {
                    super(...args);
                    dtoHelper.onConstruct(this, ...args);
                }

                toJSON(): Dict {
                    return dtoHelper.toJson(this, clazz);
                }
            };
        } else {
            clazz = class {
                constructor(...args: Array<unknown>) {
                    dtoHelper.onConstruct(this, ...args);
                }

                toJSON(): Dict {
                    return dtoHelper.toJson(this, clazz);
                }
            };
        }
        this.checkClass(clazz);
        return clazz;
    }

    onCast<T>(clazz: ClassLike<T>, value: unknown): T {
        if ($is.empty(value)) {
            return value as T;
        }
        return ($is.object(value) && value instanceof clazz ? value : new clazz(value)) as unknown as T;
    }

    onIs<T>(clazz: ClassLike<T>, value: unknown): boolean {
        if ($is.empty(value)) {
            return false;
        }
        // todo
        return $is.bareObject(value);
    }

    onDoc<T>(clazz: ClassLike<T>, openApi: CastDocCallback): CastDocResponse {
        return openApi(clazz, { type: 'object' }, 'dto');
    }

    toJson<T>(self: T, breakClass?: ClassLike): Dict {
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

    onConstruct<T>(self: T, ...args: Arr): void {
        $descriptor.save(self, CastValueSign, {});
        const keys: Array<string> = [];
        const errors = [] as Array<Error>;

        if (args.length === 1 && $is.object(args[0])) {
            const value = args[0];
            const entries =
                value instanceof Map ? Object.fromEntries(value as Map<unknown, unknown>) : Object.entries(value);
            for (const [key, value] of entries) {
                if (typeof key !== 'symbol') {
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
}

export const dtoHelper: DtoHelperLike = new DtoHelper();
