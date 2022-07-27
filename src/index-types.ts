import {
    ArraySome,
    ClassLike,
    ClassOrName,
    FuncLike,
    ObjectLike,
    OneOrMore,
    RecLike,
    TypeFnLambda,
    TypeOpt
} from "@leyyo/core";
import {CallbackLike} from "@leyyo/callback";
import {DecoIdLike} from "@leyyo/reflection";


export type CastName = OneOrMore<string|FuncLike|ObjectLike>;

export interface CastApiDocResponse extends RecLike {
    type?: string;
    $ref?: string;
    oneOf?: ArraySome;
    items?: CastApiDocResponse;
}


export type CastDocLambda<O extends TypeOpt = TypeOpt> = (target: unknown, propertyKey: PropertyKey, openApi: RecLike, opt?: O) => CastApiDocResponse;
export type CastIsLambda<O extends TypeOpt = TypeOpt> = (value: unknown, opt?: O) => boolean;

export interface CastLike<T = unknown, O extends TypeOpt = TypeOpt> extends RecLike {
    is: CastIsLambda<O>;
    cast: TypeFnLambda<T, O>;
    docCast: CastDocLambda<O>;
}
export type CastCheckResult = 'self'|'proto';
export interface CastPoolLike extends CallbackLike<CastLike> {
    add(rec: CastLike, ...aliases: Array<string>): void;
    run<T>(clazz: ClassOrName, value: unknown, opt?: TypeOpt): T;
    copy(source: CastLike|FuncLike, target: FuncLike): void;
    get castId(): DecoIdLike;
    get genPool(): Array<CastTransfer>;
    get staging(): Map<string, Array<CastTransfer<CastName>>>;
    ly_checkClass(target: CastLike, throwable?: boolean): CastCheckResult;
    ly_find(dto: CastTransfer<CastName>): void;
    ly_initCast(castId: DecoIdLike): void;
    ly_initGen(genFn: CastGenLambda): void;
    ly_refactorProperty(target: FuncLike|ObjectLike, property: PropertyKey, opt: TypeOpt, fn: TypeFnLambda): void;
    ly_defaultSetter(dto: CastTransfer): void;
}
export interface CastTransfer<T = unknown> {
    clazz: T;
    opt: TypeOpt;
    target: FuncLike|ObjectLike;
    property: PropertyKey;
}
export type CastGenLambda<T = void> = (dto: CastTransfer) => T;