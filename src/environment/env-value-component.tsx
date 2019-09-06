import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

export const ENVVALUE_INSTANCE_TYPE = "EnvValueComponent";


export interface IEnvValueArgs {
    /**
     * The name of the value
     */
    name: string,

    /**
     * the value
     */
    value: any
}

export interface IEnvValueProps {

}


/**
 * identifies a component as a EnvValue: it implements all the required fields
 *
 * @param component to be tested
 */
export function isEnvValue(component) {
    return component !== undefined &&
        component.instanceType === ENVVALUE_INSTANCE_TYPE
}



export default (props: IEnvValueArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ENVVALUE_INSTANCE_TYPE,
        instanceId: props.name
    };

    const environmentProps: IEnvValueProps = {

    }

    return Object.assign(props, componentProps, environmentProps);


};