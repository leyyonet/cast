// noinspection JSUnusedGlobalSymbols
import {
    ClassLike, DeveloperException,
    F_FIELD,
    Key,
    leyyo,
    MultipleException,
    RecLike, TypeOpt
} from "@leyyo/core";
import {fqn, Fqn} from "@leyyo/fqn";
import {M} from "@leyyo/reflection";
import {CastApiDocResponse} from "./index-types";
import {FQN_NAME} from "./internal-component";
import {AssignCast} from "./index-annotations";

@AssignCast()
@Fqn(...FQN_NAME)
export class AbstractMap<K extends Key = string, V = unknown> extends Map<K, V> {
    constructor(value?: unknown) {
        super();
        if (leyyo.is.object(value, true)) {
            const cloned = (value instanceof Map) ? {...(Object.fromEntries(value as Map<unknown, unknown>))} : {...(value as RecLike)};
            const errors = [] as Array<Error>;
            Object.keys(cloned).forEach((key) => {
                try {
                    this.set(key as K, (cloned[key] !== undefined) ? cloned[key] : null);
                } catch (e) {
                    const err = leyyo.exception.build(e);
                    err.params[F_FIELD] = key;
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

    @M()
    protected _castItem(item?: V|unknown): V {
        throw new DeveloperException('cast.notImplemented-item', {clazz: fqn.name(this)});
    }
    @M()
    static docCast(target: unknown, propertyKey: PropertyKey, openApi: RecLike, opt?: TypeOpt): CastApiDocResponse {
        return undefined;
    }
    @M()
    protected static ly_inner<T extends RecLike>(clazz: ClassLike, value: unknown, opt?: TypeOpt): T {
        if (leyyo.is.empty(value)) {
            return null;
        }
        return ((leyyo.is.object(value) && value instanceof clazz) ? value : new clazz(value)) as unknown as T;
    }
    @M()
    static cast(value: unknown, opt?: TypeOpt): unknown {
        return this.ly_inner(this, value, opt);
    }

    set(key: K, value: V|unknown): this {
        return super.set(key, this._castItem(value));
    }
}