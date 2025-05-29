import { Arr, ClassLike, Dict } from '@leyyo/common';
import { FqnNaming } from '@leyyo/core';

import { CastDocCallback, CastDocResponse } from '../pool';
import { CastClass } from '../basic';

export interface DtoHelperLike {
    onConstruct<T>(self: T, ...args: Arr): void;

    changeNaming(clazz: CastClass, naming: FqnNaming): void;

    changeNaming(clazz: CastClass, name: string): void;

    checkClass(clazz: CastClass): void;

    buildClass(original?: ClassLike): CastClass;

    onCast<T>(clazz: ClassLike<T>, value: unknown): T;

    onIs<T>(clazz: ClassLike<T>, value: unknown): boolean;

    onDoc<T>(clazz: ClassLike<T>, openApi: CastDocCallback): CastDocResponse;

    toJson<T>(value: T, breakClass?: ClassLike): Dict;
}

export interface ToJsonLike {
    toJSON(): Dict;
}
