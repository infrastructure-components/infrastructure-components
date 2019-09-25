import React, {ReactNode} from 'react';

import Types from '../types';
import { IComponent} from "../types/component";
import { IInfrastructure } from "../types";

import {
    setEntry, ddbGetEntry, ddbListEntries, getEntryListQuery, getEntryQuery, setEntryMutation, deleteEntryMutation,
    deleteEntry, getEntryScanQuery, ddbScan
} from './datalayer-libs';
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

    getEntryQuery: (dictKey: any) => any,

    getEntryScanQuery: (dictKey: any) => any,

    /**
     * set an entry with the specified values
     *
     * @param values
     */
    setEntryMutation: (values: any) => any,

    setEntry: (args, context, tableName, isOffline) => any,
    listEntries: (args, context, tableName, key, isOffline) => any,
    getEntry: (args, context, tableName, isOffline) => any,
    scan: (args, context, tableName, isOffline) => any,


    middleware: any,


    /**
     * delete an entry with the specified values
     *
     * @param values
     */
    deleteEntryMutation: (values: any) => any,

    deleteEntry: (args, context, tableName, isOffline) => any,

    /**
     * Provide the name of the list-query with primary entity
     */
    getPrimaryListQueryName: () => string,
    getSecondaryListQueryName: () => string,
    getGetQueryName: () => string,
    getSetMutationName: () => string,
    getPrimaryScanName: () => string,
    getRangeScanName: () => string,
    getScanName: () => string,

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

            if (props.primaryKey) {
                fields[props.primaryKey] = {type: GraphQLString};
            }

            if (props.rangeKey) {
                fields[props.rangeKey] = {type: GraphQLString};
            }

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

            if (props.primaryKey) {
                args[props.primaryKey] = {name: props.primaryKey, type: GraphQLString};
            }

            if (props.rangeKey) {
                args[props.rangeKey] = {name: props.rangeKey, type: GraphQLString};
            }

            return args;
        },

        createEntryArgs: () => {

            const args = Object.keys(props.data).reduce((result, key)=> {
                result[key] = {name: key, type: GraphQLString};
                return result;
            }, {});

            if (props.primaryKey) {
                args[props.primaryKey] = {name: props.primaryKey, type: GraphQLString};
            }

            if (props.rangeKey) {
                args[props.rangeKey] = {name: props.rangeKey, type: GraphQLString};
            }

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

        getEntryQuery: (dictKey) => {
            const fields = entryProps.createEntryFields();
            //console.log("fields: ", fields);

            return getEntryQuery(
                props.id,
                dictKey,
                fields
            );

        },

        getEntryScanQuery: (dictKey) => {
            const fields = entryProps.createEntryFields();
            //console.log("fields: ", fields);

            return getEntryScanQuery(
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

        setEntry: (args, context, tableName, isOffline) => {

            //console.log("setEntry: ", args, "offline: ", isOffline);

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
                }, {}), // jsonData
                isOffline // do we run offline?
            );
        },

        listEntries: (args, context, tableName, key, isOffline) => {
            const entity = key === "pk" ? props.primaryKey : props.rangeKey;
            const range = key === "pk" ? props.rangeKey : props.primaryKey;

            //console.log("listEntries: offline? ", isOffline)

            return ddbListEntries(
                tableName, //tablename
                key, // key
                entity, //entity
                args[entity], //value
                range, //rangeEntity
                isOffline
            ).then(results => {

                //console.log("promised: ", results);
                return results.map(item => {
                    const data = item.jsonData !== undefined ? JSON.parse(item.jsonData) : {};
                    data[props.primaryKey] = item.pk.substring(item.pk.indexOf("|") + 1);
                    data[props.rangeKey] = item.sk.substring(item.sk.indexOf("|") + 1);
                    return data;
                });

            });

        },

        getEntry: (args, context, tableName, isOffline) => {

            return ddbGetEntry(
                tableName, //tablename
                props.primaryKey, // pkEntity,
                args[props.primaryKey],    // pkValue,
                props.rangeKey, // skEntity,
                args[props.rangeKey], // skValue
                isOffline
            ).then((result: any)=> {

                //console.log("entry-component getEntry result: ", result);

                const data = result.jsonData !== undefined ? JSON.parse(result.jsonData) : {};

                if (result && result.pk && result.sk) {
                    data[props.primaryKey] = result.pk.substring(result.pk.indexOf("|") + 1);
                    data[props.rangeKey] = result.sk.substring(result.sk.indexOf("|") + 1);
                }
                return data;

            });

        },

        scan: (args, context, tableName, key, isOffline) => {

            //console.log("scan entry! ", args,  "offline: ", isOffline)



            return ddbScan(
                tableName, //tablename
                key, // key
                key === "pk" ? props.primaryKey : props.rangeKey, // pkEntity,
                args.scanall ? undefined : args[`start_${key === "pk" ? props.primaryKey : props.rangeKey}`],    // start_value,
                args.scanall ? undefined : args[`end_${key === "pk" ? props.primaryKey : props.rangeKey}`],    // end_Value,
                key === "pk" ? props.rangeKey : props.primaryKey, // skEntity,
                isOffline
            ).then((result: any)=> {

                //console.log("entry-component scan result: ", result);
                return result.map(entry => {
                    //console.log("scanned entry: ", entry);
                    const data = entry.jsonData !== undefined ? JSON.parse(entry.jsonData) : {};

                    if (entry && entry.pk && entry.sk) {
                        data[props.primaryKey] = entry.pk.substring(entry.pk.indexOf("|") + 1);
                        data[props.rangeKey] = entry.sk.substring(entry.sk.indexOf("|") + 1);
                    }

                    //console.log("returned data: ", data);
                    return data;
                });




            });

        },



        deleteEntryMutation: (values) => {
            const fields = entryProps.createEntryFields();
            //const fields = entryProps.createEntryFields();
            //console.log("fields: ", fields);

            return deleteEntryMutation(
                props.id,
                values,
                fields
            );

        },

        deleteEntry: (args, context, tableName, isOffline) => {

            return deleteEntry(
                tableName, //"code-architect-dev-data-layer",
                props.primaryKey, // schema.Entry.ENTITY, //pkEntity
                args[props.primaryKey], // pkId
                props.rangeKey, //schema.Data.ENTITY, // skEntity
                args[props.rangeKey], // skId
                isOffline
            );
        },

        middleware: createMiddleware({ callback: (req, res, next) => {
            //console.log("this is the mw of the entry: ", props.id)
            return next();

        }}),

        getPrimaryListQueryName: () => "list_"+props.id+"_"+props.primaryKey,
        getRangeListQueryName: () => "list_"+props.id+"_"+props.rangeKey,
        getGetQueryName: () => "get_"+props.id,
        getSetMutationName: () => "set_"+props.id,
        getDeleteMutationName: () => "delete_"+props.id,
        getPrimaryScanName: () => "scan_"+props.id+"_"+props.primaryKey,
        getRangeScanName: () => "scan_"+props.id+"_"+props.rangeKey,
        getScanName: () => "scan_"+props.id,

        /**
         * Returns whether this entry provides the query/mutation with the specified name
         * @param name
         */
        providesQuery: (name: string) => {

            const result = name === entryProps.getPrimaryListQueryName() ||
                name === entryProps.getRangeListQueryName() ||
                name === entryProps.getSetMutationName() ||
                name === entryProps.getDeleteMutationName() ||
                name === entryProps.getPrimaryScanName() ||
                name === entryProps.getRangeScanName() ||
                name === entryProps.getScanName()
            ;

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


    return createEntryProps(Object.assign({}, props, componentProps));


};


export const isEntry = (component) => {

    return component !== undefined &&  component.instanceType === ENTRY_INSTANCE_TYPE;
};
