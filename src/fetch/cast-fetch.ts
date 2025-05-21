import {decoratorPool, Fqn, lifecycle} from '@leyyo/core';
import { $descriptor, $dev, $is, $repo, ClassLike } from '@leyyo/common';

import { CastFetchLike } from './index.types';
import { CastAnalyseType, CastKind, CastPoolLike } from '../pool';
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
import { CastExtension, CastPointer } from '../basic';
import { FQN } from '../internal';
import { CastExtensionSign } from '../index.symbols';
import {CastTokenized} from "../tokenizer";

@Fqn(FQN)
export class CastFetch implements CastFetchLike {
    protected readonly _CAST_FUNCTIONS = ['cast', 'doc'] as Array<keyof CastPointer>;
    protected readonly _GEN_FUNCTIONS = ['castGen', 'docGen'] as Array<keyof CastPointer>;
    protected readonly assignedPointers: Set<CastPointer>;

    constructor(private pool: CastPoolLike) {
        this.assignedPointers = $repo.newSet(FQN, 'assignedPointers');

        lifecycle.onInitialize(FQN, () => this.initialize())
            .before('leyyo.http-api')
            .before('leyyo.http-client')
            .before('leyyo.validator')
            .before('leyyo.pipe')
            .before('leyyo.middleware');
        lifecycle.onProcess(FQN, () => this.process())
            .before('leyyo.http-api')
            .before('leyyo.http-client')
            .before('leyyo.validator')
            .before('leyyo.pipe')
            .before('leyyo.middleware');
    }

    analyse(pointer: CastPointer): CastAnalyseType {
        if (!['function', 'object'].includes(typeof pointer)) {
            return null;
        }
        if (this._GEN_FUNCTIONS.every((fn) => typeof pointer[fn] === 'function')) {
            return 'generic-static';
        }
        const proto = (pointer as unknown as ClassLike).prototype;
        if (proto) {
            if (this._GEN_FUNCTIONS.every((fn) => typeof proto[fn] === 'function')) {
                return 'generic-instance';
            }
        }
        if (this._CAST_FUNCTIONS.every((fn) => typeof pointer[fn] === 'function')) {
            return 'type-static';
        }
        if (proto) {
            if (this._CAST_FUNCTIONS.every((fn) => typeof proto[fn] === 'function')) {
                return 'type-instance';
            }
        }
        return null;
    }

    protected _getExtension(pointer: CastPointer): CastExtension {
        return $descriptor.getValue<CastExtension>(pointer, CastExtensionSign);
    }

    protected _setExtension(pointer: CastPointer, extension: CastExtension) {
        $descriptor.save(pointer, CastExtensionSign, extension);
    }

    protected _refreshKind(extension: CastExtension, kinds: Array<CastKind>) {
        if (!Array.isArray(extension.tokenized.kinds)) {
            extension.tokenized.kinds = [];
        }
        if (Array.isArray(kinds)) {
            kinds.forEach((kind) => {
                if (!extension.tokenized.kinds.includes(kind)) {
                    extension.tokenized.kinds.push(kind);
                }
            });
        }
        extension.hash = this.pool.tokenizer.stringify(extension.tokenized);
    }

    save(
        pointer: CastPointer,
        tokenized: CastTokenized,
        aliases: Array<string>,
        kinds: Array<CastKind>,
        ext: Partial<CastExtension>,
    ): void {
        const extension = { tokenized, names: [] } as CastExtension;
        this._refreshKind(extension, kinds);
        const base = this.pool.depot.add(pointer, ...aliases, extension.hash);
        [base.full, base.basic, ...aliases].forEach((name) => {
            if (name && !extension.names.includes(name)) {
                extension.names.push(name);
            }
        });

        if ($is.bareObject(ext)) {
            for (const [k, v] of Object.entries(ext)) {
                if (!['tokenized', 'names'].includes(k)) {
                    extension[k] = v;
                }
            }
        }
        this._setExtension(pointer, extension);
        this.assignedPointers.add(pointer);
    }

    protected assignType(): void {
        const id = decoratorPool.get(AssignType, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignTypeOpt>();
            const pointer = classRef.creator as CastPointer;
            if (this.assignedPointers.has(pointer)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                });
            }
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    const tokenized = this.pool.tokenizer.parse(pointer, true);
                    this.save(pointer, tokenized, opt.aliases, ['type'], {});
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

    protected assignGenerics(): void {
        const id = decoratorPool.get(AssignGenerics, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignGenericsOpt>();
            const pointer = classRef.creator as CastPointer;
            if (this.assignedPointers.has(pointer)) {
                const extension = this._getExtension(pointer);
                if (extension) {
                    this._refreshKind(extension, ['from-generics']);
                    extension.gen = { min: opt.min, max: opt.max };
                    this._setExtension(pointer, extension);
                }
                return;
            }
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    const tokenized = this.pool.tokenizer.parse(pointer, true);
                    this.save(pointer, tokenized, opt.aliases, ['type', 'from-generics'], {
                        gen: {
                            min: opt.min,
                            max: opt.max,
                        },
                    });
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

    protected assignTuple(): void {
        const id = decoratorPool.get(AssignTuple, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignTupleOpt>();

            const tokenized = {} as CastTokenized;
            tokenized.children = opt.types.map((t) => this.pool.tokenizer.parse(t, true));
            const pointer = classRef.creator as CastPointer;
            if (this.assignedPointers.has(pointer)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                });
            }
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    this.save(pointer, tokenized, [], ['type', 'from-tuple'], {});
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'type',
                        class: classRef.description,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
            }
        });
    }

    protected assignUnion(): void {
        const id = decoratorPool.get(AssignUnion, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<AssignUnionOpt>();

            const tokenized = {} as CastTokenized;
            tokenized.children = opt.types.map((t) => this.pool.tokenizer.parse(t, true));
            const pointer = classRef.creator as CastPointer;
            if (this.assignedPointers.has(pointer)) {
                throw $dev.developerError2(FQN, 100, {
                    message: 'Duplicated cast class',
                    desc: ins.description,
                    where: `${FQN}.CastFetch`,
                });
            }
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    this.save(pointer, tokenized, [], ['type', 'from-union'], {});
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'type',
                        class: classRef.description,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
            }
        });
    }

    protected dto(): void {
        const id = decoratorPool.get(Dto, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<DtoOpt>();
            const pointer = classRef.creator as CastPointer;
            if (this.assignedPointers.has(pointer)) {
                const extension = this._getExtension(pointer);
                if (extension) {
                    this._refreshKind(extension, ['from-dto']);
                    this._setExtension(pointer, extension);
                }
                return;
            }
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    const tokenized = this.pool.tokenizer.parse(pointer, true);
                    this.save(pointer, tokenized, opt.aliases, ['type', 'from-dto'], {});
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'type',
                        class: classRef.description,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
            }
        });
    }

    protected fetchDiscriminator(): void {
        const id = decoratorPool.get(Discriminator, true).asIdentifier;
        id.instances.forEach((ins) => {
            const classRef = ins.asClass;
            const opt = ins.getValue<DiscriminatorOpt>();
            opt.field;
            opt.values;
            const pointer = classRef.creator as CastPointer;
            const status = this.analyse(pointer);
            switch (status) {
                case 'type-instance':
                case 'type-static':
                    this.pool.depot.add(pointer);
                    break;
                default:
                    throw $dev.developerError2(FQN, 100, {
                        message: 'Invalid cast class',
                        kind: 'type',
                        class: classRef.description,
                        where: 'leyyo.cast.CastPool',
                        method: 'find',
                    });
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
        this.assignType();
        this.assignGenerics();
        this.assignTuple();
        this.assignUnion();
        this.dto();
        this.assignedPointers.clear();

    }

    process(): void {
        this.fetchCast();
    }
}
