import { ClassLike, Dict, Func, Obj, OneOrMore } from '@leyyo/common';
import { FqnNaming, NamedDepotItem, NamedDepotLike } from '@leyyo/core';

import {
    CastBasicKindLike,
    CastClassGenerics,
    CastDtoKindLike,
    CastEnumKindLike,
    CastExtensionGenerics,
    CastGenericsKindLike,
    CastGroupKindLike,
    CastMergeKindLike,
    CastPriority,
    CastTupleKindLike,
    CastUnionKindLike,
} from '../kind';
import {
    CastCheckLike,
    CastDiscoverLike,
    CastFetchLike,
    CastPendingLike,
    CastRefactorLike,
    CastTokenized,
    CastTokenizerLike,
} from '../process';
import { AssignDtoOpt } from '../decorators';

export interface CastHubLike {
    // region kind
    get basic(): CastBasicKindLike;
    get dto(): CastDtoKindLike;
    get enum(): CastEnumKindLike;
    get generics(): CastGenericsKindLike;
    get group(): CastGroupKindLike;
    get merge(): CastMergeKindLike;
    get tuple(): CastTupleKindLike;
    get union(): CastUnionKindLike;
    // endregion kind

    // region process
    get depot(): NamedDepotLike<CastValue, CastClass>;
    get discover(): CastDiscoverLike;

    get fetch(): CastFetchLike;

    get refactor(): CastRefactorLike;

    get tokenizer(): CastTokenizerLike;
    get pending(): CastPendingLike;

    get check(): CastCheckLike;
    // endregion process
}

// region shared

export type CastDocTags = 'dto' | string;
export type CastBasicType = 'string' | 'number' | 'boolean' | 'bigint' | 'object' | 'array' | 'any';
export type CastKind = 'basic' | 'generics' | 'union' | 'tuple' | 'merge' | 'group';
export type CastTag =
    | 'from-dto'
    | 'from-generics'
    | 'from-tuple'
    | 'from-union'
    | 'from-merge'
    | 'from-native'
    | 'from-enum'
    | 'system'
    | 'from-type'
    | 'as-generics';

export type CastNamePlain = string | Func | Obj | ClassLike;
export type CastName = OneOrMore<CastNamePlain>;

export type CastDocCallback = (
    clazz: ClassLike,
    schema: CastDocResponse,
    ...tags: Array<CastDocTags>
) => CastDocResponse;

export interface CastDocResponse extends Dict {
    type?: string;
    $ref?: string;
    oneOf?: Array<CastDocResponse>;
    items?: CastDocResponse;
}

export type CastDocLambda = (openApi: CastDocCallback) => CastDocResponse;
export type CastIsLambda = (value: unknown) => boolean;
export type CastLambda<T = any> = (value: unknown) => T;

export type CastBase = NamedDepotItem<CastValue, CastClass>;

export interface CastValue {
    clazz: CastClass;
    tokenized: CastTokenized;
    generics?: CastExtensionGenerics;
    tags?: Array<CastTag>;
    main?: string;

    push(tag: CastTag): this;

    naming?: FqnNaming;
    discriminator?: AssignDtoOpt;
}

export interface CastClass extends ClassLike, CastClassGenerics {
    priority?: CastPriority;

    canBe?: CastIsLambda;
    exact?: CastIsLambda;
    cast?: CastLambda;
    doc?: CastDocLambda;
}

// endregion shared
