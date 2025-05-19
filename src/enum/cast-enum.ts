import {$is, $log, $to, Arr, ClassLike, Dict} from '@leyyo/common';
import {enumPool, footprint, fqnHandler, NamedDepotName, nameHandler} from '@leyyo/core';
import {CastEnumLike, CastEnumName} from './index.types';
import { CastApiDocResponse, CastPoolLike } from '../pool';
import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

export class CastEnum implements CastEnumLike {
    private readonly logger = $log.create(CastEnum);

    constructor(protected pool: CastPoolLike) {}

    protected _checkPossibleEnum(value: NamedDepotName): boolean {
        const enumBase = enumPool.getBase(value, false);
        if (!enumBase) {
            return false;
        }

        const items = enumBase.value.items;
        const clz = class AbstractEnum {
            static cast(value: unknown): unknown {
                if ($is.empty(value)) {
                    return null;
                }
                const str = $to.text(value);
                if (items.includes(str)) {
                    return str;
                }
                const num = $to.float(value, { silent: true });
                if (items.includes(num)) {
                    return num;
                }
                throw new Error('Invalid enum');
            }

            static is(value: unknown) {
                if ($is.empty(value)) {
                    return null;
                }
                return (
                    items.includes($to.text(value, { silent: true })),
                        items.includes($to.float(value, { silent: true }))
                );
            }

            static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
                return {};
            }
        } as unknown as CastPointer;

        const naming = fqnHandler.toFullName(enumBase.full ?? enumBase.basic);

        nameHandler.set(clz as unknown as ClassLike, naming.basic);
        fqnHandler.$secure.$setName(clz, naming.full);
        footprint.inspect(clz);
        this.pool.depot.appendPointer(value, value);
        enumBase.pointers.forEach((p) => this.pool.depot.appendPointer(value, p));
        this.pool.depot.add(clz as CastPointer, ...enumBase.aliases);
        return true;
    }
    canBe(clazz: CastEnumName): boolean {
        const enumBase = enumPool.getBase(clazz, false);
        return !!enumBase;
    }
    buildPointer(clazz: CastEnumName): CastPointer {
        return undefined;
    }
}
