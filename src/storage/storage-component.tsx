import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

export const STORAGE_INSTANCE_TYPE = "StorageComponent";


/**
 * Arguments provided by the user
 */
export interface IStorageArgs {
    /**
     * a unique id or name of the webapp
     */
    id: string,

    /**
     * Local, relative directory specifies where to put the final bundles
     */
    buildPath: string,

}

/**
 * properties added programmatically
 */
export interface IStorageProps {

}


/**
 * identifies a component as a DataLayer
 *
 * @param component to be tested
 */
export function isStorage(component) {
    return component !== undefined &&
        component.instanceType === STORAGE_INSTANCE_TYPE
}



export default (props: IStorageArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: STORAGE_INSTANCE_TYPE,
        instanceId: props.id
    };

    const storageProps: IStorageProps = {

    }

    return Object.assign(props, componentProps, storageProps);


};