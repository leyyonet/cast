import { $assert, $descriptor, $dev, $err, $is, Arr, ClassLike, Dict, Func, MultipleException } from '@leyyo/common';
import { FQN } from '../internal';
import { DecoInstanceLike, decoratorPool, fqnHandler, nameHandler, reflectionPool } from '@leyyo/core';
import { castPool } from '../pool';
import { CastPointer } from '../basic';

export interface DtoOpt {
    aliases: Array<string>;
}

const _run = (ins: DecoInstanceLike<DtoOpt>): CastPointer => {
    const ref = ins.asClass;

    // noinspection JSUnusedGlobalSymbols
    const newClass = class extends ref.creator {
        constructor(...args: Arr) {
            super(...args);
            $descriptor.save(this, castPool.sign, {});
            const keys: Array<string> = [];
            const errors = [] as Array<Error>;

            if (args.length === 1 && $is.object(args[0])) {
                const value = args[0];
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
                        } catch (e) {}
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
                if (parent?.constructor?.name === 'Object') {
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
    };
    // set new class name
    nameHandler.set(newClass, ref.creator.name);
    fqnHandler.copy(ref.creator, newClass);
    // sign proxy (build relation between old and new)
    reflectionPool.addProxy(ref.creator, newClass);

    return newClass;
};

export function Dto(...aliases: Array<string>): ClassDecorator {
    return <ClassDecorator>((clazz: Func) => deco.process<ClassLike>([clazz], { aliases }));
}

const deco = decoratorPool
    .newId<DtoOpt>(Dto)
    .fqn(FQN)
    .targets('class')
    .rules('no-multiple')
    .processor((ins, p) => {
        const newClass = _run(ins);

        if (!Array.isArray(p.aliases)) {
            p.aliases = [];
        }
        if (p.aliases.length > 0) {
            $assert.textArray(p.aliases, () => $dev.desc(ins, { field: 'aliases' }));
        }

        if (typeof newClass.cast !== 'function') {
            newClass.cast = (value: unknown): unknown => {
                if ($is.empty(value)) {
                    return value;
                }
                return $is.object(value) && value instanceof newClass ? value : new newClass(value);
            };
        }
        if (typeof newClass.is !== 'function') {
            newClass.is = (value: unknown): boolean => $is.object(value);
        }
        if (typeof newClass.doc !== 'function') {
            newClass.doc = (_v: unknown): Dict => {
                // todo
                return {};
            };
        }
        castPool.depot.add(newClass, ...p.aliases);
        ins.set(p);

        return newClass;
    });
