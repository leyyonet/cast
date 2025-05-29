import { decoratorPool, Fqn, fqnHandler, lifecycle, reflectionPool } from '@leyyo/core';
import { $assert, $dev, $is, $log, Arr, ClassLike, Func } from '@leyyo/common';

import { CastFetchLike, CastFetchSave } from './index.types';
import { CastAnalyseType, CastBase, CastDocCallback, CastDocResponse, CastPoolLike } from '../pool';
import {
    AssignGenerics,
    AssignGenericsOpt,
    AssignTuple,
    AssignTupleOpt,
    AssignType,
    AssignTypeOpt,
    AssignUnion,
    AssignUnionOpt,
    Cast,
    CastOpt,
    Discriminator,
    DiscriminatorOpt,
    Dto,
    DtoOpt,
} from '../decorators';
import { CastClass } from '../basic';
import { FQN } from '../internal';
import { CastTokenized } from '../tokenizer';
import { dtoHelper } from '../dto';

@Fqn(FQN)
export class CastFetch implements CastFetchLike {
    protected readonly _CAST_FUNCTIONS = ['cast', 'doc'] as Array<keyof CastClass>;
    protected readonly _GEN_FUNCTIONS = ['castGen', 'docGen'] as Array<keyof CastClass>;
    protected readonly logger = $log.create(CastFetch);

    constructor(private pool: CastPoolLike) {
        lifecycle
            .onAll(FQN)
            .before('leyyo.http-api')
            .before('leyyo.http-client')
            .before('leyyo.validator')
            .before('leyyo.pipe')
            .before('leyyo.middleware');

        lifecycle.onInitialize(FQN, () => this.initialize());
        lifecycle.onProcess(FQN, () => this.process());
    }

    copy(source: CastClass, target: Func | ClassLike): void {
        if (!this.pool.depot.has(source)) {
            throw $dev.developerError2(FQN, 100, { message: 'Source was not defined', source: fqnHandler.get(source) });
        }
        if (this.pool.depot.has(target)) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Target was already defined',
                target: fqnHandler.get(target),
            });
        }
        $assert.func(target, () => $dev.opt({ field: 'target', where: 'leyyo.cast.CastFetch', method: 'copy' }));

        [...this._CAST_FUNCTIONS, ...this._GEN_FUNCTIONS].forEach((fn) => {
            if (typeof source[fn as string] === 'function') {
                target[fn as string] = (...args: Arr) => source[fn as string](...args);
            }
        });
        if (source.priority) {
            target['priority'] = source.priority;
        }
        this.pool.depot.appendPointer(target, source);
    }

    analyse(clazz: CastClass): CastAnalyseType {
        if (!['function', 'object'].includes(typeof clazz)) {
            return null;
        }
        if (this._GEN_FUNCTIONS.every((fn) => typeof clazz[fn] === 'function')) {
            return 'generics-static';
        }
        const proto = (clazz as unknown as ClassLike).prototype;
        if (proto) {
            if (this._GEN_FUNCTIONS.every((fn) => typeof proto[fn] === 'function')) {
                return 'generics-instance';
            }
        }
        if (this._CAST_FUNCTIONS.every((fn) => typeof clazz[fn] === 'function')) {
            return 'basic-static';
        }
        if (proto) {
            if (this._CAST_FUNCTIONS.every((fn) => typeof proto[fn] === 'function')) {
                return 'basic-instance';
            }
        }
        return null;
    }

    save(clazz: CastClass, opt: CastFetchSave): CastBase {
        const encoded = this.pool.tokenizer.stringify(opt.tokenized);
        if (!Array.isArray(opt.aliases)) {
            opt.aliases = [];
        }
        opt.aliases.push(encoded);
        const base = this.pool.depot.add({ clazz, tokenized: opt.tokenized, tags: [] }, ...opt.aliases);
        base.value.naming = opt.naming ?? fqnHandler.$secure.$get(clazz);
        this.logger.debug(`${clazz.name} is registered as ${encoded}`);
        return base;
    }

    protected fetchAssignType(): void {
        const id = decoratorPool.get(AssignType, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignTypeOpt>();
            const clazz = classRef.creator as CastClass;
            const tokenized = this.pool.tokenizer.parse(clazz, true);

            if (this.pool.depot.has(clazz) || this.pool.depot.has(clazz)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                });
            }
            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    this.save(clazz, { tokenized, aliases: opt.aliases });

                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        desc: ins.description,
                        where: `${FQN}.CastFetch`,
                    });
            }
        });
    }

    protected fetchAssignGenerics(): void {
        const id = decoratorPool.get(AssignGenerics, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignGenericsOpt>();
            const clazz = classRef.creator as CastClass;

            const tokenized = this.pool.tokenizer.parse(clazz, true);
            let base = this.pool.depot.get(clazz);
            if (base) {
                if (!base.value.tags.includes('from-generics')) {
                    base.value.tags.push('from-generics');
                }
                base.value.generics = { min: opt.min, max: opt.max };
                return;
            }
            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    base = this.save(clazz, { tokenized, aliases: opt.aliases });
                    base.value.generics = {
                        min: opt.min,
                        max: opt.max,
                    };
                    base.value.tags.push('from-generics');
                    break;
                default:
                    throw $dev.developerError2(FQN, 101, {
                        message: 'Invalid cast class',
                        desc: ins.description,
                        where: `${FQN}.CastFetch`,
                    });
            }
        });
    }

    protected fetchAssignTuple(): void {
        const id = decoratorPool.get(AssignTuple, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignTupleOpt>();

            const tokenized = { kind: 'basic' } as CastTokenized;
            tokenized.children = opt.types.map((t) => this.pool.tokenizer.parse(t, true));
            const encoded = this.pool.tokenizer.stringify(tokenized);
            const clazz = classRef.creator as CastClass;
            if (this.pool.depot.has(clazz) || this.pool.depot.has(encoded)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                    clazz,
                    encoded,
                });
            }
            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    const base = this.save(clazz, { tokenized });
                    base.value.tags.push('from-tuple');
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'basic',
                        class: classRef.description,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
            }
        });
    }

    protected fetchAssignUnion(): void {
        const id = decoratorPool.get(AssignUnion, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignUnionOpt>();

            const tokenized = { kind: 'basic' } as CastTokenized;
            tokenized.children = opt.types.map((t) => this.pool.tokenizer.parse(t, true));
            const encoded = this.pool.tokenizer.stringify(tokenized);
            const clazz = classRef.creator as CastClass;
            if (this.pool.depot.has(clazz) || this.pool.depot.has(encoded)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                    method: 'fetchAssignUnion',
                    clazz,
                    encoded,
                });
            }
            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    const base = this.save(clazz, { tokenized });
                    base.value.tags.push('from-union');
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'basic',
                        class: classRef.description,
                        where: `${FQN}.CastFetch`,
                        method: 'fetchAssignUnion',
                    });
            }
        });
    }

    protected fetchDto(): void {
        const id = decoratorPool.get(Dto, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<DtoOpt>();
            const clazz = classRef.creator as CastClass;

            const tokenized = this.pool.tokenizer.parse(clazz, true);
            let base = this.pool.depot.get(clazz);
            if (base) {
                if (!base.value.tags.includes('from-dto')) {
                    base.value.tags.push('from-dto');
                }
                return;
            }

            dtoHelper.buildClass(clazz);
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
                clazz.cast = (value: unknown): unknown => dtoHelper.onCast(clazz, value);
            }
            if (typeof clazz.is !== 'function') {
                clazz.is = (value: unknown): boolean => $is.object(value);
            }
            if (typeof clazz.doc !== 'function') {
                reflectionPool
                    .get(clazz)
                    .listInstanceProperties({ kind: 'field' })
                    .forEach((propRef) => {
                        if (propRef.hasDecorator(Cast)) {
                        }
                    });
                clazz.doc = (openApi: CastDocCallback): CastDocResponse => {
                    return openApi(clazz, { type: 'object' }, 'dto');
                };
            }

            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    this.save(clazz, { tokenized, aliases: opt.aliases });
                    base.value.tags.push('from-dto');
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'basic',
                        class: classRef.description,
                        where: `${FQN}.CastFetch`,
                        method: 'dto',
                    });
            }
        });
    }

    protected fetchDiscriminator(): void {
        const id = decoratorPool.get(Discriminator, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<DiscriminatorOpt>();
            const clazz = classRef.creator as CastClass;

            let base = this.pool.depot.get(clazz);
            if (base) {
                base.value.discriminator = {
                    field: opt.field,
                    values: opt.values,
                };
                if (!base.value.tags.includes('from-dto')) {
                    base.value.tags.push('from-dto');
                }
                return;
            }
            const tokenized = this.pool.tokenizer.parse(clazz, true);
            const status = this.analyse(clazz);
            switch (status) {
                case 'basic-instance':
                case 'basic-static':
                    base = this.save(clazz, { tokenized });
                    base.value.tags.push('from-dto');
                    break;
            }
        });
    }

    protected fetchCast(): void {
        const id = decoratorPool.get(Cast, true).asIdentifier;
        id.instances.forEach((ins) => {
            const opt = ins.getValue<CastOpt>();
            if (ins.isField) {
                this.pool.refactor.property(ins, opt);
            } else if (ins.isParameter) {
                this.pool.refactor.parameter(ins, opt);
            }
        });
    }

    initialize(): void {
        this.fetchAssignType();
        this.fetchAssignGenerics();
        this.fetchAssignTuple();
        this.fetchAssignUnion();
        this.fetchDto();
        this.fetchDiscriminator();
    }

    process(): void {
        this.fetchCast();
    }
}
