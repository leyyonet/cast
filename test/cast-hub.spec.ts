import { describe, test } from '@jest/globals';

import { strict as assert } from 'assert';
import { $test } from '@leyyo/common';
import { castHub } from '../src';

const tokenizer = castHub.tokenizer;
describe('10* >> Application', () => {
    test($test.title(100, '[i] Simple'), () => {
        assert.deepEqual(tokenizer.parse('string0'), { main: 'string0', kind: 'basic' });
    });
    test($test.title(100, '[i] Generics'), () => {
        assert.deepEqual(tokenizer.parse('Array<string>'), {
            main: 'Array',
            kind: 'generics',
            children: [{ main: 'string', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Generics + Union'), () => {
        assert.deepEqual(tokenizer.parse('Array<Map<string, Record<object|boolean>>'), {
            main: 'Array',
            kind: 'generics',
            children: [
                {
                    main: 'Map',
                    kind: 'generics',
                    children: [
                        { main: 'string', kind: 'basic' },
                        {
                            main: 'Record',
                            kind: 'generics',
                            children: [
                                {
                                    kind: 'union',
                                    children: [
                                        { main: 'object', kind: 'basic' },
                                        { main: 'boolean', kind: 'basic' },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
    test($test.title(100, '[i] Tuple'), () => {
        assert.deepEqual(tokenizer.parse('[string, number]'), {
            kind: 'tuple',
            children: [
                { main: 'string', kind: 'basic' },
                { main: 'number', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Tuple'), () => {
        assert.deepEqual(tokenizer.parse('([string, number])'), {
            kind: 'tuple',
            children: [
                { main: 'string', kind: 'basic' },
                { main: 'number', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Generics > Union'), () => {
        assert.deepEqual(tokenizer.parse('Array<string|number>'), {
            main: 'Array',
            kind: 'generics',
            children: [
                {
                    kind: 'union',
                    children: [
                        { main: 'string', kind: 'basic' },
                        { main: 'number', kind: 'basic' },
                    ],
                },
            ],
        });
    });
    test($test.title(100, '[i] Union'), () => {
        assert.deepEqual(tokenizer.parse('string|integer'), {
            kind: 'union',
            children: [
                { main: 'string', kind: 'basic' },
                { main: 'integer', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Array'), () => {
        assert.deepEqual(tokenizer.parse('string[]'), {
            main: 'Array',
            kind: 'generics',
            children: [{ main: 'string', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Merge'), () => {
        assert.deepEqual(tokenizer.parse('string&number'), {
            kind: 'merge',
            children: [
                { main: 'string', kind: 'basic' },
                { main: 'number', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Merge & Group'), () => {
        assert.deepEqual(tokenizer.parse('(string&number)|(boolean)'), {
            kind: 'union',
            children: [
                {
                    kind: 'merge',
                    children: [
                        { kind: 'basic', main: 'string' },
                        { kind: 'basic', main: 'number' },
                    ],
                },
                { kind: 'basic', main: 'boolean' },
            ],
        });
    });
    test($test.title(100, '[i] Union > Generics'), () => {
        assert.deepEqual(tokenizer.parse('Array<number>|List<float>'), {
            kind: 'union',
            children: [
                {
                    main: 'Array',
                    kind: 'generics',
                    children: [{ main: 'number', kind: 'basic' }],
                },
                {
                    main: 'List',
                    kind: 'generics',
                    children: [{ main: 'float', kind: 'basic' }],
                },
            ],
        });
    });
    test($test.title(100, '[i] Ignore generic group'), () => {
        assert.deepEqual(tokenizer.parse('Array<(number)>|List<(float)>'), {
            kind: 'union',
            children: [
                {
                    main: 'Array',
                    kind: 'generics',
                    children: [{ main: 'number', kind: 'basic' }],
                },
                {
                    main: 'List',
                    kind: 'generics',
                    children: [{ main: 'float', kind: 'basic' }],
                },
            ],
        });
    });
});
