import { Arr, ClassLike, Dict } from '@leyyo/common';
import { ClassReflectionLike } from '@leyyo/core';

import { CastDocCallback, CastDocResponse, CastTag } from '../shared';
import { AssignDtoOpt } from '../decorators';

export interface CastDtoLike {
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
export type CastDtoHierarchy = [ClassReflectionLike, number];
