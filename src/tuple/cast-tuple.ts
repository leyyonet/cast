import { $log, Arr, Dict } from '@leyyo/common';
import { fqnHandler, nameHandler } from '@leyyo/core';
import { CastTupleLike } from './index.types';
import { CastApiDocResponse, CastPoolLike } from '../pool';
import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

export class CastTuple implements CastTupleLike {
    private readonly logger = $log.create(CastTuple);

    constructor(protected pool: CastPoolLike) {}

    buildPointer(tokenized: CastTokenized): CastPointer {
        const encoded = this.pool.tokenizer.stringify(tokenized);
        const base = this.pool.depot.get(encoded);
        if (base) {
            return base.value;
        }
        const pointers = tokenized.children.map((child) => this.pool.discover.buildPointer(child));
        if (pointers.some((p) => !p)) {
            return undefined;
        }

        const clz = class AbstractTuple {
            static priority = { array: 1 };
            static tokenized = tokenized;

            static cast(value: unknown): unknown {
                if (!Array.isArray(value)) {
                    return value;
                }
                const arr = value as Arr;
                return pointers.map((pointer, index) => pointer.cast(arr[index]));
            }

            static is(value: unknown) {
                if (!Array.isArray(value)) {
                    return false;
                }
                const arr = value as Arr;
                return pointers.every((pointer, index) => pointer.is(arr[index]));
            }

            static doc(target: unknown, propertyKey: PropertyKey, openApi: Dict): CastApiDocResponse {
                // todo
                return { type: 'array' };
            }
        } as CastPointer;

        nameHandler.set(clz, encoded);
        fqnHandler.$secure.$setName(clz, encoded);

        this.pool.depot.add(clz);
        return clz;
    }
}
