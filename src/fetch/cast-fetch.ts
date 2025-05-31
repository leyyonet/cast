import { decoratorPool, Fqn, lifecycle } from '@leyyo/core';

import { CastFetchLike } from './index.types';
import { CastHubLike } from '../hub';
import {
    AssignDto,
    AssignGenerics,
    AssignTuple,
    AssignType,
    AssignUnion,
    Cast,
    CastAlias,
    GenericsIndex,
} from '../decorators';
import { FQN } from '../internal';

@Fqn(FQN)
export class CastFetch implements CastFetchLike {
    constructor(private hub: CastHubLike) {
        lifecycle
            .onAll(FQN)
            .after('leyyo.rule')
            .before('leyyo.http-api')
            .before('leyyo.http-client')
            .before('leyyo.validator')
            .before('leyyo.pipe')
            .before('leyyo.middleware');

        lifecycle.onInitialize(FQN, () => this.initialize());
        lifecycle.onProcess(FQN, () => this.process());
    }

    protected fetchAssignType(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(AssignType, true).asIdentifier;
        id.instances.forEach((ins) => basic.fetch(ins.asClass));
    }

    protected processAssignType(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(AssignType, true).asIdentifier;
        id.instances.forEach((ins) => basic.process(ins.asClass));
    }

    protected fetchAssignGenerics(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(AssignGenerics, true).asIdentifier;
        id.instances.forEach((ins) => generics.fetch(ins.asClass, ins.getValue()));
    }

    protected processAssignGenerics(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(AssignGenerics, true).asIdentifier;
        id.instances.forEach((ins) => generics.process(ins.asClass));
    }

    protected fetchAssignTuple(): void {
        const tuple = this.hub.tuple;
        const id = decoratorPool.get(AssignTuple, true).asIdentifier;
        id.instances.forEach((ins) => tuple.fetch(ins.asClass, ins.getValue()));
    }

    protected processAssignTuple(): void {
        const tuple = this.hub.tuple;
        const id = decoratorPool.get(AssignTuple, true).asIdentifier;
        id.instances.forEach((ins) => tuple.process(ins.asClass));
    }

    protected fetchAssignUnion(): void {
        const union = this.hub.union;
        const id = decoratorPool.get(AssignUnion, true).asIdentifier;
        id.instances.forEach((ins) => union.fetch(ins.asClass, ins.getValue()));
    }

    protected processAssignUnion(): void {
        const union = this.hub.union;
        const id = decoratorPool.get(AssignUnion, true).asIdentifier;
        id.instances.forEach((ins) => union.process(ins.asClass));
    }

    protected fetchAssignDto(): void {
        const dto = this.hub.dto;
        const id = decoratorPool.get(AssignDto, true).asIdentifier;
        id.instances.forEach((ins) => dto.fetch(ins.asClass, ins.getValue()));
    }

    protected processAssignDto(): void {
        const dto = this.hub.dto;
        const id = decoratorPool.get(AssignDto, true).asIdentifier;
        id.instances.forEach((ins) => dto.process(ins.asClass));
    }

    protected fetchAlias(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(CastAlias, true).asIdentifier;
        id.instances.forEach((ins) => basic.fetchAlias(ins.asClass.creator, ins.getValue()));
    }

    protected processCast(): void {
        const refactor = this.hub.refactor;
        const id = decoratorPool.get(Cast, true).asIdentifier;
        id.instances.forEach((ins) => {
            if (ins.isField) {
                refactor.property(ins, ins.getValue());
            } else if (ins.isParameter) {
                refactor.parameter(ins, ins.getValue());
            }
        });
    }

    protected fetchGenericsIndex(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(GenericsIndex, true).asIdentifier;
        id.instances.forEach((ins) => {
            if (ins.isField) {
                generics.addIndex(ins.asField, ins.getValue());
            }
        });
    }
    protected processGenericsIndex(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(GenericsIndex, true).asIdentifier;
        id.instances.forEach((ins) => {
            if (ins.isField) {
                generics.processIndex(ins.asField);
            }
        });
    }

    initialize(): void {
        this.fetchAssignType();
        this.fetchAssignGenerics();
        this.fetchAssignDto();
        this.fetchAssignTuple();
        this.fetchAssignUnion();

        this.fetchGenericsIndex();
        this.fetchAlias();

        this.processGenericsIndex();
        this.processAssignType();
        this.processAssignGenerics();
        this.processAssignDto();
        this.processAssignTuple();
        this.processAssignUnion();
    }

    process(): void {
        this.processCast();
    }
}
