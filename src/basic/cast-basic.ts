import { Fqn } from '@leyyo/core';
import { $log } from '@leyyo/common';
import { FQN } from '../internal';
import { CastBasicLike, CastPointer } from './index.types';
import { CastPoolLike } from '../pool';
import { CastTokenized } from '../tokenizer'; // noinspection Annotator

// noinspection Annotator
@Fqn(FQN)
export class CastBasic implements CastBasicLike {
    private readonly logger = $log.create(CastBasic);

    constructor(protected pool: CastPoolLike) {}

    buildPointer(tokenized: CastTokenized): CastPointer {
        if (this.pool.depot.has(tokenized.base)) {
            return this.pool.depot.get(tokenized.base).value;
        }
        if (this.pool.enum.canBe(tokenized.base)) {
            return this.pool.enum.buildPointer(tokenized.base);
        }
        return undefined;
    }
}

// Array<Customer>
