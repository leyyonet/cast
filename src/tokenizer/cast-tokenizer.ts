import { Fqn, fqnHandler } from '@leyyo/core';
import { $assert, $dev } from '@leyyo/common';
import { FQN } from '../internal';
import { CastTokenizerLike } from './index.types';
import { CastHubLike } from '../hub';
import { COMMA, GENERIC_BEGIN, GENERIC_END, PIPE, SPACE, TUPLE_BEGIN, TUPLE_END } from './index.constants';
import { CastKind, CastNamePlain, CastToken, CastTokenized, CastTokenizedInside, CastTokenType } from '../shared';

// noinspection Annotator
@Fqn(FQN)
export class CastTokenizer implements CastTokenizerLike {
    constructor(private hub: CastHubLike) {}

    protected _backward(value: string, tokens: Array<CastToken>, type?: CastTokenType): string {
        if (value) {
            tokens.push({ type: 'value', value });
        }
        if (type) {
            tokens.push({ type });
        }
        return '';
    }

    protected _tokens(text: string): Array<CastToken> {
        $assert.text(text, () => $dev.opt({ where: `${FQN}.CastTokenizer`, field: 'text' }));

        let collected = '';
        let index = 0;
        const tokens = [] as Array<CastToken>;
        while (index < text.length) {
            const chr = text[index];
            switch (chr) {
                case SPACE:
                    break;
                case COMMA:
                    collected = this._backward(collected, tokens, 'comma');
                    break;
                case GENERIC_BEGIN:
                    collected = this._backward(collected, tokens, 'generics-begin');
                    break;
                case GENERIC_END:
                    collected = this._backward(collected, tokens, 'generics-end');
                    break;
                case PIPE:
                    collected = this._backward(collected, tokens, 'pipe');
                    break;
                case TUPLE_BEGIN:
                    collected = this._backward(collected, tokens, 'tuple-begin');
                    break;
                case TUPLE_END:
                    collected = this._backward(collected, tokens, 'tuple-end');
                    break;
                default:
                    collected += chr;
                    break;
            }
            index++;
        }
        this._backward(collected, tokens);
        return tokens;
    }

    tokenize(text: string): CastTokenized {
        const result = { children: [] } as CastTokenizedInside;
        const tokens = this._tokens(text);
        if (
            tokens.filter((t) =>
                ['comma', 'pipe', 'generics-begin', 'generics-end', 'tuple-begin', 'tuple-end'].includes(t.type),
            ).length < 1
        ) {
            if (tokens.length === 1) {
                return {
                    base: fqnHandler.normalizeName(tokens[0].value),
                    kind: 'basic',
                };
            }
            throw $dev.developerError2(FQN, 100, { message: 'Invalid basic type', tokens });
        }

        const tree = [] as Array<CastKind>;
        let latest: CastKind;
        let current: CastTokenizedInside = result;
        tokens.forEach((token, index) => {
            if (token.type === 'ignore') {
                return;
            }
            let closed: CastKind;
            switch (token.type) {
                case 'value':
                    current.base = fqnHandler.normalizeName(token.value);
                    if (!current.kind) {
                        current.kind = 'basic';
                    }
                    break;
                case 'comma':
                    if (latest === 'generics' || latest === 'tuple') {
                        current.parent.children.push({ children: [], parent: current.parent });
                        current = current.parent.children[current.parent.children.length - 1];
                    } else {
                        throw new Error('Invalid comma in ' + latest);
                    }
                    break;
                case 'pipe':
                    if (latest === 'union') {
                        current.parent.children.push({ children: [], parent: current.parent });
                        current = current.parent.children[current.parent.children.length - 1];
                    } else {
                        // first pipe
                        const child = {
                            base: current.base,
                            children: [...current.children],
                            kind: current.kind,
                            parent: current,
                        } as CastTokenizedInside;

                        delete current.base;
                        delete current.children;
                        current.children = [child];
                        current.kind = 'union';

                        current.children.push({ children: [], parent: current });
                        current = current.children[current.children.length - 1];

                        latest = 'union';
                        tree.push(latest);
                    }
                    break;
                case 'generics-begin':
                    if (!current.base) {
                        throw new Error('Absent base - generics');
                    }
                    current.kind = 'generics';
                    current.children.push({ children: [], parent: current });
                    current = current.children[current.children.length - 1];

                    latest = 'generics';
                    tree.push(latest);
                    break;
                case 'generics-end':
                    closed = tree.pop();
                    current = current.parent;
                    if (closed === 'union') {
                        closed = tree.pop();
                        current = current.parent;
                    }
                    latest = tree[tree.length - 1];
                    if (closed !== 'generics') {
                        throw new Error('Wrong close - generics');
                    }
                    break;
                case 'tuple-begin':
                    const next = tokens[index + 1];
                    // [] case
                    if (next && next.type === 'tuple-end') {
                        const child = {
                            base: current.base,
                            children: [...current.children],
                            kind: current.kind,
                            parent: current,
                        } as CastTokenizedInside;

                        current.children = [child];
                        current.kind = 'generics';
                        current.base = 'Array';

                        if (current.parent) {
                            current.parent.children.push({ children: [], parent: current.parent });
                            current = current.parent.children[current.parent.children.length - 1];
                        } else {
                            current = undefined;
                        }
                        next.type = 'ignore';
                    } else {
                        if (current.base) {
                            throw new Error('Unexpected base - tuple');
                        }

                        current.kind = 'tuple';
                        current.children.push({ children: [], parent: current });
                        current = current.children[current.children.length - 1];

                        latest = 'tuple';
                        tree.push(latest);
                    }
                    break;
                case 'tuple-end':
                    closed = tree.pop();
                    current = current.parent;
                    if (closed === 'union') {
                        closed = tree.pop();
                        current = current.parent;
                    }
                    latest = tree[tree.length - 1];
                    if (closed !== 'tuple') {
                        throw new Error('Wrong close - tuple');
                    }
                    break;
            }
        });

        return this._clear(result);
    }

    protected _addRemove(tokenized: CastTokenized, key: keyof CastTokenized): void {
        const value = tokenized[key];
        if (value !== undefined) {
            delete tokenized[key];
            tokenized[key as 'base'] = value as string;
        }
    }

    protected _clear(tokenized: CastTokenizedInside): CastTokenized {
        if (tokenized.parent !== undefined) {
            delete tokenized.parent;
        }
        if (Array.isArray(tokenized.children)) {
            if (tokenized.children.length < 1) {
                delete tokenized.children;
            } else {
                tokenized.children = tokenized.children.map((token) => this._clear(token));
            }
        } else if (tokenized.children !== undefined) {
            delete tokenized.children;
        }
        this._addRemove(tokenized, 'base');
        this._addRemove(tokenized, 'kind');
        this._addRemove(tokenized, 'children');

        return tokenized;
    }

    clearKinds(tokenized: CastTokenized): void {
        if (tokenized.kind !== undefined) {
            delete tokenized.kind;
        }
        if (Array.isArray(tokenized.children)) {
            tokenized.children.forEach((token) => this.clearKinds(token));
        }
    }

    className(clazz: CastNamePlain): string {
        switch (typeof clazz) {
            case 'string':
                const name = fqnHandler.normalizeName(clazz).split(' ').join('');
                const base = this.hub.depot.get(name, false);
                if (base) {
                    return base.full;
                }
                if (name) {
                    return name;
                }
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.CastPool',
                    method: 'findWithShortcutArray',
                });
            case 'object':
            case 'function':
                return fqnHandler.get(clazz);
            default:
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.CastPool',
                    method: 'findWithShortcutArray',
                });
        }
    }

    parse(clazz: CastNamePlain, check?: boolean): CastTokenized {
        let text: string;
        if (typeof clazz === 'string' && !check) {
            text = fqnHandler.normalizeName(clazz).split(' ').join('');
        } else {
            text = this.className(clazz);
        }
        if (text.includes('<') || text.includes('|') || text.includes('[')) {
            return this.tokenize(text);
        }
        return {
            base: text,
            kind: 'basic',
        };
    }

    parseCleared(clazz: CastNamePlain, check?: boolean): CastTokenized {
        const tokenized = this.parse(clazz, check);
        this.clearKinds(tokenized);
        return tokenized;
    }

    stringify(tokenized: CastTokenized): string {
        switch (tokenized.kind) {
            case 'generics':
                return `${tokenized.base}<${tokenized.children.map((c) => this.stringify(c)).join(', ')}>`;
            case 'union':
                return tokenized.children.map((c) => this.stringify(c)).join(' | ');
            case 'tuple':
                return `[${tokenized.children.map((c) => this.stringify(c)).join(', ')}]`;
        }
        return tokenized.base;
    }
}
