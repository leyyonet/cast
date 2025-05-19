import { ClassLike, Dict, Func, Obj, OneOrMore } from '@leyyo/common';
import { CastGenericsLike } from '../generics';
import { CastUnionLike } from '../union';
import { CastPointer, CastBasicLike } from '../basic';
import { CastTupleLike } from '../tuple';
import {CoreReflectionLike, NamedDepotLike} from '@leyyo/core';
import {CastDiscoverLike} from "../discover";
import {CastFetchLike} from "../fetch";
import {CastRefactorLike} from "../refactor";
import {CastTokenized, CastTokenizerLike} from "../tokenizer";
import {CastEnumLike} from "../enum";

export type CastNamePlain = string | Func | Obj | ClassLike;
export type CastName = OneOrMore<CastNamePlain>;

export interface CastApiDocResponse extends Dict {
    type?: string;
    $ref?: string;
    oneOf?: Array<CastApiDocResponse>;
    items?: CastApiDocResponse;
}

export type CastDocLambda = (target: unknown, propertyKey: PropertyKey, openApi: Dict) => CastApiDocResponse;
export type CastIsLambda = (value: unknown) => boolean;
export type CastLambda<T = any> = (value: unknown) => T;

export type CastAnalyseType = 'type-instance' | 'type-static' | 'generic-instance' | 'generic-static';

export interface CastPoolLike {
    copy(source: CastPointer, target: Func | ClassLike): void;

    readonly sign: symbol;

    get depot(): NamedDepotLike<CastPointer, CastPointer>;
    get type(): CastBasicLike;
    get generics(): CastGenericsLike;
    get tuple(): CastTupleLike;
    get union(): CastUnionLike;
    get discover(): CastDiscoverLike;
    get fetch(): CastFetchLike;
    get refactor(): CastRefactorLike;
    get tokenizer(): CastTokenizerLike;
    get enum(): CastEnumLike;
}

export type CastKind = 'type' | 'generics' | 'union' | 'tuple' | 'from-dto' | 'from-generics' | 'from-tuple' | 'from-union' | 'from-native' | 'from-enum';

export interface CastDecoOpt {
    given: CastName;
    ref: CoreReflectionLike;
    tokenized?: CastTokenized;
}
