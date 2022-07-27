import {
    ArraySome,
    ClassLike,
    ClassOrName,
    DeveloperException,
    F_FIELD,
    FuncLike,
    leyyo, LEYYO_NAME,
    ObjectLike, TypeFnLambda,
    TypeOpt
} from "@leyyo/core";
import {fqn, Fqn} from "@leyyo/fqn";
import {DecoIdLike} from "@leyyo/reflection";
import {AbstractCallback} from "@leyyo/callback";
import {
    CastCheckResult,
    CastGenLambda,
    CastLike,
    CastName,
    CastPoolLike,
    CastTransfer
} from "./index-types";
import {BASE_NAME, CAST_KEY, COMPONENT_NAME, FQN_NAME} from "./internal-component";


@Fqn(...FQN_NAME)
export class CastPool extends AbstractCallback<CastLike> implements CastPoolLike {
    // region properties
    protected static readonly _MAIN_FUNCTIONS = ['cast', 'docCast'];
    protected readonly _staging: Map<string, Array<CastTransfer<CastName>>>;
    protected readonly _genPool: Array<CastTransfer>;
    protected _castId: DecoIdLike;
    protected _genFn: CastGenLambda;
    // endregion properties
    constructor() {
        super('cast', CastPool);
        this._staging = leyyo.repo.newMap<string, Array<CastTransfer<CastName>>>(this, '_staging');
        this._genPool = leyyo.repo.newArray<CastTransfer>(this, '_genPool');
        leyyo.component.add(COMPONENT_NAME);
    }
    // region inherited
    add(rec: CastLike, ...aliases: Array<string>): void {
        super.add(rec, ...aliases);
        const base = super.get(rec);
        [base.basic, base.full, ...base.aliases].forEach(name => {
            if (name && this._staging.has(name)) {
                this._staging.get(name).forEach(dto => {
                    this._refactorProperty(this._transform(dto, base.value));
                });
                this._staging.delete(name);
            }
        });
    }

    // endregion inherited
    // region private
    protected _transform<T>(dto: CastTransfer, clazz?: T): CastTransfer<T> {
        if (clazz === undefined) {
            clazz = dto.clazz as T;
        }
        return {opt: dto.opt, target: dto.target, property: dto.property, clazz} as CastTransfer<T>;
    }
    protected _toStaging(dto: CastTransfer<string>): void {
        if (!this._staging.has(dto.clazz)) {
            this._staging.set(dto.clazz, []);
        }
        this._staging.get(dto.clazz).push(dto);
        // this.LOG.warn('_toStaging', {clazz: fqn.name(dto.target), property: dto.property});
        this.ly_defaultSetter(dto);
    }
    protected _toGeneric(dto: CastTransfer<CastName>): void {
        if (this._genFn) {
            this._genFn(dto);
        } else {
            // this.LOG.warn('_toGeneric', {clazz: fqn.name(dto.target), property: dto.property});
            this._genPool.push(dto);
            this.ly_defaultSetter(dto);
        }
    }

    protected _refactorProperty(dto: CastTransfer<CastLike>): void {
        this.ly_refactorProperty(dto.target, dto.property, dto.opt, dto.clazz.cast);
    }
    // endregion private
    // region custom
    get castId(): DecoIdLike {
        return this._castId;
    }
    get genPool(): Array<CastTransfer> {
        return this._genPool;
    }
    get staging(): Map<string, Array<CastTransfer<CastName>>> {
        return this._staging;
    }
    run<T>(clazz: ClassOrName, value: unknown, opt?: TypeOpt): T {
        return this.fetchValue(clazz, true).cast(value, opt) as T;
    }
    protected _copy(source: unknown, target: FuncLike): boolean {
        if (source) {
            if (CastPool._MAIN_FUNCTIONS.every(fn => (typeof source[fn] === 'function'))) {
                CastPool._MAIN_FUNCTIONS.forEach(fn => {
                    target[fn] = (...a: ArraySome) => source[fn](...a);
                });
                return true;
            }
        }
        return false;
    }
    copy(source: CastLike|FuncLike, target: FuncLike): void {
        if (!leyyo.is.func(source) && !leyyo.is.object(source)) {
            throw new DeveloperException('cast.invalid-source', {source});
        }
        if (!leyyo.is.func(target)) {
            throw new DeveloperException('cast.invalid-target', {target});
        }
        if (!this._copy(source, target) && !this._copy(source?.prototype, target)) {
            throw new DeveloperException('cast.absent-function', {source: fqn.name(source), target: fqn.name(target), functions: CastPool._MAIN_FUNCTIONS}).with(this);
        }
        this.add(target as unknown as CastLike);
    }
    ly_find(dto: CastTransfer<CastName>): void {
        dto.opt = leyyo.primitive.object(dto.opt) ?? {};
        const usage = this._castId.usageName('type', dto.target, dto.property);
        switch (typeof dto.clazz) {
            case 'string':
                let str: string;
                try {
                    str = this.normalizeName(dto.clazz);
                } catch (e) {
                    throw new DeveloperException('cast.invalid-type', {usage, clazz: dto.clazz}).causedBy(e).with(this);
                }
                if (!str) {
                    throw new DeveloperException('cast.empty-type', {usage, clazz: dto.clazz}).with(this);
                }
                dto.clazz = str;
                if (str.includes('<')) {
                    this._toGeneric(this._transform(dto));
                } else {
                    const cb = this.get(str);
                    if (cb) {
                        const {target, property, opt} = dto;
                        this.ly_refactorProperty(target, property, opt, cb.value.cast);
                    } else {
                        this._toStaging(this._transform(dto));
                    }
                }
                return;
            case 'boolean':
                dto.clazz = 'Boolean';
                const cb = this.get(dto.clazz);
                if (cb) {
                    this._refactorProperty(this._transform(dto, cb.value));
                } else {
                    this._toStaging(this._transform(dto));
                }
                return;
            case 'object':
            case 'function':
                if (leyyo.is.array(dto.clazz)) {
                    this._toGeneric(dto);
                } else {
                    if (this.ly_checkClass(dto.clazz as CastLike)) {
                        const cb = this.get(dto.clazz);
                        if (!cb) {
                            this.add(dto.clazz as CastLike);
                        }
                        this._refactorProperty(this._transform(dto));
                    } else {
                        this._toGeneric(dto);
                    }
                }
                return;
        }
        throw new DeveloperException('cast.invalid-type', {usage, clazz: dto.clazz}).with(this);
    }
    ly_initCast(castId: DecoIdLike): void {
        if (!this._castId) {
            this._castId = castId;
        }
    }
    ly_initGen(genFn: CastGenLambda): void {
        if (!this._genFn) {
            this._genFn = genFn;
            this._genPool.forEach(item => genFn(item));
            leyyo.repo.clearArray(this, '_genPool');
        }
    }
    ly_checkClass(target: CastLike, throwable?: boolean): CastCheckResult {
        if (!target) {
            if (throwable) {
                throw new DeveloperException('cast.invalid-like', {target}).with(this);
            }
            return null;
        }
        if (CastPool._MAIN_FUNCTIONS.every(fn => (typeof target[fn] === 'function'))) {
            return 'self';
        }
        const proto = target?.prototype;
        if (proto) {
            if (CastPool._MAIN_FUNCTIONS.every(fn => (typeof proto[fn] === 'function'))) {
                return 'proto';
            }
        }
        if (throwable) {
            throw new DeveloperException('cast.absent-function', {target: fqn.name(target), functions: CastPool._MAIN_FUNCTIONS}).with(this);
        }
        return null;
    }
    ly_refactorProperty(target: FuncLike|ObjectLike, property: PropertyKey, opt: TypeOpt, fn: TypeFnLambda): void {
        // this.LOG.warn('ly_refactorProperty', {clazz: fqn.name(target), property});
        let def = undefined;
        const desc = Object.getOwnPropertyDescriptor(target, property);
        if (desc) {
            def = desc.value;
            delete target[property];
        }
        if (target[property] !== undefined) {
            delete target[property];
        }
        let emptyFn: FuncLike;
        if (leyyo.is.object(def)) {
            emptyFn = () => {
                return {...def};
            };
        } else if (leyyo.is.array(def)) {
            emptyFn = () => {
                return [...def];
            };
        } else {
            emptyFn = () => def;
        }
        const get = function (): unknown {
            const rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            if (rec?.value) {
                return rec.value[property];
            }
            return undefined;
        };
        const set = function (value: unknown): void {
            let rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            if (!rec?.value) {
                Object.defineProperty(this, CAST_KEY, {
                    enumerable: false,
                    configurable: false,
                    value: {},
                });
                rec = Object.getOwnPropertyDescriptor(this, CAST_KEY);
            }
            try {
                rec.value[property] = (value !== undefined) ? fn(value, opt) : emptyFn();
            } catch (e) {
                const err = leyyo.exception.build(e);
                err.params[F_FIELD] = property;
                throw e;
            }
        };
        Object.defineProperty(target, property, {
            configurable: true,
            enumerable: true,
            get,
            set
        });
    }
    ly_defaultSetter(dto: CastTransfer): void {
        // this.LOG.warn('ly_defaultSetter', {clazz: fqn.name(dto.target), property: dto.property});
        this.ly_refactorProperty(dto.target, dto.property, dto.opt, (v, opt) => {
            new DeveloperException('not-defined-setter', {clazz: fqn.name(dto.target), field: dto.property, type: dto.clazz}).with(this).log();
            return v;
        });
    }
    static concat(previous: CastName, added: CastName): CastName {
        switch (typeof added) {
            case "string":
            case "number":
            case "function":
                // expected
                break;
            default:
                added = `[?T]${typeof added}`
                break;
        }
        if (previous === undefined || previous == null) {
            return added;
        }
        switch (typeof previous) {
            case "string":
            case "number":
            case "function":
                return [previous, added];
        }
        if (leyyo.is.array(previous)) {
            const arr = [...(previous as ArraySome)];
            arr.push(added);
            return arr;
        }
        return [`[?T]${typeof previous}`, added];
    }
    static view(name: CastName, isError = false): string {
        if (name === undefined) {
            return '';
        }
        switch (typeof name) {
            case "string":
            case "number":
                return isError ? `Field[${name}] ` : `${name}`;
            case "function":
                try {
                    name = name();
                    return isError ? `Field[${name}] ` : name as string;
                } catch (e) {
                    name = e.message;
                    return isError ? `FieldError[${e.message}] ` : `[?E]${e.message}`;
                }
        }
        if (leyyo.is.array(name)) {
            const arr = name as Array<CastName>;
            const result = [] as Array<string>;
            arr.forEach(item => {
                switch (typeof item) {
                    case "string":
                        if (result.length > 0) {
                            result.push('.');
                        }
                        result.push(item);
                        break;
                    case "number":
                        if (result.length > 0) {
                            result.push('#');
                        }
                        result.push(item.toString(10));
                        break;
                    case "function":
                        let val = null;
                        try {
                            val = item();
                        } catch (e) {
                            val = `[?E]${e.message}`;
                        }
                        switch (typeof val) {
                            case "string":
                                if (result.length > 0) {
                                    result.push('.');
                                }
                                result.push(val);
                                break;
                            case "number":
                                if (result.length > 0) {
                                    result.push('#');
                                }
                                result.push(val.toString(10));
                                break;
                            default:
                                if (result.length > 0) {
                                    result.push('.');
                                }
                                result.push(`[?T]${typeof val}`);
                                break;
                        }
                        break;
                    default:
                        if (result.length > 0) {
                            result.push('.');
                        }
                        result.push(`[?T]${typeof item}`);
                        break;
                }
            });
            if (result.length > 0) {
                return isError ? `Field[${result.join('')}] ` : result.join('');
            }
        }
        return isError ? `FieldError[Invalid type with ${typeof name}] ` : `[?T]${typeof name}`;
    }
    // endregion custom
}
export const castPool: CastPoolLike = new CastPool();