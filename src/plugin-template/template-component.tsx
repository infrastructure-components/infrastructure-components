import * as React from 'react';

import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";

export const DATALAYER_INSTANCE_TYPE = "DataLayerComponent";


/**
 * Arguments provided by the user
 */
export interface IDataLayerArgs {

}

/**
 * properties added programmatically
 */
export interface IDataLayerProps {

}


/**
 * identifies a component as a DataLayer
 *
 * @param component to be tested
 */
export function isDataLayer(component) {
    return component !== undefined &&
        component.instanceType === DATALAYER_INSTANCE_TYPE
}



export default (props: IDataLayerArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: DATALAYER_INSTANCE_TYPE,
        instanceId: "props.name" //TODO
    };

    const datalayerProps: IDataLayerProps = {

    }

    return Object.assign(props, componentProps, datalayerProps);


};