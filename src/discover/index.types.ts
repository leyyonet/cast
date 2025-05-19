import {ClassLike, Func} from "@leyyo/common";

import {CastPointer} from "../basic";
import {CastName} from "../pool";
import {CastTokenized} from "../tokenizer";

export interface CastDiscoverLike {
    find(clazz: CastName, required?: boolean): CastPointer;
    run(clazz: CastName, value: unknown): unknown;
    copy(source: unknown, target: Func | ClassLike): boolean;
    buildPointer(tokenized: CastTokenized): CastPointer;
}
