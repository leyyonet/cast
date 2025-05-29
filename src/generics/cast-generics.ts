import { Fqn, fqnHandler, nameHandler, reflectionPool } from '@leyyo/core';
import { FQN } from '../internal';
import { CastGenericsLike } from './index.types';
import { CastBase, CastDocCallback, CastDocResponse, CastPoolLike } from '../pool';
import { CastClass } from '../basic';
import { CastTokenized } from '../tokenizer';

@Fqn(FQN)
export class CastGenerics implements CastGenericsLike {
    // region properties
    private counter: number = 0;

    // endregion properties

    constructor(protected pool: CastPoolLike) {}

    // region custom

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        let base = this.pool.depot.get(encoded);
        if (base) {
            return base;
        }
        if (!this.pool.depot.has(tokenized.base)) {
            if (!this.pool.pending.has(tokenized)) {
                this.pool.pending.queue(tokenized, (t) => this.build(t));
            }
            return undefined;
        }
        // todo if child is absent
        const children = tokenized.children.map((child) => this.pool.discover.build(child)).map((c) => c.value.clazz);

        const mainBase = this.pool.depot.get(tokenized.base);
        const mainClass = mainBase.value.clazz;

        const clazz = class extends mainClass {
            static priority = mainClass.priority;
            static tokenized = tokenized;

            static cast(value: unknown): unknown {
                return mainClass.castGen(children, value);
            }

            static is(value: unknown) {
                return mainClass.is(value);
            }

            static doc(openApi: CastDocCallback): CastDocResponse {
                return mainClass.docGen(children, openApi);
            }
        } as CastClass;
        const name = nameHandler.anonymous(mainClass.name, this.counter);
        nameHandler.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);
        reflectionPool.registerClass(clazz);
        this.counter++;

        base = this.pool.fetch.save(clazz, { tokenized });
        this.pool.pending.complete(tokenized);

        return base;
    }

    // endregion custom
}

// Array<Customer>
