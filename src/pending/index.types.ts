import { Func } from '@leyyo/common';

import { CastBase, CastClass, CastTokenized } from '../shared';

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
