import { $is, $repo, $to, KeyValue } from '@leyyo/common';
import { enumPool, Fqn, fqnHandler, nameHandler } from '@leyyo/core';
import { CastEnumLike } from './index.types';
import { CastHubLike } from '../hub';
import {
    CastBase,
    CastClass,
    CastDocLambda,
    CastEnumName,
    CastIsLambda,
    CastLambda,
    CastPriority,
    CastTokenized,
} from '../shared';
import { FQN } from '../internal';

@Fqn(FQN)
export class CastEnum implements CastEnumLike {
    private readonly cache: Map<Array<KeyValue>, CastBase>;

    constructor(private hub: CastHubLike) {
        this.cache = $repo.newMap(FQN, 'enumCache');
    }

    canBe(clazz: CastEnumName): boolean {
        const enumBase = enumPool.getBase(clazz, false);
        return !!enumBase;
    }

    private buildCastLambda(items: Array<KeyValue>): CastLambda {
        return (value) => $to.literal(value, items);
    }

    private buildCanBeLambda(items: Array<KeyValue>): CastIsLambda {
        return (value) => $is.literal(value, items);
    }

    private buildExactLambda(items: Array<KeyValue>): CastIsLambda {
        return (value) => items.includes(value as KeyValue);
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
        if (this.cache.has(items)) {
            return this.cache.get(items);
        }
        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        const clazz = class {} as CastClass;
        clazz.priority = {} as CastPriority;
        items.forEach((item) => {
            switch (typeof item) {
                case 'string':
                    clazz.priority.string = 1;
                    break;
                case 'number':
                    clazz.priority.number = 1;
                    break;
            }
        });
        clazz.canBe = this.buildCanBeLambda(items);
        clazz.exact = this.buildExactLambda(items);
        clazz.doc = this.buildDocLambda(clazz, items);
        clazz.cast = this.buildCastLambda(items);

        const naming = fqnHandler.$secure.$get(enumBase);
        const tokenized = { kind: 'basic', base: enumBase.full } as CastTokenized;
        nameHandler.set(clazz, enumBase.basic);
        fqnHandler.clazz(clazz, naming.pck);

        this.hub.depot.appendPointer(given, clazz);
        enumBase.pointers.forEach((p) => this.hub.depot.appendPointer(given, p));

        const base = this.hub.check.save(clazz, { tokenized, aliases: enumBase.aliases, naming });
        base.value.push('from-enum');

        this.cache.set(items, base);
        return base;
    }
}
