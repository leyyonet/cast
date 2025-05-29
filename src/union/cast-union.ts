import { $dev, $is, $log, Obj } from '@leyyo/common';
import { fqnHandler, nameHandler, reflectionPool } from '@leyyo/core';

import { CastBase, CastDocCallback, CastDocLambda, CastIsLambda, CastLambda, CastPoolLike } from '../pool';
import { CastBasicType, CastClass, CastPriority, CastPriorityLevel } from '../basic';
import { FQN } from '../internal';
import { CastTokenized } from '../tokenizer';

import { CastUnionConfig, CastUnionLevel, CastUnionLike } from './index.types';

export class CastUnion implements CastUnionLike {
    private counter: number = 0;
    private readonly logger = $log.create(CastUnion);

    constructor(protected pool: CastPoolLike) {}

    protected addBasicType(base: CastBase, config: CastUnionConfig, field: CastBasicType): boolean {
        let childLevel: CastPriorityLevel;
        const clazz = base.value.clazz;
        if ($is.bareObject(clazz.priority)) {
            childLevel = clazz.priority[field] as CastPriorityLevel;
        }
        if (typeof childLevel !== 'number') {
            return false;
        }
        if (!config[field]) {
            config[field] = [undefined, undefined];
        }
        const [, existingLevel] = config[field];
        const map = config.tempLevels[field];
        if (map.has(childLevel)) {
            map.get(childLevel).push(clazz);
        } else {
            map.set(childLevel, [clazz]);
        }
        if (!config[field]) {
            config[field] = [clazz, childLevel];
            config.newPriority[field] = childLevel;
        } else if (existingLevel > childLevel) {
            config[field] = [clazz, childLevel];
            config.newPriority[field] = childLevel;
        }
        return true;
    }

    protected runFirst(types: [CastClass, CastPriorityLevel], value: unknown): unknown {
        const clazz = types[0];
        return clazz.cast(value);
    }

    protected newConfig(): CastUnionConfig {
        return {
            is: [],
            string: undefined,
            number: undefined,
            boolean: undefined,
            bigint: undefined,
            object: undefined,
            array: undefined,
            any: undefined,
            instance: [],
            discriminators: [],
            expectedTypes: [],
            tempLevels: {
                string: new Map(),
                number: new Map(),
                boolean: new Map(),
                bigint: new Map(),
                object: new Map(),
                array: new Map(),
                any: new Map(),
            } as CastUnionLevel,
            newPriority: {
                is: undefined,
                string: undefined,
                number: undefined,
                boolean: undefined,
                bigint: undefined,
                object: undefined,
                array: undefined,
                any: undefined,
                instance: [],
            } as CastPriority,
        } as CastUnionConfig;
    }

    protected buildIsLambda(classes: Array<CastClass>): CastIsLambda {
        const isFuncList = classes.map((clazz) => (typeof clazz.is === 'function' ? clazz.is : (_v) => false));
        return (value) => isFuncList.some((fn) => fn(value));
    }

    protected buildCastLambda(config: CastUnionConfig): CastLambda {
        return (value) => {
            if (!$is.empty(value)) {
                return value;
            }
            if (config.is) {
                for (const [clazz, fn] of config.is) {
                    if (fn(value)) {
                        return clazz.cast(value);
                    }
                }
            }
            const type = typeof value;
            if (type === 'object') {
                if (config.discriminators) {
                    const obj = value as Obj;
                    for (const [clazz, disc] of config.discriminators) {
                        if (obj[disc.field] === undefined) {
                            continue;
                        }
                        if (disc.values) {
                            if (disc.values.includes(obj[disc.field])) {
                                return clazz.cast(value);
                            }
                        } else {
                            return clazz.cast(value);
                        }
                    }
                }

                if (config.instance) {
                    for (const [func, clazz] of config.instance) {
                        if (value instanceof func) {
                            return clazz.cast(value);
                        }
                    }
                }

                if (config.array && $is.arrayLike(value)) {
                    return this.runFirst(config.array, value);
                }
            }

            if (config[type]) {
                return this.runFirst(config[type], value);
            }
            if (config.any) {
                return this.runFirst(config.any, value);
            }
            throw $dev.invalidError({ message: 'Unexpected union value', type, expected: config.expectedTypes });
        };
    }

    protected buildDocLambda(clazz: CastClass, classes: Array<CastClass>): CastDocLambda {
        return (openApi: CastDocCallback) => openApi(clazz, { oneOf: [...classes.map((clazz) => clazz.doc(openApi))] });
    }

    protected buildConfig(children: Array<CastBase>): CastUnionConfig {
        const config = this.newConfig();

        children.forEach((child) => {
            const pri = child.value.clazz.priority;
            if ($is.bareObject(pri)) {
                this.addBasicType(child, config, 'string');
                this.addBasicType(child, config, 'number');
                this.addBasicType(child, config, 'boolean');
                this.addBasicType(child, config, 'bigint');
                this.addBasicType(child, config, 'object');
                this.addBasicType(child, config, 'array');
                this.addBasicType(child, config, 'any');

                if (typeof pri.is === 'function') {
                    config.is.push([child.value.clazz, pri.is]);
                }

                if (Array.isArray(pri.instance)) {
                    pri.instance.forEach(([clazz, level]) => {
                        config.instance.push([clazz, child.value.clazz]);
                        config.newPriority.instance.push([clazz, level]);
                    });
                }
            }
            if ($is.bareObject(child.value.discriminator)) {
                config.discriminators.push([child.value.clazz, child.value.discriminator]);
            }
        });
        if (config.discriminators.length > 0) {
            config.discriminators.sort((left, right) => {
                const [, leftOpt] = left;
                const leftSize = Array.isArray(leftOpt) ? leftOpt.length : 99999;
                const [, rightOpt] = right;
                const rightSize = Array.isArray(rightOpt) ? rightOpt.length : 9999;
                if (leftSize < rightSize) {
                    return -1;
                }
                if (rightSize < leftSize) {
                    return 1;
                }
                return 0;
            });
        } else {
            delete config.discriminators;
        }
        if (config.instance.length < 1) {
            delete config.instance;
        }
        if (config.is.length < 1) {
            delete config.is;
        }

        for (const [basicType, map] of Object.entries(config.tempLevels)) {
            for (const [level, duplicatedClasses] of map.entries()) {
                if (duplicatedClasses.length > 0) {
                    this.logger.warn(`Duplicated classes!`, {
                        type: basicType,
                        level,
                        classes: duplicatedClasses.map((cls) => fqnHandler.get(cls)),
                    });
                }
            }
            map.clear();
        }
        config.tempLevels = {};
        return config;
    }

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        let base = this.pool.depot.get(encoded);
        if (base) {
            return base;
        }
        const children = tokenized.children.map((child) => this.pool.discover.build(child));
        let hasPending = false;
        if (children.some((c) => !c)) {
            if (!this.pool.pending.has(tokenized)) {
                this.pool.pending.queue(tokenized, (t) => this.build(t));
            }
            hasPending = true;
        }
        if (hasPending) {
            return undefined;
        }

        const classes = children.map((child) => child.value.clazz);
        const config = this.buildConfig(children);

        const clazz = class {} as CastClass;

        clazz.priority = config.newPriority;
        clazz.is = this.buildIsLambda(classes);
        clazz.cast = this.buildCastLambda(config);
        clazz.doc = this.buildDocLambda(clazz, classes);

        const name = nameHandler.anonymous('Union', this.counter);
        nameHandler.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        const ref = reflectionPool.registerClass(clazz);
        children.forEach((child) => {
            if (reflectionPool.isRegistered(child.value.clazz)) {
                ref.copyDecorators(reflectionPool.get(child.value.clazz), [child.value.clazz]);
            }
        });
        this.counter++;

        base = this.pool.fetch.save(clazz, { tokenized });

        return base;
    }
}
