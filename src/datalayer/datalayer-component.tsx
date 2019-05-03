import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";
import { getChildrenArray } from '../libs';
import { isWebApp } from '../webapp/webapp-component';


export const DATALAYER_INSTANCE_TYPE = "DataLayerComponent";


/**
 * Arguments provided by the user
 */
export interface IDataLayerArgs {
    /**
     * a unique id or name of the datalayer
     */
    id: string,

    /**
     * TODO: should become a component
     */
    queries: any,

    /**
     * TODO: should become a component
     */
    mutations: any
}

/**
 * properties added programmatically
 */
export interface IDataLayerProps {

};


/**
 * identifies a component as a DataLayer
 *
 * @param component to be tested
 */
export function isDataLayer(component) {
    return component !== undefined && component.instanceType === DATALAYER_INSTANCE_TYPE
};

export default (props: IDataLayerArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: DATALAYER_INSTANCE_TYPE,
        instanceId: props.id
    };

    const datalayerProps: IDataLayerProps = {

    };


    return Object.assign(props, componentProps, datalayerProps, {
        // we need to set the datalayerId in all webApp-children
        children: getChildrenArray(props).map(child => {
            if (isWebApp(child)) {
                return Object.assign({}, child, {
                    dataLayerId: props.id
                })
            }

            return child;

        }),

    });

};