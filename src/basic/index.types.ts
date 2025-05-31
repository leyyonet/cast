import { CastBase, CastTag, CastTokenized } from '../shared';
import { ClassLike, Func } from '@leyyo/common';
import { CastAliasOpt } from '../decorators';
import { ClassReflectionLike } from '@leyyo/core';

export interface CastBasicLike {
    addNative(fn: Func): void;
    fetch(classRef: ClassReflectionLike): void;

    process(classRef: ClassReflectionLike): void;

    build(tokenized: CastTokenized): CastBase;

    fetchAlias(fn: Func | ClassLike, opt: CastAliasOpt): void;

    fetchAlias(classRef: ClassReflectionLike, opt: CastAliasOpt): void;
}
