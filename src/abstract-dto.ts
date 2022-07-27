// noinspection TypeScriptAbstractClassConstructorCanBeMadeProtected,JSUnusedGlobalSymbols
import {ClassLike, F_FIELD, leyyo, MultipleException, RecLike, TypeOpt} from "@leyyo/core";
import {fqn, Fqn} from "@leyyo/fqn";
import {M, reflectPool} from "@leyyo/reflection";
import {CastApiDocResponse} from "./index-types";
import {CAST_KEY, FQN_NAME} from "./internal-component";
import {AssignCast} from "./index-annotations";

@AssignCast()
@Fqn(...FQN_NAME)
export class AbstractDto implements RecLike {
    [key: string]: unknown;

    constructor(value?: unknown) {
        Object.defineProperty(this, CAST_KEY, {
            enumerable: false,
            configurable: false,
            value: {},
        });
        const keys: Array<string> = [];
        const errors = [] as Array<Error>;
        if (leyyo.is.object(value, true)) {
            // console.log('constructor ' + Object.getPrototypeOf(this).constructor.name, value);
            const entries = (value instanceof Map) ? Object.fromEntries(value as Map<unknown, unknown>) : Object.entries(value);
            for (const [k, v] of entries) {
                if (typeof k !== 'symbol') {
                    try {
                        this[k] = v;
                    } catch (e) {
                        const err = leyyo.exception.build(e);
                        err.params[F_FIELD] = k;
                        errors.push(err);
                    }
                    keys.push(k);
                }
            }
        }
        try {
            reflectPool
                .getClass(this.constructor)
                .listInstancePropertyNames({kind:"field"})
                .filter(k => !keys.includes(k))
                .forEach(k => {
                try {
                    this[k] = undefined;
                } catch (e) {
                    leyyo.LOG.native(e, 'cast.default.property', {clazz: fqn.name(this.constructor), property: k});
                }
            });
        } catch (e) {
        }

        if (errors.length > 0) {
            if (errors.length === 1) {
                throw errors[0];
            }
            const multipleException = new MultipleException();
            multipleException.push(...errors);
            throw multipleException;
        }
    }
    @M()
    static docCast(target: unknown, propertyKey: PropertyKey, openApi: RecLike, opt?: TypeOpt): CastApiDocResponse {
        return {type: 'string'};
    }

    @M()
    static cast(value: unknown, opt?: TypeOpt): unknown {
        return this.ly_inner(this, value, opt);
    }
    @M()
    protected static ly_inner<T extends RecLike>(clazz: ClassLike, value: unknown, opt?: TypeOpt): T {
        if (leyyo.is.empty(value)) {
            return null;
        }
        return ((leyyo.is.object(value) && value instanceof clazz) ? value : new clazz(value)) as unknown as T;
    }

    toJSON(): RecLike {
        const result = {};
        const keys: Array<string> = [];
        for (const [k, v] of Object.entries(this)) {
            if (typeof k !== 'symbol') {
                result[k] = (typeof (v as {toJSON: () => void})?.toJSON === 'function') ? (v as {toJSON: () => void}).toJSON() : v;
                keys.push(k);
            }
        }

        let parent = this;
        while (parent) {
            if (parent?.constructor === AbstractDto) {
                break;
            }
            const rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            if (leyyo.is.object(rec?.value)) {
                for (const [k, v] of Object.entries(rec?.value)) {
                    if (typeof k !== 'symbol' && !keys.includes(k)) {
                        result[k] = (typeof (v as {toJSON: () => void})?.toJSON === 'function') ? (v as {toJSON: () => void}).toJSON() : v;
                        keys.push(k);
                    }
                }
            }
            parent = Object.getPrototypeOf(parent);
        }
        return result as RecLike;
    }
}
/*
* function AssignCtor<T extends object>() {
    return class {
        constructor(t: T) {
            Object.assign(this, t)
        }
    } as { new(t: T): T }
}

interface CommunityProps {
    prop1: string
    prop2: number
    prop3: boolean
}
class Community extends AssignCtor<CommunityProps>() {

}

const comm = new Community({ prop1: "", prop2: 1, prop3: true });
console.log(comm.prop2.toFixed(1)) // 1.0
*
* */