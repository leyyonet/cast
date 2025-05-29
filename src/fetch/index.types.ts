import { ClassLike, Func } from '@leyyo/common';
import { FqnNaming } from '@leyyo/core';

import { CastClass } from '../basic';
import { CastAnalyseType, CastBase } from '../pool';
import { CastTokenized } from '../tokenizer';

export interface CastFetchLike {
    initialize(): void;

    process(): void;

    copy(source: CastClass, target: Func | ClassLike): void;

    analyse(pointer: CastClass): CastAnalyseType;

    save(clazz: CastClass, opt: CastFetchSave): CastBase;
}

export interface CastFetchSave {
    tokenized: CastTokenized;
    aliases?: Array<string>;
    naming?: FqnNaming;
}
