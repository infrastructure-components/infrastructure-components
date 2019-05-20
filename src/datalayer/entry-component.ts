import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";

import { setEntry, ddbListEntries, getEntryListQuery, setEntryMutation } from './datalayer-libs';
import createMiddleware from '../middleware/middleware-component';


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
    createEntryArgs: () => any,

    /**
     * Get a list of entries that satisfy the query
     *
     * @param dictKey an object that has one key that specifies the pk or sk to query with its value
     */
    getEntryListQuery: (dictKey: any) => any,

    /**
     * set an entry with the specified values
     *
     * @param values
     */
    setEntryMutation: (values: any) => any,

    setEntry: (args, context, tableName) => any,
    listEntries: (args, context, tableName, key) => any,

    middleware: any,


    /**
     * Provide the name of the list-query with primary entity
     */
    getPrimaryListQueryName: () => string,
    getSecondaryListQueryName: () => string,
    getSetMutationName: () => string,

    /**
     * Returns whether this entry provides the query/mutation with the specified name
     * @param name
     */
    providesQuery: (name: string) => boolean
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
                name: prefix + props.id,
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
        },

        getEntryListQuery: (dictKey) => {
            const fields = entryProps.createEntryFields();
            //console.log("fields: ", fields);

            return getEntryListQuery(
                props.id,
                dictKey,
                fields
            );
        },

        setEntryMutation: (values) => {
            const fields = entryProps.createEntryFields();
            //console.log("fields: ", fields);

            return setEntryMutation(
                props.id,
                values,
                fields
            );

        },

        setEntry: (args, context, tableName) => {

            return setEntry(
                tableName, //"code-architect-dev-data-layer",
                props.primaryKey, // schema.Entry.ENTITY, //pkEntity
                args[props.primaryKey], // pkId
                props.rangeKey, //schema.Data.ENTITY, // skEntity
                args[props.rangeKey], // skId
                Object.keys(args).reduce((result, key) => {
                    if (Object.keys(props.data).find(datakey => datakey === key) !== undefined) {
                        result[key] = args[key];
                    }
                    return result;
                }, {}) // jsonData
            );
        },

        listEntries: (args, context, tableName, key) => {
            const entity = key === "pk" ? props.primaryKey : props.rangeKey;
            const range = key === "pk" ? props.rangeKey : props.primaryKey;

            return ddbListEntries(
                tableName, //tablename
                key, // key
                entity, //entity
                args[entity], //value
                range //rangeEntity
            ).then(results => {

                console.log("promised: ", results);
                return results.map(item => {
                    const data = item.jsonData !== undefined ? JSON.parse(item.jsonData) : {};
                    data[props.primaryKey] = item.pk.substring(item.pk.indexOf("|") + 1);
                    data[props.rangeKey] = item.sk.substring(item.sk.indexOf("|") + 1);
                    return data;
                });

            });

        },

        middleware: createMiddleware({ callback: (req, res, next) => {
            console.log("this is the mw of the entry: ", props.id)
            return next();

        }}),

        getPrimaryListQueryName: () => "list_"+props.id+"_"+props.primaryKey,
        getRangeListQueryName: () => "list_"+props.id+"_"+props.rangeKey,
        getSetMutationName: () => "set_"+props.id,

        /**
         * Returns whether this entry provides the query/mutation with the specified name
         * @param name
         */
        providesQuery: (name: string) => {


            const result = name === entryProps.getPrimaryListQueryName() ||
                name === entryProps.getRangeListQueryName() ||
                name === entryProps.getSetMutationName();

            //console.log("does ", props.id , " provide ", name, "? ", result)

            return result;
        }

    };


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
