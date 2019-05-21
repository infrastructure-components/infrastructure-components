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
import { setEntry, ddbListEntries, getEntryListQuery } from './datalayer-libs';

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

    setEntryMutation: (entryId: string, values: any ) => any,

    getSchema?: any // optional only because it is implemented in a separate object below. but it is required!

    entries: any,

    /**
     * The Apollo-Client: used at server-side only! Used to provide the Apollo-Client to middlewares
     */
    client?: any
    setClient: (client: any) => void
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

                    console.log("resolve: ", resolveWithData, source, context, info, args);

                    // This context gets the data from the context put into the <Query/> or Mutation...
                    console.log("context: ", context);

                    const result = entry.setEntry(args, context, process.env.TABLE_NAME);


                    console.log("result: ", result);
                    return result;
                }
            };

            console.log("mutation definition: ", result["set_"+entry.id]);

            return result;
        }, {}),

        queries: (resolveWithData: boolean) => entries.reduce((result, entry) => {
            
            const listType = entry.createEntryType("list_");
            console.log("listType: ", listType);


            // list all the items, specifying the primaryKey
            const inputArgs = {};
            inputArgs[entry.primaryKey] = {name: entry.primaryKey, type: new GraphQLNonNull(GraphQLString)};

            result[entry.getPrimaryListQueryName()] = {
                args: inputArgs,
                type: resolveWithData ? new GraphQLList(listType) : listType,
                resolve: (source, args, context, info) => {


                    console.log("resolve: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.listEntries(args, context, process.env.TABLE_NAME, "pk");

                    /*
                    return ddbListEntries(
                        process.env.TABLE_NAME, //tablename
                        "pk", // key
                        entry.primaryKey, //entity
                        args[entry.primaryKey], //value
                        entry.rangeKey //rangeEntity
                    ).then(results => {

                        console.log("promised: ", results);
                        return results.map(item => {
                            const data = item.jsonData !== undefined ? JSON.parse(item.jsonData) : {};
                            data[entry.primaryKey] = item.pk.substring(item.pk.indexOf("|")+1);
                            data[entry.rangeKey] = item.sk.substring(item.sk.indexOf("|")+1);
                            return data;
                        });

                    });*/

                }
            };


            // list all the items, specifying the RANGE

            const inputRangeArgs = {};
            inputRangeArgs[entry.rangeKey] = {name: entry.rangeKey, type: new GraphQLNonNull(GraphQLString)};

            result[entry.getRangeListQueryName()] = {
                args: inputRangeArgs,
                type: resolveWithData ? new GraphQLList(listType): listType,
                resolve: (source, args, context, info) => {

                    console.log("resolve: ", resolveWithData, source, args, context);

                    if (!resolveWithData) {
                        return entry.id;
                    }

                    return entry.listEntries(args, context, process.env.TABLE_NAME, "sk");

                    /*
                    return ddbListEntries(
                        process.env.TABLE_NAME, //tablename
                        "sk", // key
                        entry.rangeKey, //entity
                        args[entry.rangeKey], //value
                        entry.primaryKey //rangeEntity
                    ).then(results => {

                        console.log("promised: ", results);
                        return results.map(item => {
                            const data = item.jsonData !== undefined ? JSON.parse(item.jsonData) : {};
                            data[entry.primaryKey] = item.pk.substring(item.pk.indexOf("|")+1);
                            data[entry.rangeKey] = item.sk.substring(item.sk.indexOf("|")+1);
                            return data;
                        });

                    });*/
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

        setEntryMutation: (entryId, values) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return entry.setEntryMutation(values)
            };

            console.warn("could not find entry: ", entryId);
            return {};
        },



        setClient: (client) => {
            console.log("set apollo client: ", client);
            complementedProps["client"] = client;
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
                    jsonData // jsonData
                )
            }
        );
    });
    

    return Object.assign({}, props, componentProps, datalayerProps, schemaProps, complementedProps);

};