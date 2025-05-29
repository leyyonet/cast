import { $dev, $is, $log, Arr } from '@leyyo/common';
import { fqnHandler, nameHandler, reflectionPool } from '@leyyo/core';
import { CastTupleLike } from './index.types';
import { CastBase, CastDocLambda, CastIsLambda, CastLambda, CastPoolLike } from '../pool';
import { CastClass } from '../basic';
import { CastTokenized } from '../tokenizer';
import { FQN } from '../internal';

export class CastTuple implements CastTupleLike {
    private readonly logger = $log.create(CastTuple);
    private counter: number = 0;

    constructor(protected pool: CastPoolLike) {}

    private buildCastLambda(classes: Array<CastClass>, types: Array<string>): CastLambda {
        return (value) => {
            if ($is.empty(value)) {
                return value;
            }
            if (!$is.arrayLike(value)) {
                throw $dev.invalidError({
                    message: 'Unexpected tuple value',
                    type: typeof value,
                    expected: `[${types.join(',')}]`,
                });
            }
            let arr: Arr;
            if (value instanceof Set) {
                arr = Array.from(value.values());
            } else {
                arr = value as Arr;
            }
            return classes.map((clazz, index) => clazz.cast(arr[index]));
        };
    }

    private buildIsLambda(classes: Array<CastClass>): CastIsLambda {
        return (value) => {
            if ($is.empty(value)) {
                return false;
            }
            if (!$is.arrayLike(value)) {
                return false;
            }
            let arr: Arr;
            if (value instanceof Set) {
                arr = Array.from(value.values());
            } else {
                arr = value as Arr;
            }
            return classes.every((clazz, index) => clazz.is(arr[index]));
        };
    }

    private buildDocLambda(clazz: CastClass, classes: Array<CastClass>): CastDocLambda {
        return (openApi) => {
            return openApi(clazz, {
                type: 'array',
                prefixItems: classes.map((clz) => clz.doc(openApi)),
            });
        };
    }

    build(tokenized: CastTokenized): CastBase {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        let base = this.pool.depot.get(encoded);
        if (base) {
            return base;
        }
        const children = tokenized.children.map((child) => this.pool.discover.build(child));
        if (children.some((b) => !b)) {
            if (!this.pool.pending.has(tokenized)) {
                this.pool.pending.queue(tokenized, (t) => this.build(t));
            }
            return undefined;
        }
        const classes = children.map((child) => child.value.clazz);
        const types = classes.map((clazz) => fqnHandler.get(clazz));

        const clazz = class {} as CastClass;

        clazz.priority = { array: 1, instance: [[Set, 5]] };
        clazz.cast = this.buildCastLambda(classes, types);
        clazz.is = this.buildIsLambda(classes);
        clazz.doc = this.buildDocLambda(clazz, classes);

        const name = nameHandler.anonymous('Tuple', this.counter);
        nameHandler.set(clazz, name);
        fqnHandler.clazz(clazz, FQN);

        const ref = reflectionPool.registerClass(clazz);
        classes.forEach((cls) => {
            if (reflectionPool.isRegistered(cls)) {
                ref.copyDecorators(reflectionPool.get(cls), [cls]);
            }
        });
        this.counter++;

        base = this.pool.fetch.save(clazz, { tokenized });

        return base;
    }
}
