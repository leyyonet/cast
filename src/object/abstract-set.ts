import { $err, $is, Arr, ClassLike, DeveloperException, Dict, MultipleException } from '@leyyo/common';
import { Fqn, fqnHandler } from '@leyyo/core';

import { CastDocCallback, CastDocResponse } from '../shared';
import { FQN } from '../internal';

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@Fqn(FQN)
export class AbstractSet<V = unknown> extends Set<V> {
    constructor(value?: unknown) {
        super();
        let cloned = [];
        if ($is.object(value) && value instanceof Set) {
            cloned = Array.from(value as Set<unknown>);
        } else if (Array.isArray(value)) {
            cloned = value as Arr;
        }
        const errors = [] as Array<Error>;
        cloned.forEach((item, index) => {
            try {
                this.add(item as V);
            } catch (e) {
                const err = $err.build(e);
                err.params['field'] = `#${index}`;
                errors.push(err);
            }
        });
        if (errors.length > 0) {
            if (errors.length === 1) {
                throw errors[0];
            }
            const multipleException = new MultipleException();
            multipleException.push(...errors);
        }
    }

    protected _castItem(item?: V | unknown): V {
        throw new DeveloperException({ issue: 'cast.notImplemented-item', clazz: fqnHandler.get(this) });
    }

    protected _equals(item: V): boolean {
        return super.has(item);
    }

    has(item: V): boolean {
        return this._equals(item);
    }

    add(value: V | unknown): this {
        return super.add(this._castItem(value));
    }

    static doc(openApi: CastDocCallback): CastDocResponse {
        return undefined;
    }

    protected static ly_inner<T extends Dict>(clazz: ClassLike, value: unknown): T {
        if ($is.empty(value)) {
            return null;
        }
        return ($is.object(value) && value instanceof clazz ? value : new clazz(value)) as unknown as T;
    }

    static cast(value: unknown): unknown {
        return this.ly_inner(this, value);
    }
}
