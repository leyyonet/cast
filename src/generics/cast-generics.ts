import { Fqn, fqnHandler, nameHandler } from '@leyyo/core';
import { $log, Dict } from '@leyyo/common';
import { FQN } from '../internal';
import { CastGenericsLike } from './index.types';
import { CastApiDocResponse, CastPoolLike } from '../pool';
import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

@Fqn(FQN)
export class CastGenerics implements CastGenericsLike {
    // region properties
    private readonly logger = $log.create(CastGenerics);

    // endregion properties

    constructor(protected pool: CastPoolLike) {}

    // region custom

    buildPointer(tokenized: CastTokenized): CastPointer {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        const base = this.pool.depot.get(encoded);
        if (base) {
            return base.value;
        }
        const children = tokenized.children.map((child) => this.pool.discover.buildPointer(child));
        if (this.pool.depot.has(tokenized.base)) {
            const base = this.pool.depot.get(tokenized.base);
            const pointerBase = base.value;

            const clz = class AbstractGenerics {
                static priority = pointerBase.priority;
                static tokenized = tokenized;

                static cast(value: unknown): unknown {
                    return pointerBase.castGen(children, value);
                }

                static is(value: unknown) {
                    return pointerBase.is(value);
                }

                static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
                    return pointerBase.docGen(children, target, propertyKey, openApi);
                }
            } as CastPointer;

            nameHandler.set(clz, encoded);
            fqnHandler.$secure.$setName(clz, encoded);

            this.pool.depot.add(clz);
            return clz;
        }
        return undefined;
    }

    // endregion custom
}

// Array<Customer>
