import { Fqn, NamedDepotLike, namedPool } from '@leyyo/core';

import { FQN } from '../internal';
import {
    CastBasicKind,
    CastBasicKindLike,
    CastDtoKind,
    CastDtoKindLike,
    CastEnumKind,
    CastEnumKindLike,
    CastGenericsKind,
    CastGenericsKindLike,
    CastGroupKind,
    CastGroupKindLike,
    CastMergeKind,
    CastMergeKindLike,
    CastTupleKind,
    CastTupleKindLike,
    CastUnionKind,
    CastUnionKindLike,
} from '../kind';
import { CastClass, CastHubLike, CastValue } from './index.types';
import {
    CastCheck,
    CastCheckLike,
    CastDiscover,
    CastDiscoverLike,
    CastFetch,
    CastFetchLike,
    CastPending,
    CastPendingLike,
    CastRefactor,
    CastRefactorLike,
    CastTokenizer,
    CastTokenizerLike,
} from '../process';

@Fqn(FQN)
class CastHub implements CastHubLike {
    private readonly _depot: NamedDepotLike<CastValue, CastClass>;

    // region kind
    readonly basic: CastBasicKindLike;
    readonly dto: CastDtoKindLike;
    readonly enum: CastEnumKindLike;
    readonly generics: CastGenericsKindLike;
    readonly group: CastGroupKindLike;
    readonly merge: CastMergeKindLike;
    readonly tuple: CastTupleKindLike;
    readonly union: CastUnionKindLike;
    // endregion kind

    // region process
    readonly discover: CastDiscoverLike;
    readonly fetch: CastFetchLike;
    readonly refactor: CastRefactorLike;
    readonly tokenizer: CastTokenizerLike;
    readonly pending: CastPendingLike;
    readonly check: CastCheckLike;
    get depot(): NamedDepotLike<CastValue, CastClass> {
        return this._depot;
    }
    // endregion process

    constructor() {
        this._depot = namedPool.assign<CastValue, CastClass>(
            FQN,
            'items',
            (ins) => ins.clazz,
            (ins) => typeof ins?.clazz?.cast === 'function' || typeof ins?.clazz?.castGen === 'function',
        );

        // region kind
        this.basic = new CastBasicKind(this);
        this.dto = new CastDtoKind(this);
        this.enum = new CastEnumKind(this);
        this.generics = new CastGenericsKind(this);
        this.group = new CastGroupKind(this);
        this.merge = new CastMergeKind(this);
        this.tuple = new CastTupleKind(this);
        this.union = new CastUnionKind(this);
        // endregion kind

        // region process
        this.check = new CastCheck(this);
        this.discover = new CastDiscover(this);
        this.fetch = new CastFetch(this);
        this.refactor = new CastRefactor(this);
        this.tokenizer = new CastTokenizer(this);
        this.pending = new CastPending(this);
        // endregion process
    }
}

export const castHub: CastHubLike = new CastHub();
