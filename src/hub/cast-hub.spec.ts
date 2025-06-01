import { describe, test } from '@jest/globals';

import { strict as assert } from 'assert';
import { $test } from '@leyyo/common';
import { castHub } from './cast-hub';

const tokenizer = castHub.tokenizer;
describe('10* >> Application', () => {
    test($test.title(100, '[i] Simple'), () => {
        assert.deepEqual(tokenizer.parse('string0'), { main: 'String0', kind: 'basic' });
    });
    test($test.title(100, '[i] Generics'), () => {
        assert.deepEqual(tokenizer.parse('array1<string1>'), {
            main: 'Array1',
            kind: 'generics',
            children: [{ main: 'String1', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Generics + Union'), () => {
        assert.deepEqual(tokenizer.parse('array2<map1<string2, record1<object1|boolean1>>'), {
            main: 'Array2',
            kind: 'generics',
            children: [
                {
                    main: 'Map1',
                    kind: 'generics',
                    children: [
                        { main: 'String2', kind: 'basic' },
                        {
                            main: 'Record1',
                            kind: 'generics',
                            children: [
                                {
                                    kind: 'union',
                                    children: [
                                        { main: 'Object1', kind: 'basic' },
                                        { main: 'Boolean1', kind: 'basic' },
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
        assert.deepEqual(tokenizer.parse('[string3, number1]'), {
            kind: 'tuple',
            children: [
                { main: 'String3', kind: 'basic' },
                { main: 'Number1', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Generics > Union'), () => {
        assert.deepEqual(tokenizer.parse('array3<string4|number2>'), {
            main: 'Array3',
            kind: 'generics',
            children: [
                {
                    kind: 'union',
                    children: [
                        { main: 'String4', kind: 'basic' },
                        { main: 'Number2', kind: 'basic' },
                    ],
                },
            ],
        });
    });
    test($test.title(100, '[i] Union'), () => {
        assert.deepEqual(tokenizer.parse('string5|integer1'), {
            kind: 'union',
            children: [
                { main: 'String5', kind: 'basic' },
                { main: 'Integer1', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Array'), () => {
        assert.deepEqual(tokenizer.parse('string[]'), {
            main: 'Array',
            kind: 'generics',
            children: [{ main: 'String', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Union > Generics'), () => {
        assert.deepEqual(tokenizer.parse('array4<number3>|list<float1>'), {
            kind: 'union',
            children: [
                {
                    main: 'Array4',
                    kind: 'generics',
                    children: [{ main: 'Number3', kind: 'basic' }],
                },
                {
                    main: 'List',
                    kind: 'generics',
                    children: [{ main: 'Float1', kind: 'basic' }],
                },
            ],
        });
    });
});
