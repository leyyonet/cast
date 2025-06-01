import {$dev, $is, $log, $name, Obj} from '@leyyo/common';
import { ClassReflectionLike, fqnHandler, reflectionPool } from '@leyyo/core';

import {
    CastBase,
    CastBasicType,
    CastClass,
    CastDocCallback,
    CastDocLambda,
    CastHubLike,
    CastIsLambda,
    CastLambda,
} from '../hub';
import { FQN } from '../internal';
import { AssignUnionOpt, CastBasic, CastDto, CastGenerics, CastTuple } from '../decorators';
import {
    CastPriority,
    CastPriorityLevel,
    CastUnionConfig,
    CastUnionKindLike,
    CastUnionSerializedMap,
} from './index.types';
import {CastTokenized} from "../process";

export class CastUnionKind implements CastUnionKindLike {
    // region properties
    private readonly logger = $log.create(CastUnionKind);
    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region private
    private _addBasicType(bbb: CastBase, config: CastUnionConfig, field: CastBasicType): boolean {
        let childLevel: CastPriorityLevel;
        const clazz = bbb.value.clazz;
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

    private _runFirst(types: [CastClass, CastPriorityLevel], value: unknown): unknown {
        const clazz = types[0];
        return clazz.cast(value);
    }

    private _newConfig(): CastUnionConfig {
        return {
            exact: [],
            canBe: [],
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
            } as CastUnionSerializedMap,
            newPriority: {
                canBe: undefined,
                exact: undefined,
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

    private _buildCanBeLambda(classes: Array<CastClass>): CastIsLambda {
        return (value) => classes.some((clazz) => clazz.canBe(value));
    }

    private _buildExactLambda(classes: Array<CastClass>): CastIsLambda {
        return (value) => classes.some((clazz) => clazz.exact(value));
    }

    private _buildCastLambda(config: CastUnionConfig): CastLambda {
        return (value) => {
            if (!$is.empty(value)) {
                return value;
            }
            if (config.exact) {
                for (const [clazz, fn] of config.exact) {
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
                    return this._runFirst(config.array, value);
                }
            }

            if (config[type]) {
                return this._runFirst(config[type], value);
            }
            if (config.any) {
                return this._runFirst(config.any, value);
            }
            throw $dev.invalidError({ message: 'Unexpected union value', type, expected: config.expectedTypes });
        };
    }

    private _buildDocLambda(clazz: CastClass, classes: Array<CastClass>): CastDocLambda {
        return (openApi: CastDocCallback) => openApi(clazz, { oneOf: [...classes.map((clazz) => clazz.doc(openApi))] });
    }

    private _buildConfig(children: Array<CastBase>): CastUnionConfig {
        const config = this._newConfig();

        children.forEach((child) => {
            const pri = child.value.clazz.priority;
            if ($is.bareObject(pri)) {
                this._addBasicType(child, config, 'string');
                this._addBasicType(child, config, 'number');
                this._addBasicType(child, config, 'boolean');
                this._addBasicType(child, config, 'bigint');
                this._addBasicType(child, config, 'object');
                this._addBasicType(child, config, 'array');
                this._addBasicType(child, config, 'any');

                if (Array.isArray(pri.instance)) {
                    pri.instance.forEach(([clazz, level]) => {
                        config.instance.push([clazz, child.value.clazz]);
                        config.newPriority.instance.push([clazz, level]);
                    });
                }
            }
            if (!child.value.tags.includes('system')) {
                config.exact.push([child.value.clazz, child.value.clazz.exact]);
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

    private _process(bbb: CastBase): CastBase {
        const tokenized = bbb.value.tokenized;
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        const classes = children.map((child) => child.value.clazz);
        const clazz = bbb.value.clazz;
        const config = this._buildConfig(children);

        if (!$is.bareObject(clazz.priority)) {
            clazz.priority = config.newPriority;
        }
        if (typeof clazz.cast !== 'function') {
            clazz.cast = this._buildCastLambda(config);
        }
        if (typeof clazz.exact !== 'function') {
            clazz.exact = this._buildExactLambda(classes);
        }
        if (typeof clazz.canBe !== 'function') {
            clazz.canBe = this._buildCanBeLambda(classes);
        }
        if (typeof clazz.doc !== 'function') {
            clazz.doc = this._buildDocLambda(clazz, classes);
        }

        const ref = reflectionPool.registerClass(clazz);
        classes.forEach((cls) => {
            if (reflectionPool.isRegistered(cls)) {
                ref.copyDecorators(reflectionPool.get(cls));
            }
        });
        return bbb;
    }

    // endregion private

    fetch(classRef: ClassReflectionLike, opt: AssignUnionOpt): void {
        this.hub.check.notDecoratedBy(classRef, CastBasic, CastDto, CastGenerics, CastTuple);
        const clazz = classRef.creator as CastClass;
        const tokenized = this.hub.tokenizer.parse(opt.pattern, true);
        const encoded = this.hub.tokenizer.stringify(tokenized);

        this.hub.check.checkDuplicated(clazz, encoded);

        this.hub.check.save(clazz, { tokenized }).value.push('from-union');
    }

    process(classRef: ClassReflectionLike): void {
        const clazz = classRef.creator as CastClass;

        const bbb = this.hub.depot.get(clazz);
        const tokenized = bbb.value.tokenized;
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        if (children.some((b) => !b)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (_t) => this._process(bbb));
            }
            return;
        }
        this._process(bbb);
    }

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.hub.tokenizer.stringify(tokenized);
        let bbb = this.hub.depot.get(encoded);
        if (bbb) {
            return bbb;
        }
        const children = tokenized.children.map((child) => this.hub.discover.build(child));
        let hasPending = false;
        if (children.some((c) => !c)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (t) => this.build(t));
            }
            hasPending = true;
        }
        if (hasPending) {
            return undefined;
        }

        const classes = children.map((child) => child.value.clazz);
        const config = this._buildConfig(children);

        const clazz = class {} as CastClass;

        clazz.priority = config.newPriority;
        clazz.exact = this._buildExactLambda(classes);
        clazz.canBe = this._buildCanBeLambda(classes);
        clazz.cast = this._buildCastLambda(config);
        clazz.doc = this._buildDocLambda(clazz, classes);

        const name = $name.anonymous('Union');
        $name.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        const ref = reflectionPool.registerClass(clazz);
        children.forEach((child) => {
            if (reflectionPool.isRegistered(child.value.clazz)) {
                ref.copyDecorators(reflectionPool.get(child.value.clazz));
            }
        });

        bbb = this.hub.check.save(clazz, { tokenized });

        return bbb;
    }
}
