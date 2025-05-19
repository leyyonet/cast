import { CastPointer } from '../basic';
import {CastTokenized} from "../tokenizer";

export interface CastTupleLike {
    buildPointer(tokenized: CastTokenized): CastPointer;
}
