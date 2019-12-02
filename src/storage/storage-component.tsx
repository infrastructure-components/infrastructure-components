import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";
import middleware, {isMiddleware} from "../middleware/middleware-component";
import {getChildrenArray} from "../index";
import { listMiddleware, uploadMiddleware } from './storage-libs';

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
     * the relative  path of the route, e.g. "/" for the root, or "/something", or "*" for any
     * Can be a regex to filter the paths of the routes and redirects
     */
    path: string

}

/**
 * properties added programmatically
 */
export interface IStorageProps {

    /**
     * A Webapp component supports middlewares, defines as direct children
     */
    middlewares: Array<any>,


    /**
     * A function that the DataLayer provides, it lets the WebApp get the DataLayer Id
     */
    setDataLayerId: (dataLayerId: string) => void,

    /**
     * The id of the datalayer - if the webapp applies to one.
     * filled by the DataLayer
     */
    dataLayerId?: any,

    /**
     * The http method of the route, e.g. get, post, ...
     */
    method: string,

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
        instanceId: props.id,

        insulatesChildComponent: (child) => {
            // a webapp insulates (handles itself) middlewares and routes and does not privide to higher levels
            return isMiddleware(child)
        }
    };

    const storageProps: IStorageProps = {
        middlewares: getChildrenArray(props.children)
            .filter(child => isMiddleware(child))
            .concat([
                listMiddleware(props.id),
                uploadMiddleware(props.id)
            ]),

        setDataLayerId: (dataLayerId: string) => {
            props.dataLayerId = dataLayerId;
        },

        method: "POST"
    }

    return Object.assign(props, componentProps, storageProps);


};