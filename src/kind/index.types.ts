import { Arr, ClassLike, Dict, EnumLiteral, EnumMap, Func } from '@leyyo/common';
import { ClassReflectionLike, PropertyReflectionLike } from '@leyyo/core';
import {
    CastBase,
    CastBasicType,
    CastClass,
    CastDocCallback,
    CastDocResponse,
    CastIsLambda,
} from '../hub';
import {
    AssignDtoOpt,
    AssignGenericsOpt,
    AssignTupleOpt,
    AssignTypeOpt,
    AssignUnionOpt,
    CastAliasOpt,
    GenericsIndexOpt,
} from '../decorators';
import {CastTokenized} from "../process";

// region basic
export interface CastBasicKindLike {
    addNative(fn: Func): void;

    fetch(classRef: ClassReflectionLike, opt: AssignTypeOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;

    fetchAlias(fn: Func | ClassLike, opt: CastAliasOpt): void;

    fetchAlias(classRef: ClassReflectionLike, opt: CastAliasOpt): void;
}
// endregion basic

// region tuple
export interface CastTupleKindLike {
    fetch(classRef: ClassReflectionLike, opt: AssignTupleOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
// endregion tuple

// region generics
export interface CastGenericsKindLike {
    addIndex(fieldRef: PropertyReflectionLike, opt: GenericsIndexOpt): void;

    processIndex(fieldRef: PropertyReflectionLike): void;

    fetch(classRef: ClassReflectionLike, opt: AssignGenericsOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
export type CastGenericsLambda<T = any> = (children: Array<CastClass>, value: unknown) => T;
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
// endregion generics

// region union
export interface CastUnionKindLike {
    fetch(classRef: ClassReflectionLike, opt: AssignUnionOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
export type CastUnionSerialized<T> = {
    [key in CastBasicType]?: T;
};

export type CastUnionSerializedMap = CastUnionSerialized<Map<CastPriorityLevel, Array<CastClass>>>;
export type CastPriorityLevel = 1 | 2 | 3 | 4 | 5 | 99; // min, high, mid, low, min, else

export interface CastPriority extends CastUnionSerialized<CastPriorityLevel> {
    instance?: Array<[ClassLike, CastPriorityLevel]>;
}

export interface CastUnionConfig extends CastUnionSerialized<[CastClass, CastPriorityLevel]> {
    exact: Array<[CastClass, CastIsLambda]>;

    instance: Array<[ClassLike, CastClass]>;
    discriminators: Array<[CastClass, AssignDtoOpt]>;
    tempLevels: CastUnionSerializedMap;
    newPriority: CastPriority;
    expectedTypes: Array<string>;
}
// endregion union

// region dto
export interface CastDtoKindLike {
    fetch(classRef: ClassReflectionLike, opt: AssignDtoOpt): void;

    process(classRef: ClassReflectionLike): void;

    onConstruct<T>(self: T, ...args: Arr): void;

    onCast<T>(clazz: ClassLike<T>, value: unknown): T;

    onCanBe<T>(clazz: ClassLike<T>, value: unknown): boolean;

    onExact<T>(clazz: ClassLike<T>, value: unknown): boolean;

    onDoc<T>(clazz: ClassLike<T>, openApi: CastDocCallback): CastDocResponse;

    onJson<T>(value: T, breakClass?: ClassLike): Dict;
}

export interface ToJsonLike {
    toJSON(): Dict;
}
// endregion dto

// region enum
export interface CastEnumKindLike {
    canBe(clazz: CastEnumName): boolean;

    build(clazz: CastEnumName): CastBase;
}
export type CastEnumName = string | ClassLike | EnumLiteral | EnumMap;
// endregion enum

// region group
export interface CastGroupKindLike {
    build(tokenized: CastTokenized): CastBase;
}
// endregion group

// region merge
export interface CastMergeKindLike {
    fetch(classRef: ClassReflectionLike, opt: AssignUnionOpt): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;
}
// endregion merge
