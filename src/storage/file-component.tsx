import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

export const FILE_INSTANCE_TYPE = "FileComponent";


/**
 * Arguments provided by the user
 */
export interface IFileArgs {
    /**
     * a unique id or name of the webapp
     */
    id: string,
}

/**
 * properties added programmatically
 */
export interface IFileProps {

}


/**
 * identifies a component as a File
 *
 * @param component to be tested
 */
export function isFile(component) {
    return component !== undefined &&
        component.instanceType === FILE_INSTANCE_TYPE
}



export default (props: IFileArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: FILE_INSTANCE_TYPE,
        instanceId: props.id
    };

    const fileProps: IFileProps = {

    }

    return Object.assign(props, componentProps, fileProps);


};