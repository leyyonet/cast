import { $err, $is, ClassLike, DeveloperException, Dict, MultipleException } from '@leyyo/common';
import { AssignType } from '../decorators';
import { Fqn, fqnHandler } from '@leyyo/core';
import { FQN } from '../internal';
import { CastApiDocResponse } from '../pool';

// noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
@AssignType()
@Fqn(FQN)
export class AbstractMap<K = string, V = unknown> extends Map<K, V> {
    constructor(value?: unknown) {
        super();
        if ($is.object(value)) {
            const cloned =
                value instanceof Map
                    ? { ...Object.fromEntries(value as Map<unknown, unknown>) }
                    : { ...(value as Dict) };
            const errors = [] as Array<Error>;
            Object.keys(cloned).forEach((key) => {
                try {
                    this.set(key as K, cloned[key] !== undefined ? cloned[key] : null);
                } catch (e) {
                    const err = $err.build(e);
                    err.params['field'] = key;
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
    }

    protected _castItem(item?: V | unknown): V {
        throw new DeveloperException({ issue: 'cast.notImplemented-item', clazz: fqnHandler.get(this) });
    }

    static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
        return undefined;
    }

    protected static ly_inner<T>(clazz: ClassLike, value: unknown): T {
        if ($is.empty(value)) {
            return value as undefined;
        }
        return ($is.object(value) && value instanceof clazz ? value : new clazz(value)) as unknown as T;
    }

    static cast(value: unknown): unknown {
        return this.ly_inner(this, value);
    }

    set(key: K, value: V | unknown): this {
        return super.set(key, this._castItem(value));
    }
}
