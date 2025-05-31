import { Fqn, NamedDepotLike, namedPool } from '@leyyo/core';
import { $repo, List } from '@leyyo/common';

import { FQN } from '../internal';
import { CastClass, CastDecoOpt, CastValue } from '../shared';
import { CastGenerics, CastGenericsLike } from '../generics';
import { CastUnion, CastUnionLike } from '../union';
import { CastBasic, CastBasicLike } from '../basic';
import { CastTuple, CastTupleLike } from '../tuple';
import { CastDiscover, CastDiscoverLike } from '../discover';
import { CastFetch, CastFetchLike } from '../fetch';
import { CastRefactor, CastRefactorLike } from '../refactor';
import { CastTokenizer, CastTokenizerLike } from '../tokenizer';
import { CastEnum, CastEnumLike } from '../enum';
import { CastPending, CastPendingLike } from '../pending';
import { CastDto, CastDtoLike } from '../dto';
import { CastHubLike } from './index.types';
import { CastCheck, CastCheckLike } from '../check';

@Fqn(FQN)
class CastHub implements CastHubLike {
    protected readonly _depot: NamedDepotLike<CastValue, CastClass>;
    readonly basic: CastBasicLike;
    readonly generics: CastGenericsLike;
    readonly tuple: CastTupleLike;
    readonly union: CastUnionLike;
    readonly discover: CastDiscoverLike;
    readonly fetch: CastFetchLike;
    readonly refactor: CastRefactorLike;
    readonly tokenizer: CastTokenizerLike;
    readonly enum: CastEnumLike;
    readonly pending: CastPendingLike;
    readonly dto: CastDtoLike;
    readonly check: CastCheckLike;
    protected readonly _items: List<CastDecoOpt>;

    constructor() {
        this._depot = namedPool.assign<CastValue, CastClass>(
            FQN,
            'items',
            (ins) => ins.clazz,
            (ins) => typeof ins?.clazz?.cast === 'function' || typeof ins?.clazz?.castGen === 'function',
        );
        this.basic = new CastBasic(this);
        this.generics = new CastGenerics(this);
        this.tuple = new CastTuple(this);
        this.union = new CastUnion(this);
        this.discover = new CastDiscover(this);
        this.fetch = new CastFetch(this);
        this.refactor = new CastRefactor(this);
        this.tokenizer = new CastTokenizer(this);
        this.enum = new CastEnum(this);
        this.pending = new CastPending(this);
        this.dto = new CastDto(this);
        this.check = new CastCheck(this);
        this._items = $repo.newList(FQN, 'pending');
    }

    get depot(): NamedDepotLike<CastValue, CastClass> {
        return this._depot;
    }
}

export const castPool: CastHubLike = new CastHub();
