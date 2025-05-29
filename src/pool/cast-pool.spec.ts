import { describe, test } from '@jest/globals';

import { strict as assert } from 'assert';
import { $test } from '@leyyo/common';
import { castTokenizer } from './cast-pool';

describe('10* >> Application', () => {
    test($test.title(100, '[i] Simple'), () => {
        assert.deepEqual(castTokenizer.parse('string0'), { base: 'String0', kind: 'basic' });
    });
    test($test.title(100, '[i] Generics'), () => {
        assert.deepEqual(castTokenizer.parse('array1<string1>'), {
            base: 'Array1',
            kind: 'generics',
            children: [{ base: 'String1', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Generics + Union'), () => {
        assert.deepEqual(castTokenizer.parse('array2<map1<string2, record1<object1|boolean1>>'), {
            base: 'Array2',
            kind: 'generics',
            children: [
                {
                    base: 'Map1',
                    kind: 'generics',
                    children: [
                        { base: 'String2', kind: 'basic' },
                        {
                            base: 'Record1',
                            kind: 'generics',
                            children: [
                                {
                                    kind: 'union',
                                    children: [
                                        { base: 'Object1', kind: 'basic' },
                                        { base: 'Boolean1', kind: 'basic' },
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
        assert.deepEqual(castTokenizer.parse('[string3, number1]'), {
            kind: 'tuple',
            children: [
                { base: 'String3', kind: 'basic' },
                { base: 'Number1', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Generics > Union'), () => {
        assert.deepEqual(castTokenizer.parse('array3<string4|number2>'), {
            base: 'Array3',
            kind: 'generics',
            children: [
                {
                    kind: 'union',
                    children: [
                        { base: 'String4', kind: 'basic' },
                        { base: 'Number2', kind: 'basic' },
                    ],
                },
            ],
        });
    });
    test($test.title(100, '[i] Union'), () => {
        assert.deepEqual(castTokenizer.parse('string5|integer1'), {
            kind: 'union',
            children: [
                { base: 'String5', kind: 'basic' },
                { base: 'Integer1', kind: 'basic' },
            ],
        });
    });
    test($test.title(100, '[i] Array'), () => {
        assert.deepEqual(castTokenizer.parse('string[]'), {
            base: 'Array',
            kind: 'generics',
            children: [{ base: 'String', kind: 'basic' }],
        });
    });
    test($test.title(100, '[i] Union > Generics'), () => {
        assert.deepEqual(castTokenizer.parse('array4<number3>|list<float1>'), {
            kind: 'union',
            children: [
                {
                    base: 'Array4',
                    kind: 'generics',
                    children: [{ base: 'Number3', kind: 'basic' }],
                },
                {
                    base: 'List',
                    kind: 'generics',
                    children: [{ base: 'Float1', kind: 'basic' }],
                },
            ],
        });
    });
});
