import { $descriptor, $dev, $err, $is, $log, $repo, Dict, Func } from '@leyyo/common';
import { DecoInstanceLike, lifecycle, PropertyReflectionLike } from '@leyyo/core';
import { CastRefactorLike } from './index.types';
import { CastLambda, CastPoolLike } from '../pool';
import { CastPointer } from '../basic';
import { FQN } from '../internal';
import { CastOpt, Dto } from '../decorators';
import { CastFieldsSign } from '../index.symbols';

export class CastRefactor implements CastRefactorLike {
    private readonly logger = $log.create(CastRefactor);
    private readonly methodLambda: Map<PropertyReflectionLike, Array<CastLambda>>;
    private readonly methodPointers: Map<PropertyReflectionLike, Array<CastPointer>>;
    private readonly fieldPointers: Map<PropertyReflectionLike, CastPointer>;

    constructor(protected pool: CastPoolLike) {
        this.methodLambda = $repo.newMap(FQN, 'methodLambda');
        this.methodPointers = $repo.newMap(FQN, 'methodPointers');
        this.fieldPointers = $repo.newMap(FQN, 'fieldPointers');
    }

    property(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asField;
        if (ref.clazz.decorators().filter((d) => d.fn === Dto).length < 1) {
        }
        if (!opt.type) {
            opt.type = ref.type;
        }
        const pointer = this.pool.discover.find(opt.type, false);
        if (!pointer) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid cast class',
                kind: 'type',
                desc: ins.description,
                where: 'leyyo.cast.CastPool',
                method: 'find',
            });
        }

        this.fieldPointers.set(ref, pointer);
        if (opt.weak) {
            return;
        }
        let def = undefined;
        let desc: PropertyDescriptor;
        if (ref.isInstance) {
            desc = Object.getOwnPropertyDescriptor(ref.clazz.body, ref.name);
        } else {
            desc = Object.getOwnPropertyDescriptor(ref.clazz, ref.name);
        }
        if (desc) {
            def = desc.value;
        }
        if (ref.isInstance) {
            delete ref.clazz.body[ref.name];
        } else {
            delete ref.clazz[ref.name];
        }
        let emptyFn: Func;
        if ($is.object(def)) {
            emptyFn = () => {
                return { ...def };
            };
        } else if (Array.isArray(def)) {
            emptyFn = () => {
                return [...def];
            };
        } else {
            emptyFn = () => def;
        }
        const get = function (): unknown {
            const rec = $descriptor.get(this, CastFieldsSign);
            if (rec?.value) {
                return rec.value[ref.name];
            }
            return undefined;
        };
        const set = function (value: unknown): void {
            let rec = $descriptor.getValue<Dict>(this, CastFieldsSign);
            if (!rec) {
                rec = {};
                $descriptor.save(this, CastFieldsSign, rec);
            }
            try {
                rec[ref.name] = value !== undefined ? pointer.cast(value) : emptyFn();
            } catch (e) {
                const err = $err.build(e);
                err.params['field'] = ref.name;
                throw e;
            }
        };
        if (ref.isInstance) {
            Object.defineProperty(ref.clazz.body, ref.name, {
                configurable: true,
                enumerable: true,
                get,
                set,
            });
        } else {
            Object.defineProperty(ref.clazz, ref.name, {
                configurable: true,
                enumerable: true,
                get,
                set,
            });
        }
        lifecycle.addInfo(FQN, 100, { message: 'Field casted', desc: ins.description, pointer: pointer.name });
    }

    parameter(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asParameter;

        if (!opt.type) {
            opt.type = ref.type;
        }
        const pointer = this.pool.discover.find(opt.type, false);
        if (!pointer) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid cast class',
                kind: 'type',
                desc: ins.description,
                where: 'leyyo.cast.CastPool',
                method: 'find',
            });
        }

        if (!this.methodPointers.has(ref.property)) {
            this.methodPointers.set(ref.property, []);
            ref.property.listParameters().forEach((p, index) => {
                this.methodPointers.get(ref.property)[index] = undefined;
            });
        }
        this.methodPointers.get(ref.property)[ref.index] = pointer;

        if (opt.weak) {
            return;
        }

        if (!this.methodLambda.has(ref.property)) {
            const lambdaList = [];
            ref.property.listParameters().forEach(_p => {
                lambdaList.push(v => v);
            });
            this.methodLambda.set(ref.property, lambdaList);
        }
        this.methodLambda.get(ref.property)[ref.index] = pointer.cast;
        lifecycle.addInfo(FQN, 100, { message: 'Parameter casted', desc: ins.description, pointer: pointer.name });
    }

    hasMethod(ref: PropertyReflectionLike): boolean {
        return this.methodLambda.has(ref);
    }

    runForMethod(ref: PropertyReflectionLike, values: Array<any>): Array<any> {
        const lambdaList = this.methodLambda.get(ref);
        if (!lambdaList) {
            return values;
        }
        return lambdaList.map((lambda, index) => lambda(values[index]));
    }
}
