import { CastNamePlain, CastTokenized } from '../shared';

export interface CastTokenizerLike {
    tokenize(text: string): CastTokenized;

    clearKinds(tokenized: CastTokenized): void;

    className(clazz: CastNamePlain): string;

    parse(clazz: CastNamePlain, check?: boolean): CastTokenized;

    parseCleared(clazz: CastNamePlain, check?: boolean): CastTokenized;

    stringify(tokenized: CastTokenized): string;
}
