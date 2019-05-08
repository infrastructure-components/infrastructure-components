import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";


export const ENTRY_INSTANCE_TYPE = "EntryComponent";


/**
 * Specifies all the properties that a Entity-Component must have
 */
export interface IEntry {

    /**
     * the id must be unique across all entities of the data-layer
     */
    id: string,

    /**
     * the primary key, not necessarily unique, but must be unique in combination with the rangeKey
     */
    primaryKey: string,

    /**
     * second part of the overall primary key
     */
    rangeKey: string,

    /**
     * any jsonifyable object that holds data
     */
    data: any

};

/**
 * an entry specifies a kind of data that can be stored in a line of the table
 */
export default (props: IEntry | any) => {

    // the component must have the properties of IComponent
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ENTRY_INSTANCE_TYPE,
        instanceId: props.id
    };

    return Object.assign(componentProps, props);


};


export const isEntry = (component) => {

    return component !== undefined &&  component.instanceType === ENTRY_INSTANCE_TYPE;
};
