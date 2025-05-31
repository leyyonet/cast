import { CastBase, CastClass, CastName, CastTokenized } from '../shared';
import {DevCallback} from "@leyyo/common";

export interface CastDiscoverLike {
    find(clazz: CastName, required?: DevCallback|true): CastClass;

    run(clazz: CastName, value: unknown): unknown;

    build(tokenized: CastTokenized): CastBase;
}
