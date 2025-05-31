import { $dev, $is, $log, $repo, Func } from '@leyyo/common';
import { ClassReflectionLike, Fqn, fqnHandler, nameHandler, PropertyReflectionLike, reflectionPool } from '@leyyo/core';
import { FQN } from '../internal';
import { CastGenericsLike } from './index.types';
import { CastHubLike } from '../hub';
import { CastBase, CastClass, CastDocCallback, CastDocResponse, CastName, CastTokenized } from '../shared';
import { AssignGenerics, AssignGenericsOpt, AssignType, GenericsIndexOpt } from '../decorators';
import { CastGenericDefSign } from '../index.symbols';

@Fqn(FQN)
export class CastGenerics implements CastGenericsLike {
    // region properties
    private logger = $log.create(CastGenerics);
    private indexes = $repo.newMap<ClassReflectionLike, Map<number, PropertyReflectionLike>>(FQN, 'indexes');

    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region custom

    addIndex(fieldRef: PropertyReflectionLike, opt: GenericsIndexOpt): void {
        const classRef = fieldRef.clazz;
        if (!classRef.hasDecorator(AssignGenerics)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Class must be decorated by "AssignDto" or "AssignGenerics"',
                field: fieldRef.description,
            });
        }
        const base = this.hub.depot.get(classRef, true);
        base.value.push('as-generics');
        if (!base.value.generics) {
            base.value.generics = {
                produced: true,
                min: 0,
                max: opt.index + 1,
            };
        } else {
            const extGenerics = base.value.generics;
            if (extGenerics.max <= opt.index) {
                if (extGenerics.produced) {
                    extGenerics.max = opt.index + 1;
                } else {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Index not in generics range',
                        field: fieldRef.description,
                        max: extGenerics.max,
                        index: opt.index,
                    });
                }
            }
        }
        if (!this.indexes.has(classRef)) {
            this.indexes.set(classRef, new Map());
        }
        if (this.indexes.get(classRef).has(opt.index)) {
            const another = this.indexes.get(classRef).get(opt.index);
            if (another !== fieldRef) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Index duplicated',
                    field: fieldRef.description,
                    another: another.description,
                    index: opt.index,
                });
            }
        }
        fieldRef.setMetaKey(CastGenericDefSign, opt.def);
        this.indexes.get(classRef).set(opt.index, fieldRef);
    }

    processIndex(fieldRef: PropertyReflectionLike): void {
        const def = fieldRef.getMetaKey<CastName>(CastGenericDefSign);
        if (def) {
            const clazz = this.hub.discover.find(def, () => $dev.opt({ where: 'CastGenerics', method: 'process' }));
            fieldRef.$secure.$setType(clazz as Func);
        }
    }

    fetch(classRef: ClassReflectionLike, opt: AssignGenericsOpt): void {
        this.hub.check.notDecoratedBy(classRef, AssignType);
        const clazz = classRef.creator as CastClass;
        const base = this.hub.check.getOrCreate(clazz);
        base.value.push('as-generics');
        base.value.generics = {
            min: opt.min,
            max: opt.max,
        };
    }

    process(classRef: ClassReflectionLike): void {
        const clazz = classRef.creator as CastClass;
        const base = this.hub.depot.get(clazz);
        const extGenerics = base.value.generics;
        if (!extGenerics) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Generic class does not have range',
                clazz: classRef.description,
                where: `${FQN}.CastDiscover`,
                method: 'process',
            });
        }

        const absentIndexes = [];
        let indexMap: Map<number, PropertyReflectionLike>;
        if (this.indexes.has(classRef)) {
            indexMap = this.indexes.get(classRef);
            for (let i = 0; i < extGenerics.max; i++) {
                if (!indexMap.has(i)) {
                    absentIndexes.push(i);
                }
            }
        } else {
            indexMap = new Map();
        }

        if (typeof clazz.castGen !== 'function') {
            if (this.indexes.has(classRef)) {
                if (absentIndexes.length > 0) {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Generic class has invalid ranges',
                        clazz: classRef.description,
                        where: `${FQN}.CastDiscover`,
                        method: 'process',
                        absentIndexes,
                    });
                }
                clazz.castGen = (children, value): unknown => {
                    if ($is.object(value)) {
                        children.forEach((child, index) => {
                            if (indexMap.has(index)) {
                                const fieldRef = indexMap.get(index);
                                value[fieldRef.name] = child.cast(value[fieldRef.name]);
                            }
                        });
                    }
                    return value;
                };
            } else {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Generic class does not have "castGen" method',
                    clazz: classRef.description,
                    where: `${FQN}.CastDiscover`,
                    method: 'process',
                });
            }
        }
        if (typeof clazz.docGen !== 'function') {
            if (this.indexes.has(classRef)) {
                if (absentIndexes.length > 0) {
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Generic class has invalid ranges',
                        clazz: classRef.description,
                        where: `${FQN}.CastDiscover`,
                        method: 'process',
                        absentIndexes,
                    });
                }
                clazz.docGen = (children: Array<CastClass>, openApi: CastDocCallback): CastDocResponse => {
                    const properties = {};
                    children.forEach((child, index) => {
                        if (indexMap.has(index)) {
                            const fieldRef = indexMap.get(index);
                            properties[fieldRef.name] = child.doc(openApi);
                        } else {
                            properties[`$index-${index}`] = child.doc(openApi);
                        }
                    });
                    return openApi(clazz, { type: 'object', properties });
                };
            } else {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Generic class does not have "castGen" method',
                    clazz: classRef.description,
                    where: `${FQN}.CastDiscover`,
                    method: 'process',
                });
            }
        }
    }

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.hub.tokenizer.stringify(tokenized);
        let base = this.hub.depot.get(encoded);
        if (base) {
            return base;
        }
        if (!this.hub.depot.has(tokenized.base)) {
            if (!this.hub.pending.has(tokenized)) {
                this.hub.pending.queue(tokenized, (t) => this.build(t));
            }
            return undefined;
        }
        const children = tokenized.children.map((child) => this.hub.discover.build(child)).map((c) => c.value.clazz);

        const mainBase = this.hub.depot.get(tokenized.base);
        const extGenerics = mainBase.value.generics;
        const mainClass = mainBase.value.clazz;
        if (!mainBase.value.tags.includes('as-generics') || !extGenerics) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Class is not generics class',
                clazz: fqnHandler.get(mainClass),
                where: `${FQN}.CastDiscover`,
                method: 'process',
            });
        }
        if (children.length < extGenerics.min) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Generic class has not enough parameters',
                clazz: fqnHandler.get(mainClass),
                where: `${FQN}.CastDiscover`,
                method: 'process',
                current: children.length,
                expected: extGenerics.min,
            });
        }
        if (children.length > extGenerics.max) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Generic class has more parameters',
                clazz: fqnHandler.get(mainClass),
                where: `${FQN}.CastDiscover`,
                method: 'process',
                current: children.length,
                expected: extGenerics.max,
            });
        }

        // noinspection JSUnusedGlobalSymbols
        const clazz = class extends mainClass {
            static priority = mainClass.priority;

            static cast(value: unknown): unknown {
                return mainClass.castGen(children, value);
            }

            static doc(openApi: CastDocCallback): CastDocResponse {
                return mainClass.docGen(children, openApi);
            }
        } as CastClass;
        const name = nameHandler.anonymous(mainClass.name);
        nameHandler.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);
        reflectionPool.registerClass(clazz);

        base = this.hub.check.save(clazz, { tokenized });
        this.hub.pending.complete(tokenized);

        return base;
    }

    // endregion custom
}

// Array<Customer>
