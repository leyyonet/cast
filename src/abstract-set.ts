// noinspection JSUnusedGlobalSymbols
import {
    ArraySome,
    ClassLike,
    DeveloperException,
    F_FIELD,
    leyyo,
    MultipleException,
    RecLike,
    TypeOpt
} from "@leyyo/core";
import {fqn, Fqn} from "@leyyo/fqn";
import {CastApiDocResponse} from "./index-types";
import {M} from "@leyyo/reflection";
import {FQN_NAME} from "./internal-component";
import {AssignCast} from "./index-annotations";

@AssignCast()
@Fqn(...FQN_NAME)
export class AbstractSet<V = unknown> extends Set<V> {
    constructor(value?: unknown) {
        super();
        let cloned = [];
        if (leyyo.is.object(value) && (value instanceof Set)) {
            cloned = Array.from(value as Set<unknown>);
        } else if (leyyo.is.array(value)) {
            cloned = value as ArraySome;
        }
        const errors = [] as Array<Error>;
        cloned.forEach((item, index) => {
            try {
                this.add(item as V);
            } catch (e) {
                const err = leyyo.exception.build(e);
                err.params[F_FIELD] = `#${index}`;
                errors.push(err);
            }
        })
        if (errors.length > 0) {
            if (errors.length === 1) {
                throw errors[0];
            }
            const multipleException = new MultipleException();
            multipleException.push(...errors);
        }
    }
    @M()
    protected _castItem(item?: V|unknown): V {
        throw new DeveloperException('cast.notImplemented-item', {clazz: fqn.name(this)});
    }
    @M()
    protected _equals(item: V): boolean {
        return super.has(item);
    }
    @M()
    has(item: V): boolean {
        return this._equals(item);
    }
    @M()
    add(value: V|unknown): this {
        return super.add(this._castItem(value));
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
}