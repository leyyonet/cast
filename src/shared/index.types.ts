import { ClassLike, Dict, EnumLiteral, EnumMap, Func, Obj, OneOrMore } from '@leyyo/common';
import { CoreReflectionLike, FqnNaming, NamedDepotItem } from '@leyyo/core';
import { AssignDtoOpt } from '../decorators';

export type CastDocTags = 'dto' | string;
export type CastAnalyseType = 'basic' | 'generics';
export type CastPriorityLevel = 1 | 2 | 3 | 4 | 5 | 99; // min, high, mid, low, min, else
export type CastBasicType = 'string' | 'number' | 'boolean' | 'bigint' | 'object' | 'array' | 'any';
export type CastKind = 'basic' | 'generics' | 'union' | 'tuple';
export type CastTag =
    | 'from-dto'
    | 'from-generics'
    | 'from-tuple'
    | 'from-union'
    | 'from-native'
    | 'from-enum'
    | 'system'
    | 'from-type'
    | 'from-cast'
    | 'from-discriminator'
    | 'GenericsIndex'
    | 'as-generics';
export type CastTokenType =
    | 'comma'
    | 'pipe'
    | 'value'
    | 'generics-begin'
    | 'generics-end'
    | 'tuple-begin'
    | 'tuple-end'
    | 'ignore';

export interface CastDecoOpt {
    given: CastName;
    ref: CoreReflectionLike;
    tokenized?: CastTokenized;
}

export interface CastToken {
    type: CastTokenType;
    value?: string;
}

export interface CastTokenized {
    base?: string;
    kind?: CastKind;
    children?: Array<CastTokenized>;
}

export interface CastTokenizedInside extends CastTokenized {
    parent?: CastTokenizedInside;
    children?: Array<CastTokenizedInside>;
}

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

export type CastEnumName = string | ClassLike | EnumLiteral | EnumMap;
export type CastUnionLevel = CastBasicProp<Map<CastPriorityLevel, Array<CastClass>>>;

export interface CastPriority extends CastBasicProp<CastPriorityLevel> {
    instance?: Array<[ClassLike, CastPriorityLevel]>;
}

export type CastBasicProp<T> = {
    [key in CastBasicType]?: T;
};
export type CastGenericsLambda<T = any> = (children: Array<CastClass>, value: unknown) => T;
// noinspection JSUnusedGlobalSymbols
export type CastGenericsIsLambda = (children: Array<CastClass>, value: unknown) => boolean;
export type CastGenericsDocLambda = (children: Array<CastClass>, openApi: CastDocCallback) => CastDocResponse;

export interface CastExtensionGenerics {
    produced?: boolean;
    min: number;
    max: number;
}

export interface CastClassGenerics {
    castGen?: CastGenericsLambda;
    docGen?: CastGenericsDocLambda;
}
