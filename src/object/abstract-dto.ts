import { Fqn, fqnHandler, reflectionPool } from '@leyyo/core';
import { FQN } from '../internal';
import { $descriptor, $err, $is, $log, ClassLike, Dict, MultipleException } from '@leyyo/common';
import { CastApiDocResponse, castPool } from '../pool';

// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected,JSUnusedGlobalSymbols, JSUnusedLocalSymbols
@Fqn(FQN)
export class AbstractDto implements Dict {
    [key: string]: unknown;

    constructor(value?: unknown) {
        $descriptor.save(this, castPool.sign, {});
        const keys: Array<string> = [];
        const errors = [] as Array<Error>;
        if ($is.object(value)) {
            // console.log('constructor ' + Object.getPrototypeOf(this).constructor.name, value);
            const entries =
                value instanceof Map ? Object.fromEntries(value as Map<unknown, unknown>) : Object.entries(value);
            for (const [k, v] of entries) {
                if (typeof k !== 'symbol') {
                    try {
                        this[k] = v;
                    } catch (e) {
                        const err = $err.build(e);
                        err.params['field'] = k;
                        errors.push(err);
                    }
                    keys.push(k);
                }
            }
        }
        try {
            reflectionPool
                .get(this.constructor)
                .listInstancePropertyNames({ kind: 'field' })
                .filter((k) => !keys.includes(k))
                .forEach((k) => {
                    try {
                        this[k] = undefined;
                    } catch (e) {
                        logger.warn(e, {
                            indicator: 'cast.default.property',
                            clazz: fqnHandler.get(this.constructor),
                            property: k,
                        });
                    }
                });
        } catch (e) {}

        if (errors.length > 0) {
            if (errors.length === 1) {
                throw errors[0];
            }
            const multipleException = new MultipleException();
            multipleException.push(...errors);
            throw multipleException;
        }
    }

    static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
        return { type: 'string' };
    }

    static cast(value: unknown): unknown {
        return this.ly_inner(this, value);
    }

    protected static ly_inner<T extends Dict>(clazz: ClassLike, value: unknown): T {
        if ($is.empty(value)) {
            return null;
        }
        return ($is.object(value) && value instanceof clazz ? value : new clazz(value)) as unknown as T;
    }

    toJSON(): Dict {
        const result = {};
        const keys: Array<string> = [];
        for (const [k, v] of Object.entries(this)) {
            if (typeof k !== 'symbol') {
                result[k] =
                    typeof (v as { toJSON: () => void })?.toJSON === 'function'
                        ? (
                              v as {
                                  toJSON: () => void;
                              }
                          ).toJSON()
                        : v;
                keys.push(k);
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        let parent = this;
        while (parent) {
            if (parent?.constructor === AbstractDto) {
                break;
            }
            const rec = $descriptor.get(this, castPool.sign);
            if ($is.object(rec?.value)) {
                for (const [k, v] of Object.entries(rec?.value)) {
                    if (typeof k !== 'symbol' && !keys.includes(k)) {
                        result[k] =
                            typeof (v as { toJSON: () => void })?.toJSON === 'function'
                                ? (
                                      v as {
                                          toJSON: () => void;
                                      }
                                  ).toJSON()
                                : v;
                        keys.push(k);
                    }
                }
            }
            parent = Object.getPrototypeOf(parent);
        }
        return result as Dict;
    }
}

const logger = $log.create(AbstractDto);
/*
* function AssignCtor<T extends object>() {
    return class {
        constructor(t: T) {
            Object.assign(this, t)
        }
    } as { new(t: T): T }
}

interface CommunityProps {
    prop1: string
    prop2: number
    prop3: boolean
}
class Community extends AssignCtor<CommunityProps>() {

}

const comm = new Community({ prop1: "", prop2: 1, prop3: true });
console.log(comm.prop2.toFixed(1)) // 1.0
*
* */
