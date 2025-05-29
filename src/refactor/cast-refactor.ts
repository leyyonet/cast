import { $descriptor, $dev, $err, $is, $log, $repo, Arr, Dict, Func, PropDescriptor } from '@leyyo/common';
import { DecoInstanceLike, deploy, fqnHandler, PropertyReflectionLike } from '@leyyo/core';

import { CastRefactorLike } from './index.types';
import { CastLambda, CastPoolLike } from '../pool';
import { CastClass } from '../basic';
import { FQN } from '../internal';
import { CastOpt, Dto } from '../decorators';
import { CastFieldsSign, CastValueSign } from '../index.symbols';
import { dtoHelper } from '../dto';

export class CastRefactor implements CastRefactorLike {
    private readonly logger = $log.create(CastRefactor);
    private readonly methodLambda: Map<PropertyReflectionLike, Array<CastLambda>>;
    private readonly methodPointers: Map<PropertyReflectionLike, Array<CastClass>>;
    private readonly fieldPointers: Map<PropertyReflectionLike, CastClass>;

    constructor(protected pool: CastPoolLike) {
        this.methodLambda = $repo.newMap(FQN, 'methodLambda');
        this.methodPointers = $repo.newMap(FQN, 'methodPointers');
        this.fieldPointers = $repo.newMap(FQN, 'fieldPointers');
    }

    property(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asField;
        if (ref.clazz.decorators().filter((d) => d.fn === Dto).length < 1) {
            const original = ref.clazz.creator;
            const oldProto = original.prototype;
            const dtoClass = class extends original {
                constructor(...args: Arr) {
                    super(...args);
                    dtoHelper.onConstruct(this, ...args);
                }
            } as CastClass;
            dtoClass.prototype = oldProto;

            dtoHelper.checkClass(dtoClass);
            const naming = fqnHandler.$secure.$get(original) ?? original.name;
            dtoHelper.changeNaming(dtoClass, naming as string);
        }
        if (!opt.type) {
            opt.type = ref.type;
        }

        const clazz = this.pool.discover.find(opt.type, false);
        if (!clazz) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid cast class',
                kind: 'basic',
                desc: ins.description,
                where: `${FQN}.CastRefactor`,
                method: 'property',
            });
        }

        this.fieldPointers.set(ref, clazz);
        if (clazz !== ref.type) {
            ref.$secure.$setFieldType(clazz as Func);
        }
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
            const rec = $descriptor.getValue<Dict>(this, CastValueSign);
            if (rec) {
                return rec[ref.name];
            }
            return undefined;
        };
        const set = function (value: unknown): void {
            let desc = $descriptor.get<Dict>(this, CastValueSign);
            if (!desc) {
                desc = {
                    value: {},
                } as PropDescriptor<Dict>;
                $descriptor.save(this, CastFieldsSign, desc.value);
            }
            try {
                desc.value[ref.name] = value !== undefined ? clazz.cast(value) : emptyFn();
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
        deploy.addInfo(FQN, 100, { message: 'Field casted', desc: ins.description, clazz: fqnHandler.get(clazz) });
    }

    parameter(ins: DecoInstanceLike, opt: CastOpt): void {
        const ref = ins.asParameter;

        if (!opt.type) {
            opt.type = ref.type;
        }
        const clazz = this.pool.discover.find(opt.type, false);
        if (!clazz) {
            throw $dev.developerError2(FQN, 100, {
                message: 'Invalid cast class',
                kind: 'basic',
                desc: ins.description,
                where: `${FQN}.CastRefactor`,
                method: 'parameter',
            });
        }

        if (!this.methodPointers.has(ref.property)) {
            this.methodPointers.set(ref.property, []);
            ref.property.listParameters().forEach((_p, index) => {
                this.methodPointers.get(ref.property)[index] = undefined;
            });
        }
        this.methodPointers.get(ref.property)[ref.index] = clazz;

        if (ref.type !== clazz) {
            ref.$secure.$setType(clazz as Func);
        }

        if (opt.weak) {
            return;
        }

        if (!this.methodLambda.has(ref.property)) {
            const lambdaList = [];
            ref.property.listParameters().forEach((_p) => {
                lambdaList.push((v) => v);
            });
            this.methodLambda.set(ref.property, lambdaList);
        }
        this.methodLambda.get(ref.property)[ref.index] = clazz.cast;
        deploy.addInfo(FQN, 100, { message: 'Parameter casted', desc: ins.description, clazz: fqnHandler.get(clazz) });
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
