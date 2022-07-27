import {LEYYO_NAME} from "@leyyo/core";

export const BASE_NAME = 'cast';
export const COMPONENT_NAME = `@${LEYYO_NAME}/${BASE_NAME}`;
export const FQN_NAME = [LEYYO_NAME, BASE_NAME];
export const CAST_KEY = Symbol.for(`#${LEYYO_NAME}/${BASE_NAME}`);