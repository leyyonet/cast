import { NamedDepotLike } from '@leyyo/core';

import { CastClass, CastValue } from '../shared';
import { CastGenericsLike } from '../generics';
import { CastUnionLike } from '../union';
import { CastBasicLike } from '../basic';
import { CastTupleLike } from '../tuple';
import { CastDiscoverLike } from '../discover';
import { CastFetchLike } from '../fetch';
import { CastRefactorLike } from '../refactor';
import { CastTokenizerLike } from '../tokenizer';
import { CastEnumLike } from '../enum';
import { CastPendingLike } from '../pending';
import { CastDtoLike } from '../dto';
import { CastCheckLike } from '../check';

export interface CastHubLike {
    get depot(): NamedDepotLike<CastValue, CastClass>;

    get basic(): CastBasicLike;

    get generics(): CastGenericsLike;

    get tuple(): CastTupleLike;

    get union(): CastUnionLike;

    get discover(): CastDiscoverLike;

    get fetch(): CastFetchLike;

    get refactor(): CastRefactorLike;

    get tokenizer(): CastTokenizerLike;

    get enum(): CastEnumLike;

    get pending(): CastPendingLike;

    get dto(): CastDtoLike;

    get check(): CastCheckLike;
}
