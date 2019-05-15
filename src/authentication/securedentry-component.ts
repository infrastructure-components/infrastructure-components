import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";
import {ENTRY_INSTANCE_TYPE, createEntryProps} from "../datalayer/entry-component";
import { IC_USER_ID} from "./auth-middleware";


export const SECUREDENTRY_INSTANCE_TYPE = "SecuredEntryComponent";


/**
 * Specifies all the properties that a Entity-Component must have
 */
export interface ISecuredEntryArgs {

    /**
     * the id must be unique across all entities of the data-layer
     */
    id: string,

    /**
     * the primary key, not necessarily unique, but must be unique in combination with the rangeKey
     */
    primaryKey: string,



    /**
     * any jsonifyable object that holds data
     */
    data: any

};


/**
 * specifies the properties that an Authentication-Component has during runtime
 */
export interface ISecuredEntryProps {

    /**
     * the second part of the overall primary key
     * this is filled by the Authentication-Component!
     */
    rangeKey: string,

}


/**
 * an entry specifies a kind of data that can be stored in a line of the table
 */
export default (props: ISecuredEntryArgs | any) => {

    // the component must have the properties of IComponent
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: SECUREDENTRY_INSTANCE_TYPE,
        instanceId: props.id
    };

    // filled by Authentication-Component
    const securedEntryProps: ISecuredEntryProps = {
        rangeKey: IC_USER_ID

    };

    return createEntryProps(Object.assign({}, props, componentProps, securedEntryProps));


};


export const isSecuredEntry = (component) => {

    return component !== undefined &&  component.instanceType === SECUREDENTRY_INSTANCE_TYPE;
};
