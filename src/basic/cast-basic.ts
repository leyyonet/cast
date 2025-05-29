import { Fqn } from '@leyyo/core';
import { FQN } from '../internal';
import { CastBasicLike } from './index.types';
import { CastBase, CastPoolLike } from '../pool';
import { CastTokenized } from '../tokenizer'; // noinspection Annotator

// noinspection Annotator
@Fqn(FQN)
export class CastBasic implements CastBasicLike {
    constructor(protected pool: CastPoolLike) {}

    build(tokenized: CastTokenized): CastBase {
        if (!tokenized.base) {
            return undefined;
        }
        if (this.pool.depot.has(tokenized.base)) {
            return this.pool.depot.get(tokenized.base);
        }
        if (this.pool.enum.canBe(tokenized.base)) {
            return this.pool.enum.build(tokenized.base);
        }
        if (!this.pool.pending.has(tokenized)) {
            this.pool.pending.queue(tokenized, (t) => this.build(t));
        }
        return undefined;
    }
}

// Array<Customer>
