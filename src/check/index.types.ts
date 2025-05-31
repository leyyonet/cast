import {Func} from "@leyyo/common";
import {ClassReflectionLike, FqnNaming} from '@leyyo/core';

import { CastAnalyseType, CastBase, CastClass, CastTokenized } from '../shared';

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
