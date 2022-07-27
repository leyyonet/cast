import {leyyo, printDetailed, RecLike, TypeOpt} from "@leyyo/core";
import {Fqn} from "@leyyo/fqn";
import {C, F, M} from "@leyyo/reflection";
import {castPool} from "../cast-pool";
import {CastApiDocResponse} from "../index-types";
import {FQN_NAME} from "../internal-component";
import {AssignCast, Cast} from "../index-annotations";
import {AbstractDto} from "../abstract-dto";

@AssignCast('Str2', 'str')
@Fqn(...FQN_NAME)
export class MyStr {
    static docCast(target: unknown, propertyKey: PropertyKey, openApi: RecLike, opt?: TypeOpt): CastApiDocResponse {
        return {type: 'string'};
    }

    static cast(value: unknown, opt?: TypeOpt): string {
        return leyyo.primitive.text(value, opt);
    }
}

@AssignCast()
@Fqn(...FQN_NAME)
export class MyInt {
    @M()
    static docCast(target: unknown, propertyKey: PropertyKey, openApi: RecLike, opt?: TypeOpt): CastApiDocResponse {
        return {type: 'integer'};
    }
    @M()
    static cast(value: unknown, opt?: TypeOpt): number {
        return leyyo.primitive.integer(value, opt);
    }
}

@Fqn(...FQN_NAME)
export class MyClass0 extends AbstractDto {
    @Cast('Str2')
    @F()
    surname: string;
}
@Fqn(...FQN_NAME)
export class MyClass extends MyClass0 {
    @Cast('MyStr')
    @F()
    name: string;

    @Cast('myInt')
    @F()
    age: number;
}

export function sampleCast1() {
    printDetailed('cast1', castPool.info);
    // printDetailed(reflect.description, reflect.info(false));
    // printDetailed(reflect.description, reflect.getClass(MyInt).listAnyProperties().map(prop => prop.info(true)));
    console.log(castPool.run('myInt', '5'));
    console.log(castPool.run('myInt', true));
    console.log(castPool.run('myInt', () => '2.3'));

    const class1 = new MyClass();
    console.log(class1);
    class1.age = '4' as unknown as number;
    class1.name = (() => 5) as unknown as string;
    class1.surname = false as unknown as string;
    console.log(JSON.stringify(class1.surname));
    console.log(JSON.stringify(class1));
}