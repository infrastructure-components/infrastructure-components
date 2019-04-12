import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

export const ENVIRONMENT_INSTANCE_TYPE = "EnvironmentComponent";


export interface IEnvironmentArgs {
    /**
     * The name of the environment is mandatory. in the cloud, this is also used as stagePath
     */
    name: string,

    /**
     * the domain that this page should be deployed to
     */
    domain?: string,

    /**
     * The used port when running offline
     */
    offlinePort?: number
}

export interface IEnvironmentProps {

}


/**
 * identifies a component as a WebApp: it implements all the required fields
 *
 * @param component to be tested
 */
export function isEnvironment(component) {
    return component !== undefined &&
        component.instanceType === ENVIRONMENT_INSTANCE_TYPE
}



export default (props: IEnvironmentArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ENVIRONMENT_INSTANCE_TYPE,
        instanceId: props.name
    };

    const environmentProps: IEnvironmentProps = {

    }

    return Object.assign(props, componentProps, environmentProps);


};