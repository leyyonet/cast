import { decoratorPool, Fqn, lifecycle } from '@leyyo/core';

import { CastHubLike } from '../hub';
import { Cast, CastAlias, CastBasic, CastDto, CastGenerics, CastIndex, CastTuple, CastUnion } from '../decorators';
import { FQN } from '../internal';
import { CastFetchLike } from './index.types';

@Fqn(FQN)
export class CastFetch implements CastFetchLike {
    constructor(private hub: CastHubLike) {
        lifecycle
            .onAll(FQN)
            .after('leyyo.ruler')
            .before('leyyo.http_api')
            .before('leyyo.http_client')
            .before('leyyo.validator')
            .before('leyyo.pipe')
            .before('leyyo.middleware');

        lifecycle.onInitialize(FQN, () => this.initialize());
        lifecycle.onProcess(FQN, () => this.process());
    }

    // region private
    private _fetchBasic(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(CastBasic, true).asIdentifier;
        id.instances.forEach((ins) => basic.fetch(ins.asClass, ins.getValue()));
    }

    private _processBasic(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(CastBasic, true).asIdentifier;
        id.instances.forEach((ins) => basic.process(ins.asClass));
    }

    private _fetchGenerics(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(CastGenerics, true).asIdentifier;
        id.instances.forEach((ins) => generics.fetch(ins.asClass, ins.getValue()));
    }

    private _processGenerics(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(CastGenerics, true).asIdentifier;
        id.instances.forEach((ins) => generics.process(ins.asClass));
    }

    private _fetchTuple(): void {
        const tuple = this.hub.tuple;
        const id = decoratorPool.get(CastTuple, true).asIdentifier;
        id.instances.forEach((ins) => tuple.fetch(ins.asClass, ins.getValue()));
    }

    private _processTuple(): void {
        const tuple = this.hub.tuple;
        const id = decoratorPool.get(CastTuple, true).asIdentifier;
        id.instances.forEach((ins) => tuple.process(ins.asClass));
    }

    private _fetchUnion(): void {
        const union = this.hub.union;
        const id = decoratorPool.get(CastUnion, true).asIdentifier;
        id.instances.forEach((ins) => union.fetch(ins.asClass, ins.getValue()));
    }

    private _processUnion(): void {
        const union = this.hub.union;
        const id = decoratorPool.get(CastUnion, true).asIdentifier;
        id.instances.forEach((ins) => union.process(ins.asClass));
    }

    private _fetchDto(): void {
        const dto = this.hub.dto;
        const id = decoratorPool.get(CastDto, true).asIdentifier;
        id.instances.forEach((ins) => dto.fetch(ins.asClass, ins.getValue()));
    }

    private _processDto(): void {
        const dto = this.hub.dto;
        const id = decoratorPool.get(CastDto, true).asIdentifier;
        id.instances.forEach((ins) => dto.process(ins.asClass));
    }

    private _fetchAlias(): void {
        const basic = this.hub.basic;
        const id = decoratorPool.get(CastAlias, true).asIdentifier;
        id.instances.forEach((ins) => basic.fetchAlias(ins.asClass.creator, ins.getValue()));
    }

    private _processCast(): void {
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

    private _fetchIndex(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(CastIndex, true).asIdentifier;
        id.instances.forEach((ins) => {
            if (ins.isField) {
                generics.addIndex(ins.asField, ins.getValue());
            }
        });
    }

    private _processIndex(): void {
        const generics = this.hub.generics;
        const id = decoratorPool.get(CastIndex, true).asIdentifier;
        id.instances.forEach((ins) => {
            if (ins.isField) {
                generics.processIndex(ins.asField);
            }
        });
    }
    // endregion private

    initialize(): void {
        this._fetchBasic();
        this._fetchGenerics();
        this._fetchDto();
        this._fetchTuple();
        this._fetchUnion();

        this._fetchIndex();
        this._fetchAlias();

        this._processIndex();
        this._processBasic();
        this._processGenerics();
        this._processDto();
        this._processTuple();
        this._processUnion();
    }

    process(): void {
        this._processCast();
    }
}
