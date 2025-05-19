import { describe, test } from '@jest/globals';

import { strict as assert } from 'assert';
import { $test } from '@leyyo/common';
import { castPool } from './cast-pool';

describe('10* >> Application', () => {
    test($test.title(100, '[i] Simple'), () => {
        assert.deepEqual(castPool.discover.parse('string0'), { base: 'String0', kinds: ['type'] });
    });
    test($test.title(100, '[i] Generics'), () => {
        assert.deepEqual(castPool.discover.parse('array1<string1>'), {
            base: 'Array1',
            kinds: ['generics'],
            children: [{ base: 'String1', kinds: ['type'] }],
        });
    });
    test($test.title(100, '[i] Generics + Union'), () => {
        assert.deepEqual(castPool.discover.parse('array2<map1<string2, record1<object1|boolean1>>'), {
            base: 'Array2',
            kinds: ['generics'],
            children: [
                {
                    base: 'Map1',
                    kinds: ['generics'],
                    children: [
                        {
                            base: 'String2',
                            kinds: ['type'],
                        },
                        {
                            base: 'Record1',
                            kinds: ['generics'],
                            children: [
                                {
                                    kinds: ['union'],
                                    children: [
                                        {
                                            base: 'Object1',
                                            kinds: ['type'],
                                        },
                                        {
                                            base: 'Boolean1',
                                            kinds: ['type'],
                                        },
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
        assert.deepEqual(castPool.discover.parseCleared('[string3, number1]'), {
            children: [{ base: 'String3' }, { base: 'Number1' }],
        });
    });
    test($test.title(100, '[i] Generics > Union'), () => {
        assert.deepEqual(castPool.discover.parseCleared('array3<string4|number2>'), {
            base: 'Array3',
            children: [{ children: [{ base: 'String4' }, { base: 'Number2' }] }],
        });
    });
    test($test.title(100, '[i] Union'), () => {
        assert.deepEqual(castPool.discover.parse('string5|integer1'), {
            kinds: ['union'],
            children: [{ base: 'String5', kinds: ['type'] }, { base: 'Integer1', kinds: ['type'] }],
        });
    });
    test($test.title(100, '[i] Array'), () => {
        assert.deepEqual(castPool.discover.parse('string[]'), {
            base: 'Array',
            kinds: ['generics'],
            children: [{ base: 'String', kinds: ['type'] }],
        });
    });
    test($test.title(100, '[i] Union > Generics'), () => {
        assert.deepEqual(castPool.discover.parseCleared('array4<number3>|list<float1>'), {
            children: [
                {
                    base: 'Array4',
                    children: [{ base: 'Number3' }],
                },
                { base: 'List', children: [{ base: 'Float1' }] },
            ],
        });
    });
});
