import { $is, $repo, $to, KeyValue } from '@leyyo/common';
import { enumPool, Fqn, fqnHandler, nameHandler } from '@leyyo/core';
import { CastEnumLike, CastEnumName } from './index.types';
import { CastBase, CastDocLambda, CastIsLambda, CastLambda, CastPoolLike } from '../pool';
import { CastClass, CastPriority } from '../basic';
import { FQN } from '../internal';
import { CastTokenized } from '../tokenizer';

@Fqn(FQN)
export class CastEnum implements CastEnumLike {
    private readonly cache: Map<Array<KeyValue>, CastBase>;

    constructor(protected pool: CastPoolLike) {
        this.cache = $repo.newMap(FQN, 'enumCache');
    }

    canBe(clazz: CastEnumName): boolean {
        const enumBase = enumPool.getBase(clazz, false);
        return !!enumBase;
    }

    private buildCastLambda(items: Array<KeyValue>): CastLambda {
        return (value) => $to.literal(value, items);
    }

    private buildIsLambda(items: Array<KeyValue>): CastIsLambda {
        return (value) => $is.literal(value, items);
    }

    private buildDocLambda(clazz: CastClass, items: Array<KeyValue>): CastDocLambda {
        return (openApi) => openApi(clazz, { enum: items });
    }

    build(given: CastEnumName): CastBase {
        const enumBase = enumPool.getBase(given, false);
        if (!enumBase) {
            return undefined;
        }

        const items = enumBase.value.items;
        const priority = {} as CastPriority;
        items.forEach((item) => {
            switch (typeof item) {
                case 'string':
                    priority.string = 1;
                    break;
                case 'number':
                    priority.number = 1;
                    break;
            }
        });
        if (this.cache.has(items)) {
            return this.cache.get(items);
        }
        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        const clazz = class {} as CastClass;
        clazz.priority = priority;
        clazz.cast = this.buildCastLambda(items);
        clazz.is = this.buildIsLambda(items);
        clazz.doc = this.buildDocLambda(clazz, items);

        const naming = fqnHandler.$secure.$get(enumBase);
        const tokenized = { kind: 'basic', base: enumBase.full } as CastTokenized;
        nameHandler.set(clazz, enumBase.basic);
        fqnHandler.clazz(clazz, naming.pck);

        this.pool.depot.appendPointer(given, clazz);
        enumBase.pointers.forEach((p) => this.pool.depot.appendPointer(given, p));

        const base = this.pool.fetch.save(clazz, { tokenized, aliases: enumBase.aliases, naming });
        base.value.tags.push('from-enum');

        this.cache.set(items, base);
        return base;
    }
}
