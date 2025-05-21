import {$is, $log, $repo, $to, ClassLike, Dict, KeyValue} from '@leyyo/common';
import {enumPool, footprint, Fqn, fqnHandler, NamedDepotName, nameHandler} from '@leyyo/core';
import {CastEnumLike, CastEnumName} from './index.types';
import { CastApiDocResponse, CastPoolLike } from '../pool';
import { CastPointer } from '../basic';
import {FQN} from "../internal";

@Fqn(FQN)
export class CastEnum implements CastEnumLike {
    private readonly logger = $log.create(CastEnum);
    private counter = 0;
    private readonly cache: Map<Array<KeyValue>, CastPointer>;

    constructor(protected pool: CastPoolLike) {
        this.cache = $repo.newMap(FQN, 'enumCache');
    }

    protected _build(value: NamedDepotName): CastPointer {
        const enumBase = enumPool.getBase(value, false);
        if (!enumBase) {
            return undefined;
        }

        const items = enumBase.value.items;
        if (this.cache.has(items)) {
            return this.cache.get(items);
        }
        // noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
        const clz = class {
            static cast(value: unknown): unknown {
                return $to.literal(value, items);
            }

            static is(value: unknown) {
                return $is.literal(value, items);
            }

            static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
                return {};
            }
        } as CastPointer;

        const pck = fqnHandler.$secure.$getPackage(enumBase) ?? FQN;
        const name = nameHandler.anonymous('Enum', this.counter);
        nameHandler.set(clz as unknown as ClassLike, name);
        fqnHandler.$secure.$setName(clz, pck);
        footprint.inspect(clz);

        this.pool.depot.appendPointer(value, value);
        enumBase.pointers.forEach((p) => this.pool.depot.appendPointer(value, p));
        this.pool.depot.add(clz, ...enumBase.aliases);
        this.cache.set(items, clz);
        return clz;
    }
    canBe(clazz: CastEnumName): boolean {
        const enumBase = enumPool.getBase(clazz, false);
        return !!enumBase;
    }
    buildPointer(clazz: CastEnumName): CastPointer {
        return this._build(clazz);
    }
}
