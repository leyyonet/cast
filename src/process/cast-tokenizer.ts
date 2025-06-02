import { Fqn, fqnHandler } from '@leyyo/core';
import {$assert, $dev, $name} from '@leyyo/common';

import { FQN } from '../internal';
import { CastHubLike, CastKind, CastNamePlain } from '../hub';
import {
    AND,
    COMMA,
    GENERIC_BEGIN,
    GENERIC_END,
    GROUP_BEGIN,
    GROUP_END,
    PIPE,
    SPACE,
    TUPLE_BEGIN,
    TUPLE_END,
} from './internal.constants';
import { CastToken, CastTokenized, CastTokenizerLike, CastTokenType } from './index.types';

// noinspection Annotator
@Fqn(FQN)
export class CastTokenizer implements CastTokenizerLike {

    // region properties
    private readonly _types = [
        'comma',
        'pipe',
        'and',
        'generics-begin',
        'generics-end',
        'tuple-begin',
        'tuple-end',
        'group-begin',
        'group-end',
    ] as Array<CastTokenType>;
    private readonly _hasMain = ['basic', 'generics'] as Array<CastKind>;
    private readonly _noChild = ['basic'] as Array<CastKind>;
    private readonly _noOneChild = ['union', 'merge'] as Array<CastKind>;
    private readonly _bracketChild = ['union', 'merge'] as Array<CastKind>;
    private readonly _onlyOneChild = ['group'] as Array<CastKind>;


    // endregion properties

    constructor(private hub: CastHubLike) {}

    // region private
    private _backward(value: string, tokens: Array<CastToken>, type?: CastTokenType): string {
        if (value) {
            tokens.push({ type: 'value', value });
        }
        if (type) {
            tokens.push({ type });
        }
        return '';
    }

    private _tokens(text: string): Array<CastToken> {
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
                case PIPE:
                    collected = this._backward(collected, tokens, 'pipe');
                    break;
                case AND:
                    collected = this._backward(collected, tokens, 'and');
                    break;
                case GENERIC_BEGIN:
                    collected = this._backward(collected, tokens, 'generics-begin');
                    break;
                case GENERIC_END:
                    collected = this._backward(collected, tokens, 'generics-end');
                    break;
                case TUPLE_BEGIN:
                    collected = this._backward(collected, tokens, 'tuple-begin');
                    break;
                case TUPLE_END:
                    collected = this._backward(collected, tokens, 'tuple-end');
                    break;
                case GROUP_BEGIN:
                    collected = this._backward(collected, tokens, 'group-begin');
                    break;
                case GROUP_END:
                    collected = this._backward(collected, tokens, 'group-end');
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

    private _empty(left: unknown, right: unknown): boolean {
        if (left !== undefined && right === undefined) {
            return false;
        }
        if (left === undefined && right !== undefined) {
            return false;
        }
        if (left === undefined && right === undefined) {
            return true;
        }
        return undefined;
    }

    private _removeGroup(tokenized: CastTokenized): CastTokenized {
        if (tokenized.children) {
            tokenized.children = tokenized.children.map((token) => this._removeGroup(token));
            if (tokenized.kind === 'group') {
                return tokenized.children[0];
            }
        }
        return tokenized;
    }

    private _validate(tokenized: CastTokenized): CastTokenized {
        const {main, kind, children} = tokenized;
        if (main && !this._hasMain.includes(kind)) {
            throw $dev.developerError2(FQN, 100, {message: 'Class can not have main'});
        }
        else if (!main && this._hasMain.includes(kind)) {
            throw new Error('Class must have main');
        }
        if (children && this._noChild.includes(kind)) {
            throw new Error('Class can not have children');
        }
        else if (!children && !this._noChild.includes(kind)) {
            throw new Error('Class must have children');
        }
        if (children) {
            if (children.length === 1) {
                if (this._noOneChild.includes(kind)) {
                    throw new Error('Class must have more children, not only 1');
                }
            }
            else {
                if (this._onlyOneChild.includes(kind)) {
                    throw new Error('Class must have only 1 child');
                }
            }
            tokenized.children = tokenized.children.map((token) => this._validate(token));
        }
        return tokenized;
    }

    private _clear(tokenized: CastTokenized, sanitize: boolean): CastTokenized {
        if (tokenized.parent !== undefined) {
            delete tokenized.parent;
        }
        if (sanitize && tokenized.clazz !== undefined) {
            delete tokenized.clazz;
        }
        if (Array.isArray(tokenized.children)) {
            if (tokenized.children.length < 1) {
                delete tokenized.children;
            } else {
                tokenized.children = tokenized.children.map((token) => this._clear(token, sanitize));
            }
        } else if (tokenized.children !== undefined) {
            delete tokenized.children;
        }
        const {kind, children, main, clazz} = tokenized;
        const newToken = {kind} as CastTokenized;
        if (main) {
            newToken.main = main;
        }
        if (!sanitize && clazz) {
            newToken.clazz = clazz;
        }
        if (children) {
            newToken.children = children;
        }
        return newToken;
    }

    private _stringifyChildren(children: Array<CastTokenized>, separator: string, bracket?: boolean): string {
        return children.map((child) => {
            if (bracket && this._bracketChild.includes(child.kind)) {
                return `(${this._stringify(child)})`;
            }
            return this._stringify(child);
        }).join(separator);
    }
    // endregion private

    equals(left: CastTokenized, right: CastTokenized): boolean {
        let is: boolean|undefined;
        is = this._empty(left, right);
        if (is !== undefined) {
            return is;
        }
        is = this._empty(left.kind, right.kind);
        if (is === false) {
            return is;
        }
        if (left.kind !== right.kind) {
            return false;
        }

        is = this._empty(left.main, right.main);
        if (is === false) {
            return is;
        }
        if (left.main !== right.main) {
            return false;
        }

        is = this._empty(left.children, right.children);
        if (is === false) {
            return is;
        }
        if (left.children === undefined && right.children === undefined) {
            return true;
        }
        if (left.children?.length !== right.children?.length) {
            return false;
        }
        if (Array.isArray(left.children) && Array.isArray(right.children)) {
            if (left.children.some((child, index) => !this.equals(child, right.children[index]))) {
                return false;
            }
        }
        else if (Array.isArray(left.children) || Array.isArray(right.children)) {
            return false;
        }

        return true;
    }
    tokenize(text: string): CastTokenized {
        const result = { children: [] } as CastTokenized;
        const tokens = this._tokens(text);
        if (tokens.filter((t) => this._types.includes(t.type)).length < 1) {
            if (tokens.length === 1) {
                $name.validate(tokens[0].value, true);
                return {
                    main: tokens[0].value,
                    kind: 'basic',
                };
            }
            throw $dev.developerError2(FQN, 100, { message: 'Invalid basic type', tokens });
        }

        const tree = [] as Array<CastKind>;
        let latest: CastKind;
        let current: CastTokenized = result;
        tokens.forEach((token, index) => {
            if (token.type === 'ignore') {
                return;
            }
            let closed: CastKind;
            let next: CastToken;
            switch (token.type) {
                case 'value':
                    $name.validate(token.value, true);
                    current.main = token.value;
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
                            main: current.main,
                            children: [...current.children],
                            kind: current.kind,
                            parent: current,
                        } as CastTokenized;

                        delete current.main;
                        delete current.children;
                        current.children = [child];
                        current.kind = 'union';

                        current.children.push({ children: [], parent: current });
                        current = current.children[current.children.length - 1];

                        latest = 'union';
                        tree.push(latest);
                    }
                    break;
                case 'and':
                    if (latest === 'merge') {
                        current.parent.children.push({ children: [], parent: current.parent });
                        current = current.parent.children[current.parent.children.length - 1];
                    } else {
                        // first merge
                        const child = {
                            main: current.main,
                            children: [...current.children],
                            kind: current.kind,
                            parent: current,
                        } as CastTokenized;

                        delete current.main;
                        delete current.children;
                        current.children = [child];
                        current.kind = 'merge';

                        current.children.push({ children: [], parent: current });
                        current = current.children[current.children.length - 1];

                        latest = 'merge';
                        tree.push(latest);
                    }
                    break;
                case 'generics-begin':
                    if (!current.main) {
                        throw new Error('Absent main - generics');
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
                    if (['union', 'merge'].includes(closed)) {
                        closed = tree.pop();
                        current = current.parent;
                    }
                    latest = tree[tree.length - 1];
                    if (closed !== 'generics') {
                        throw new Error('Wrong close - generics');
                    }
                    break;
                case 'tuple-begin':
                    next = tokens[index + 1];
                    // [] case
                    if (next && next.type === 'tuple-end') {
                        const child = {
                            main: current.main,
                            children: [...current.children],
                            kind: current.kind,
                            parent: current,
                        } as CastTokenized;

                        current.children = [child];
                        current.kind = 'generics';
                        current.main = 'Array';

                        if (current.parent) {
                            current.parent.children.push({ children: [], parent: current.parent });
                            current = current.parent.children[current.parent.children.length - 1];
                        } else {
                            current = undefined;
                        }
                        next.type = 'ignore';
                    } else {
                        if (current.main) {
                            throw new Error('Unexpected maim - tuple');
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
                    if (['union', 'merge'].includes(closed)) {
                        closed = tree.pop();
                        current = current.parent;
                    }
                    latest = tree[tree.length - 1];
                    if (closed !== 'tuple') {
                        throw new Error('Wrong close - tuple');
                    }
                    break;

                case 'group-begin':
                    next = tokens[index + 1];
                    if (current.main) {
                        throw new Error('Unexpected maim - group');
                    }

                    current.kind = 'group';
                    current.children.push({ children: [], parent: current });
                    current = current.children[current.children.length - 1];

                    latest = 'group';
                    tree.push(latest);
                    break;
                case 'group-end':
                    closed = tree.pop();
                    current = current.parent;
                    if (['union', 'merge'].includes(closed)) {
                        closed = tree.pop();
                        current = current.parent;
                    }
                    latest = tree[tree.length - 1];
                    if (closed !== 'group') {
                        throw new Error('Wrong close - group');
                    }
                    break;
            }
        });
        return this._removeGroup(this._validate(this._clear(result, false)));
    }

    className(clazz: CastNamePlain): string {
        switch (typeof clazz) {
            case 'string':
                $name.validate(clazz, true);
                const name = clazz;
                const bbb = this.hub.depot.get(name, false);
                if (bbb) {
                    return bbb.full;
                }
                if (name) {
                    return name;
                }
                throw $dev.invalidError({
                    issue: 'invalid.generics.pattern',
                    type: typeof clazz,
                    expected: ['string', 'object', 'function'],
                    where: 'leyyo.cast.castHub',
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
                    where: 'leyyo.cast.castHub',
                    method: 'findWithShortcutArray',
                });
        }
    }

    parse(clazz: CastNamePlain, check?: boolean): CastTokenized {
        let text: string;
        if (typeof clazz === 'string' && !check) {
            $name.validate(clazz, true);
            text = clazz;
        } else {
            text = this.className(clazz);
        }
        if (
            text.includes('<') ||
            text.includes('>') ||
            text.includes('[') ||
            text.includes(']') ||
            text.includes('(') ||
            text.includes(')') ||
            text.includes('|') ||
            text.includes(',') ||
            text.includes('&')
        ) {
            return this.tokenize(text);
        }
        return {
            main: text,
            kind: 'basic',
        };
    }

    sanitize(given: CastTokenized): CastTokenized {
        return this._removeGroup(this._validate(this._clear(given, true)));
    }
    private _stringify(tokenized: CastTokenized): string {
        switch (tokenized.kind) {
            case 'basic':
                return tokenized.main;
            case 'generics':
                return `${tokenized.main}<${this._stringifyChildren(tokenized.children, ', ')}>`;
            case 'union':
                return this._stringifyChildren(tokenized.children, ' | ', true);
            case 'tuple':
                return `[${this._stringifyChildren(tokenized.children, ', ')}]`;
            case 'merge':
                return this._stringifyChildren(tokenized.children, ' & ', true);
            case 'group': // should be never called
                return `(${this._stringify(tokenized.children[0])})`;
            default:
                return tokenized.main;
        }
    }
    stringify(tokenized: CastTokenized): string {
        return this._stringify(this.sanitize(tokenized));
    }
}
