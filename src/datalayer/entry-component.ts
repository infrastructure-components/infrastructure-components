import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";


import {
    graphql,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLInputObjectType
}  from 'graphql';


export const ENTRY_INSTANCE_TYPE = "EntryComponent";


/**
 * Specifies all the properties that a Entity-Component must have
 */
export interface IEntryArgs {

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

export interface IEntryProps {

    createEntryFields: () => any,

    createEntryType: (prefix: string) => any,

    createKeyArgs: () => any,

    /**
     * creates an argument list of all the data of the entry, keys+jsonData
     * @param entry
     * @returns {{}}
     */
    createEntryArgs: () => any
}


export const createEntryProps = (props): IEntryProps => {

    const entryProps = {
        createEntryFields: () => {
            const fields = Object.keys(props.data).reduce((result, key)=> {
                result[key] = {type: props.data[key]};
                return result;
            }, {});

            fields[props.primaryKey] = {type: GraphQLString};
            fields[props.rangeKey] = {type: GraphQLString};

            return fields;
        },

        createEntryType: (prefix) => {
            return new GraphQLObjectType({
                name: prefix+props.id,
                fields: () => entryProps.createEntryFields()
            })
        },

        createKeyArgs: () => {

            const args = {};

            args[props.primaryKey] = {name: props.primaryKey, type: GraphQLString};
            args[props.rangeKey] = {name: props.rangeKey, type: GraphQLString};

            return args;
        },

        createEntryArgs: () => {

            const args = Object.keys(props.data).reduce((result, key)=> {
                result[key] = {name: key, type: GraphQLString};
                return result;
            }, {});

            args[props.primaryKey] = {name: props.primaryKey, type: GraphQLString};
            args[props.rangeKey] = {name: props.rangeKey, type: GraphQLString};

            return args;
        }
    }


    return Object.assign({}, props, entryProps);

};

/**
 * an entry specifies a kind of data that can be stored in a line of the table
 */
export default (props: IEntryArgs | any) => {

    // the component must have the properties of IComponent
    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: ENTRY_INSTANCE_TYPE,
        instanceId: props.id
    };


    return createEntryProps(Object.assign({}, props,componentProps));


};


export const isEntry = (component) => {

    return component !== undefined &&  component.instanceType === ENTRY_INSTANCE_TYPE;
};
