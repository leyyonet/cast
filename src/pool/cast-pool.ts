import { Fqn, NamedDepotLike, namedPool } from '@leyyo/core';
import { $assert, $descriptor, $dev, $is, $repo, ClassLike, Func, List } from '@leyyo/common';

import { CastDecoOpt, CastPoolLike } from './index.types';
import { FQN } from '../internal';
import { CastGenerics, CastGenericsLike } from '../generics';
import { CastUnion, CastUnionLike } from '../union';
import { CastPointer, CastBasic, CastBasicLike } from '../basic';
import { CastTuple, CastTupleLike } from '../tuple';
import { CastDiscover, CastDiscoverLike } from '../discover';
import { CastFetch, CastFetchLike } from '../fetch';
import { CastRefactor, CastRefactorLike } from '../refactor';
import { CastTokenizer, CastTokenizerLike } from '../tokenizer';
import {CastEnum, CastEnumLike} from "../enum";

@Fqn(FQN)
class CastPool implements CastPoolLike {
    protected readonly _depot: NamedDepotLike<CastPointer, CastPointer>;
    readonly type: CastBasicLike;
    readonly generics: CastGenericsLike;
    readonly tuple: CastTupleLike;
    readonly union: CastUnionLike;
    readonly discover: CastDiscoverLike;
    readonly fetch: CastFetchLike;
    readonly refactor: CastRefactorLike;
    readonly tokenizer: CastTokenizerLike;
    readonly enum: CastEnumLike;
    readonly sign = $descriptor.sym(FQN, 'values');
    protected readonly _items: List<CastDecoOpt>;

    constructor() {
        this._depot = namedPool.assign<CastPointer, CastPointer>(
            FQN,
            'type.items',
            (ins) => ins,
            (ins) => typeof ins?.cast === 'function' || typeof ins?.castGen === 'function',
        );
        this.type = new CastBasic(this);
        this.generics = new CastGenerics(this);
        this.tuple = new CastTuple(this);
        this.union = new CastUnion(this);
        this.discover = new CastDiscover(this);
        this.fetch = new CastFetch(this);
        this.refactor = new CastRefactor(this);
        this.tokenizer = new CastTokenizer(this);
        this.enum = new CastEnum(this);
        this._items = $repo.newList(FQN, 'pending');
    }

    get depot(): NamedDepotLike<CastPointer, CastPointer> {
        return this._depot;
    }

    copy(source: CastPointer, target: Func | ClassLike): void {
        if (!$is.func(source) && !$is.object(source)) {
            throw $dev.invalidError({
                issue: 'invalid',
                value: source,
                field: 'source',
                where: 'leyyo.cast.CastPool',
                method: 'copy',
                expected: ['function', 'object'],
            });
        }
        $assert.func(target, () => $dev.opt({ field: 'target', where: 'leyyo.cast.CastPool', method: 'copy' }));
        if (
            !this.discover.copy(source, target) &&
            !this.discover.copy((source as unknown as ClassLike)?.prototype, target)
        ) {
            throw $dev.invalidError({
                issue: 'absent.function',
                value: source,
                source,
                target,
                where: 'leyyo.cast.CastPool',
                method: 'copy',
                expected: ['function', 'object'],
            });
        }
    }
}

export const castPool: CastPoolLike = new CastPool();
