import {$is, $name, $repo, $to, KeyValue} from '@leyyo/common';
import { enumPool, Fqn, fqnHandler } from '@leyyo/core';
import {
    CastBase,
    CastClass,
    CastDocLambda,
    CastHubLike,
    CastIsLambda,
    CastLambda,
} from '../hub';
import { FQN } from '../internal';
import {CastEnumKindLike, CastEnumName, CastPriority} from './index.types';
import {CastTokenized} from "../process";

@Fqn(FQN)
export class CastEnumKind implements CastEnumKindLike {
    // region properties
    private readonly _cache: Map<Array<KeyValue>, CastBase> = $repo.newMap(FQN, 'enumCache');
    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region private
    private _buildCastLambda(items: Array<KeyValue>): CastLambda {
        return (value) => $to.literal(value, items);
    }

    private _buildCanBeLambda(items: Array<KeyValue>): CastIsLambda {
        return (value) => $is.literal(value, items);
    }

    private _buildExactLambda(items: Array<KeyValue>): CastIsLambda {
        return (value) => items.includes(value as KeyValue);
    }

    private _buildDocLambda(clazz: CastClass, items: Array<KeyValue>): CastDocLambda {
        return (openApi) => openApi(clazz, { enum: items });
    }
    // endregion private

    canBe(clazz: CastEnumName): boolean {
        const enumBase = enumPool.getBase(clazz, false);
        return !!enumBase;
    }

    build(given: CastEnumName): CastBase {
        const enumBase = enumPool.getBase(given, false);
        if (!enumBase) {
            return undefined;
        }

        const items = enumBase.value.items;
        if (this._cache.has(items)) {
            return this._cache.get(items);
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
        clazz.canBe = this._buildCanBeLambda(items);
        clazz.exact = this._buildExactLambda(items);
        clazz.doc = this._buildDocLambda(clazz, items);
        clazz.cast = this._buildCastLambda(items);

        const naming = fqnHandler.$secure.$get(enumBase);
        const tokenized = { kind: 'basic', main: enumBase.full } as CastTokenized;
        $name.set(clazz, enumBase.basic);
        fqnHandler.clazz(clazz, naming.pck);

        this.hub.depot.appendPointer(given, clazz);
        enumBase.pointers.forEach((p) => this.hub.depot.appendPointer(given, p));

        const bbb = this.hub.check.save(clazz, { tokenized, aliases: enumBase.aliases, naming });
        bbb.value.push('from-enum');

        this._cache.set(items, bbb);
        return bbb;
    }
}
