import { BasicType, ClassLike } from '@leyyo/common';
import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

export interface CastUnionLike {
    addDiscriminator(clazz: ClassLike, key: string, values: Array<unknown>): void;

    buildPointer(tokenized: CastTokenized): CastPointer;
}

export type CastUnionType = BasicType | 'array' | 'integer' | 'text';
