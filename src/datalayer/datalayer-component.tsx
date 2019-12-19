import * as React from 'react';


import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull,
    GraphQLList,
    GraphQLInputObjectType
}  from 'graphql';


import Types from '../types';
import { IComponent } from "../types/component";
import { IInfrastructure } from "../types";
import { getChildrenArray, findComponentRecursively } from '../libs';
import { isWebApp } from '../webapp/webapp-component';
import { isAuthentication } from '../authentication/authentication-component';
import { isIdentity } from '../identity/identity-component'
import { isEntry } from './entry-component';
import { setEntry, ddbGetEntry, ddbListEntries, getEntryListQuery } from './datalayer-libs';

export const DATALAYER_INSTANCE_TYPE = "DataLayerComponent";


/**
 * Arguments provided by the user
 */
export interface IDataLayerArgs {
    /**
     * a unique id or name of the datalayer
     */
    id: string
}

/**
 * properties added programmatically
 */
export interface IDataLayerProps {

    /**
     * supported queries, i.e. entries that the user can query
     */
    queries: any,

    /**
     * supported mutations
     */
    mutations: any,

    /**
     * get the entry-data-fields of the specified entry
     * @param entryId id of the entry to get the fields from
     *
    getEntryDataFields: (entryId: string) => any,*/

    /**
     * wrapper function for getEntryListQuery, this allows us to complement some data
     * @param entryId
     * @param dictKey
     */
    getEntryListQuery: (entryId: string, dictKey: any ) => any,

    getEntryQuery: (entryId: string, dictKey: any ) => any,

    getEntryScanQuery: (entryId: string, dictKey: any ) => any,

    setEntryMutation: (entryId: string, values: any ) => any,

    deleteEntryMutation: (entryId: string, values: any ) => any,

    updateEntryQuery: (entryId, fDictKey: (oldData) => any) => any,

    getSchema?: any // optional only because it is implemented in a separate object below. but it is required!

    entries: any,

    /**
     * The Apollo-Client: used at server-side only! Used to provide the Apollo-Client to middlewares
     */
    client?: any
    setClient: (client: any) => void,

    /**
     * set to true when running in offline mode
     */
    isOffline: boolean,
    setOffline: (offline: boolean) => void
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

    //const listEntities = getChildrenArray(props).filter(child => isEntity(child));
    //const entries = getChildrenArray(props).filter(child => isEntry(child));
    const entries = findComponentRecursively(props.children, isEntry);

    const complementedProps = {

    };

    /**
     * create the
     * @type {{queries: {}, mutations: {}}}
     */
    const datalayerProps = {

        entries: entries,

        mutations: (resolveWithData: boolean) => entries.reduce((result, entry) => {

            result[entry.getSetMutationName()] = {
                args: entry.createEntryArgs(),
                type: entry.createEntryType("set_"),
                resolve: (source, args, context, info) => {


                    if (!resolveWithData) {
                        return entry.id;
                    }

                    //console.log("resolve: ", resolveWithData, source, context, info, args);

                    // This context gets the data from the context put into the <Query/> or Mutation...
                    //console.log("context: ", context);

                    const result = entry.setEntry(args, context, process.env.TABLE_NAME, complementedProps["isOffline"]);


                    //console.log("result: ", result);
                    return result;
                }
            };

            result[entry.getDeleteMutationName()] = {
                args: entry.createEntryArgs(),
                type: entry.createEntryType("delete_"),
                resolve: (source, args, context, info) => {


                    if (!resolveWithData) {
                        return entry.id;
                    }

                    //console.log("resolve: ", resolveWithData, source, context, info, args);

                    // This context gets the data from the context put into the <Query/> or Mutation...
                    //console.log("context: ", context);

                    const result = entry.deleteEntry(args, context, process.env.TABLE_NAME, complementedProps["isOffline"]);


                    //console.log("result: ", result);
                    return result;
                }
            };

            //console.log("mutation definition: ", result["set_"+entry.id]);

            return result;
        }, {}),

        queries: (resolveWithData: boolean) => entries.reduce((result, entry) => {
            
            const listType = entry.createEntryType("list_");
            const getType = entry.createEntryType("get_");
            //console.log("listType: ", listType);


            //console.log("dl-comp-props: ", complementedProps["isOffline"], datalayerProps["isOffline"])
            // list all the items, specifying the primaryKey
            const inputArgs = {};

            inputArgs[entry.primaryKey] = {name: entry.primaryKey, type: new GraphQLNonNull(GraphQLString)};

            result[entry.getPrimaryListQueryName()] = {
                args: inputArgs,
                type: resolveWithData ? new GraphQLList(listType) : listType,
                resolve: (source, args, context, info) => {


                    //console.log("resolve list: ", resolveWithData, source, args, context, complementedProps["isOffline"]);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.listEntries(args, context, process.env.TABLE_NAME, "pk", complementedProps["isOffline"]);
                }
            };


            // list all the items, specifying the RANGE

            const inputRangeArgs = {};
            inputRangeArgs[entry.rangeKey] = {name: entry.rangeKey, type: new GraphQLNonNull(GraphQLString)};

            result[entry.getRangeListQueryName()] = {
                args: inputRangeArgs,
                type: resolveWithData ? new GraphQLList(listType): listType,
                resolve: (source, args, context, info) => {

                    //console.log("resolve: ", resolveWithData, source, args, context, complementedProps["isOffline"]);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.listEntries(args, context, process.env.TABLE_NAME, "sk", complementedProps["isOffline"]);

                }
            };

            const inputArgsGet = {};

            if (entry.primaryKey) {
                inputArgsGet[entry.primaryKey] = {name: entry.primaryKey, type: new GraphQLNonNull(GraphQLString)};
            }

            if (entry.rangeKey) {
                inputArgsGet[entry.rangeKey] = {name: entry.rangeKey, type: new GraphQLNonNull(GraphQLString)};
            }

            result[entry.getGetQueryName()] = {
                args: inputArgsGet,
                type: getType,
                resolve: (source, args, context, info) => {


                    //console.log("resolve: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.getEntry(args, context, process.env.TABLE_NAME, complementedProps["isOffline"]);


                }
            };
            
            
            const scanRangeArgs = {};
            scanRangeArgs[`start_${entry.rangeKey}`] = {name: `start_${entry.rangeKey}`, type: new GraphQLNonNull(GraphQLString)};
            scanRangeArgs[`end_${entry.rangeKey}`] = {name: `end_${entry.rangeKey}`, type: new GraphQLNonNull(GraphQLString)};

            // scan the table
            result[entry.getRangeScanName()] = {
                args: scanRangeArgs,
                type: resolveWithData ? new GraphQLList(listType) : listType,
                resolve: (source, args, context, info) => {


                    //console.log("resolve scan: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.scan(args, context, process.env.TABLE_NAME, "sk", complementedProps["isOffline"]);


                }
            };

            const scanPrimaryArgs = {};
            scanPrimaryArgs[`start_${entry.primaryKey}`] = {name: `start_${entry.primaryKey}`, type: new GraphQLNonNull(GraphQLString)};
            scanPrimaryArgs[`end_${entry.primaryKey}`] = {name: `end_${entry.primaryKey}`, type: new GraphQLNonNull(GraphQLString)};

            // scan the table
            result[entry.getPrimaryScanName()] = {
                args: scanPrimaryArgs,
                type: resolveWithData ? new GraphQLList(listType) : listType,
                resolve: (source, args, context, info) => {


                    //console.log("resolve scan: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.scan(args, context, process.env.TABLE_NAME, "pk", complementedProps["isOffline"]);


                }
            };

            const scanAllArgs = {scanall: {name: "scanall", type: new GraphQLNonNull(GraphQLString)}};

            // scan the table
            result[entry.getScanName()] = {
                args: scanAllArgs,
                type: resolveWithData ? new GraphQLList(listType) : listType,
                resolve: (source, args, context, info) => {


                    //console.log("resolve scan: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.scan(args, context, process.env.TABLE_NAME, "pk", complementedProps["isOffline"]);


                }
            };


            return result;
        }, {}),

        /*
        getEntryDataFields: (entryId) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.createEntryFields()
            };

            console.warn("could not find entry: ",entryId);
            return {};
        },*/


        // TODO forward this request to the Entry and let the entry handle the whole request!
        getEntryListQuery: (entryId, dictKey) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.getEntryListQuery(dictKey)
            };

            console.warn("could not find entry: ",entryId);
            return {};

            /*
             const fields = datalayerProps.getEntryDataFields(entryId);
             //console.log("fields: ", fields);

             return getEntryListQuery(
                 entryId,
                 dictKey,
                 fields
             );*/
        },

        getEntryQuery: (entryId, dictKey) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.getEntryQuery(dictKey)
            };

            console.warn("could not find entry: ",entryId);
            return {};

        },

        getEntryScanQuery:  (entryId, dictKey) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.getEntryScanQuery(dictKey)
            };

            console.warn("could not find entry: ",entryId);
            return {};

        },


        setEntryMutation: (entryId, values) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.setEntryMutation(values)
            };

            console.warn("could not find entry: ", entryId);
            return {};
        },

        deleteEntryMutation: (entryId, values) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.deleteEntryMutation(values)
            };

            console.warn("could not find entry: ", entryId);
            return {};
        },

        updateEntryQuery: (entryId, fDictKey: (oldData) => any) => {

            return {
                entryId: entryId,
                getEntryQuery: () => datalayerProps.getEntryQuery(entryId, fDictKey({})),
                setEntryMutation: (oldData) => datalayerProps.setEntryMutation(entryId, fDictKey(oldData)),

            };

        },



        setClient: (client) => {
            complementedProps["client"] = client;
        },

        setOffline: (offline: boolean) => {
            complementedProps["isOffline"] = offline;
        }

    };

    const schemaProps = {
        getSchema: (resolveWithData: boolean) => new GraphQLSchema({
            query: new GraphQLObjectType({
                name: 'RootQueryType', // an arbitrary name
                fields: datalayerProps.queries(resolveWithData)
            }), mutation: new GraphQLObjectType({
                name: 'RootMutationType', // an arbitrary name
                fields: datalayerProps.mutations(resolveWithData)
            })
        })
    }

    // we need to provide the DataLayerId to webApps, these may be anywhere in the tree, not
    // only direct children. So rather than mapping the children, we need to change them
    findComponentRecursively(props.children, (child) => child.setDataLayerId !== undefined).forEach( child => {
        child.setDataLayerId(props.id)
    });

    findComponentRecursively(props.children, (child) => child.setStoreData !== undefined).forEach( child => {

        child.setStoreData(
            async function (pkEntity, pkVal, skEntity, skVal, jsonData) {
                return await setEntry(
                    process.env.TABLE_NAME, //"code-architect-dev-data-layer",
                    pkEntity, // schema.Entry.ENTITY, //pkEntity
                    pkVal, // pkId
                    skEntity, //schema.Data.ENTITY, // skEntity
                    skVal, // skId
                    jsonData, // jsonData
                    complementedProps["isOffline"]
                )
            }
        );

        child.setGetData(
            async function (pkEntity, pkVal, skEntity, skVal) {
                if (pkVal !== undefined) {
                    return await ddbGetEntry(
                        process.env.TABLE_NAME, //"code-architect-dev-data-layer",
                        pkEntity, // schema.Entry.ENTITY, //pkEntity
                        pkVal, // pkId
                        skEntity, //schema.Data.ENTITY, // skEntity
                        skVal, // skId
                        complementedProps["isOffline"]
                    )
                } else {
                    return ddbListEntries(
                        process.env.TABLE_NAME, //tableName
                        "sk", //key
                        skEntity, // entity
                        skVal, //value,
                        pkEntity, // rangeEntity
                        complementedProps["isOffline"]
                    )
                }


            }
        );
    });
    

    return Object.assign({}, props, componentProps, datalayerProps, schemaProps, complementedProps);

};