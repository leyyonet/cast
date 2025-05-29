import { Fqn } from '@leyyo/core';
import { $assert, $dev, $log, $repo } from '@leyyo/common';
import { FQN } from '../internal';
import { CastPendingLambda, CastPendingLike } from './index.types';
import { CastPoolLike } from '../pool';
import { CastTokenized } from '../tokenizer'; // noinspection Annotator

// noinspection Annotator
@Fqn(FQN)
export class CastPending implements CastPendingLike {
    protected items = $repo.newMap<string, Map<CastTokenized, CastPendingLambda>>(FQN, 'pending');
    protected logger = $log.create(CastPending);

    constructor(protected pool: CastPoolLike) {}

    queue(tokenized: CastTokenized, fn: CastPendingLambda): void {
        $assert.bareObject(tokenized, () =>
            $dev.opt({
                field: 'tokenized',
                method: 'queue',
                where: 'leyyo.cast.CastPending',
            }),
        );
        $assert.func(fn, () => $dev.opt({ field: 'fn', method: 'queue', where: 'leyyo.cast.CastPending' }));
        if (!this.items.has(tokenized.base)) {
            this.items.set(tokenized.base, new Map());
        }
        if (!this.items.get(tokenized.base).has(tokenized)) {
            this.items.get(tokenized.base).set(tokenized, fn);
            const encoded = this.pool.tokenizer.stringify(tokenized);
            this.logger.debug(`${encoded} is queued`);
        }
    }

    complete(tokenized: CastTokenized): void {
        if (this.has(tokenized)) {
            this.items.get(tokenized.base).get(tokenized)(tokenized);
            this.items.get(tokenized.base).delete(tokenized);
            if (this.items.get(tokenized.base).size < 1) {
                this.items.delete(tokenized.base);
            }
        } else if (tokenized.base && this.items.has(tokenized.base)) {
            this.items.get(tokenized.base).forEach((fn, t) => {
                fn(t);
            });
        }
    }

    has(tokenized: CastTokenized): boolean {
        return tokenized && this.items.has(tokenized.base) && this.items.get(tokenized.base).has(tokenized);
    }

    list(): Array<CastTokenized> {
        const result = [] as Array<CastTokenized>;
        Array.from(this.items.values()).forEach((tokens) => {
            result.push(...Array.from(tokens.keys()));
        });
        return result;
    }
}

// Array<Customer>
