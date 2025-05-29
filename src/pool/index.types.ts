import { ClassLike, Dict, Func, Obj, OneOrMore } from '@leyyo/common';
import { CastGenericsLike } from '../generics';
import { CastUnionLike } from '../union';
import { CastBasicLike, CastClass, CastValue } from '../basic';
import { CastTupleLike } from '../tuple';
import { CoreReflectionLike, NamedDepotItem, NamedDepotLike } from '@leyyo/core';
import { CastDiscoverLike } from '../discover';
import { CastFetchLike } from '../fetch';
import { CastRefactorLike } from '../refactor';
import { CastTokenized, CastTokenizerLike } from '../tokenizer';
import { CastEnumLike } from '../enum';
import { CastPendingLike } from '../pending';

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

export type CastDocTags = 'dto' | string;

export type CastAnalyseType = 'basic-instance' | 'basic-static' | 'generics-instance' | 'generics-static';

export type CastBase = NamedDepotItem<CastValue, CastClass>;

export interface CastPoolLike {
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
}

export type CastKind = 'basic' | 'generics' | 'union' | 'tuple';
export type CastTag = 'from-dto' | 'from-generics' | 'from-tuple' | 'from-union' | 'from-native' | 'from-enum';

export interface CastDecoOpt {
    given: CastName;
    ref: CoreReflectionLike;
    tokenized?: CastTokenized;
}
