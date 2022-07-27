import {FuncLike, leyyo, TypeOpt} from "@leyyo/core";
import {fqn} from "@leyyo/fqn";
import {reflectPool} from "@leyyo/reflection";
import {CastLike, CastName} from "./index-types";
import {CAST_KEY, FQN_NAME} from "./internal-component";
import {castPool} from "./cast-pool";

// region Cast
export function Cast(clazz: CastName, opt?: TypeOpt): PropertyDecorator {
    return (target, property: string) => {
        castPool.ly_find({clazz, target, property, opt});
    };
}
fqn.func(Cast, ...FQN_NAME);
const castId = reflectPool.identify(Cast, {field: true, notMultiple: true})
castPool.ly_initCast(castId);
// endregion Cast
// region Cast2
export function Cast2(type: CastName): PropertyDecorator {
    return function(target: Object, propertyKey: string) {
        const getter = function() {
            const rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            if (rec.value) {
                return rec.value[propertyKey];
            }
            return undefined;
        };
        const setter = function(newVal: string) {
            let rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            if (!rec.value) {
                Object.defineProperty(this, CAST_KEY, {
                    enumerable: false,
                    configurable: false,
                    value: {},
                });
                rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            }
            rec.value[propertyKey] = leyyo.primitive.text(newVal);
        };
        Object.defineProperty(target, propertyKey, {
            configurable: true,
            enumerable: true,
            get: getter,
            set: setter
        });
        cast2Id.fork(target, propertyKey).set({type});
    }
}
const cast2Id = reflectPool.identify(Cast2, {field: true, notMultiple: true})
// endregion Cast2
// region AssignCast
export function AssignCast(...aliases: Array<string>): ClassDecorator {
    aliases = leyyo.primitive.array(aliases) ?? [];
    return function (target) {
        fqn.refresh(target);
        const like = target as unknown as CastLike;
        if (castPool.ly_checkClass(like, true) === 'self') {
            castPool.add(like, ...aliases);
        } else { // prototype
            castPool.add((target as FuncLike).prototype as CastLike, ...aliases);
        }
        assignCastId.fork(target).set({aliases});
    }
}
fqn.func(AssignCast, ...FQN_NAME);
const assignCastId = reflectPool.identify(AssignCast, {clazz: true, notMultiple: true});
// endregion AssignCast
