import { DevCallback, Func } from '@leyyo/common';
import { ClassReflectionLike, DecoInstanceLike, FqnNaming, PropertyReflectionLike } from '@leyyo/core';
import { CastOpt } from '../decorators';
import { CastBase, CastClass, CastKind, CastName, CastNamePlain } from '../hub';

// region check
export interface CastCheckLike {
    save(clazz: CastClass, opt: CastSaveOpt): CastBase;

    notDecoratedBy(classRef: ClassReflectionLike, ...functions: Array<Func>): void;

    getOrCreate(clazz: CastClass, tokenized?: CastTokenized): CastBase;

    checkDuplicated(clazz: CastClass, encoded?: string): void;

    analyse(pointer: CastClass): CastAnalyseType;
}
export interface CastSaveOpt {
    tokenized: CastTokenized;
    aliases?: Array<string>;
    naming?: FqnNaming;
}
export type CastAnalyseType = 'basic' | 'generics';
// endregion check

// region discover
export interface CastDiscoverLike {
    find(clazz: CastName, required?: DevCallback | true): CastClass;

    run(clazz: CastName, value: unknown): unknown;

    build(tokenized: CastTokenized): CastBase;
}
// endregion discover

// region fetch
export interface CastFetchLike {
    initialize(): void;

    process(): void;
}
// endregion fetch

// region pending
export interface CastPendingLike {
    addSystem(clazz: CastClass): void;

    addClone(clazz: CastClass, cloned: Func): void;

    processSystem(): void;

    processClone(): void;

    queue(tokenized: CastTokenized, fn: CastPendingLambda): void;

    complete(tokenized: CastTokenized): void;

    has(tokenized: CastTokenized): boolean;

    list(): Array<CastTokenized>;
}
export type CastPendingLambda = (tokenized: CastTokenized) => CastBase;
// endregion pending

// region refactor
export interface CastRefactorLike {
    property(ins: DecoInstanceLike, opt: CastOpt): void;

    parameter(ins: DecoInstanceLike, opt: CastOpt): void;

    hasMethod(ref: PropertyReflectionLike): boolean;

    runForMethod(ref: PropertyReflectionLike, values: Array<any>): Array<any>;
}
// endregion refactor

// region tokenizer
export interface CastTokenizerLike {
    equals(left: CastTokenized, right: CastTokenized): boolean;
    tokenize(text: string): CastTokenized;

    className(clazz: CastNamePlain): string;

    parse(clazz: CastNamePlain, check?: boolean): CastTokenized;

    stringify(tokenized: CastTokenized): string;
    sanitize(tokenized: CastTokenized): CastTokenized;
}
export type CastTokenType =
    | 'comma'
    | 'pipe'
    | 'and'
    | 'value'
    | 'generics-begin'
    | 'generics-end'
    | 'tuple-begin'
    | 'tuple-end'
    | 'group-begin'
    | 'group-end'
    | 'ignore';

export interface CastToken {
    type: CastTokenType;
    value?: string;
}

export interface CastTokenized {
    clazz?: CastClass;
    parent?: CastTokenized;
    main?: string;
    kind?: CastKind;
    children?: Array<CastTokenized>;
}

// endregion tokenizer
