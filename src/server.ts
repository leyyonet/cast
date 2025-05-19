import { MyClass } from './samples/z-cast-class';
import { castPool } from './pool';

function sampleCast1() {
    console.log({ given: '5', current: castPool.discover.run('MyInt', '5'), expected: 5 });
    console.log({ given: true, current: castPool.discover.run('MyInt', true), expected: 1 });
    console.log({ given: '2.3', current: castPool.discover.run('MyInt', '2.3'), expected: 2 });

    const class1 = new MyClass();
    console.log(class1);
    class1.age = '4' as unknown as number;
    console.log({ given: '4', current: class1.age, expected: 4 });

    class1.name = (() => 5) as unknown as string;
    console.log({ given: '() => 5)', current: class1.name, expected: '5' });

    class1.surname = false as unknown as string;
    console.log({ given: false, current: class1.surname, expected: 'false' });

    console.log(JSON.stringify(class1));
}

sampleCast1();
