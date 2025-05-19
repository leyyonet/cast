import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";
import {EnumLiteral, EnumMap} from "../../../common";
import {ClassLike} from "@leyyo/common";

export interface CastEnumLike {
    canBe(clazz: CastEnumName): boolean;
    buildPointer(clazz: CastEnumName): CastPointer;
}
export type CastEnumName = string | ClassLike | EnumLiteral | EnumMap;
