import {CastExtension, CastPointer} from "../basic";
import {CastAnalyseType, CastKind} from "../pool";
import {CastTokenized} from "../tokenizer";

export interface CastFetchLike {
    initialize(): void;
    process(): void;
    analyse(pointer: CastPointer): CastAnalyseType;
    save(pointer: CastPointer, tokenized: CastTokenized, aliases: Array<string>, kinds: Array<CastKind>, ext: Partial<CastExtension>): void;
}
