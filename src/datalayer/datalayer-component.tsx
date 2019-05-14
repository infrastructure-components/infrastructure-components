import * as React from 'react';


import {
    graphql,
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
import { setEntry, ddbListEntries } from './datalayer-libs';


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
     */
    getEntryDataFields: (entryId: string) => any
};


/**
 * identifies a component as a DataLayer
 *
 * @param component to be tested
 */
export function isDataLayer(component) {
    return component !== undefined && component.instanceType === DATALAYER_INSTANCE_TYPE
};

const createEntryFields = (entry) => {
    const fields = Object.keys(entry.data).reduce((result, key)=> {
        result[key] = {type: entry.data[key]};
        return result;
    }, {});

    fields[entry.primaryKey] = {type: GraphQLString};
    fields[entry.rangeKey] = {type: GraphQLString};

    return fields;
}

const createEntryType = (prefix, entry) => {
    return new GraphQLObjectType({
        name: prefix+entry.id,
        fields: () => createEntryFields(entry)
    })
};


const createKeyArgs = (entry) => {

    const args = {};

    args[entry.primaryKey] = {name: entry.primaryKey, type: GraphQLString};
    args[entry.rangeKey] = {name: entry.rangeKey, type: GraphQLString};

    return args;
};

/**
 * creates an argument list of all the data of the entry, keys+jsonData
 * @param entry
 * @returns {{}}
 */
const createEntryArgs = (entry) => {

    const args = Object.keys(entry.data).reduce((result, key)=> {
        result[key] = {name: key, type: GraphQLString};
        return result;
    }, {});

    args[entry.primaryKey] = {name: entry.primaryKey, type: GraphQLString};
    args[entry.rangeKey] = {name: entry.rangeKey, type: GraphQLString};
    
    return args;
};


export default (props: IDataLayerArgs | any) => {

    const componentProps: IInfrastructure & IComponent = {
        infrastructureType: Types.INFRASTRUCTURE_TYPE_COMPONENT,
        instanceType: DATALAYER_INSTANCE_TYPE,
        instanceId: props.id
    };

    //const listEntities = getChildrenArray(props).filter(child => isEntity(child));
    const entries = getChildrenArray(props).filter(child => isEntry(child));

    /**
     * create the
     * @type {{queries: {}, mutations: {}}}
     */
    const datalayerProps: IDataLayerProps = {

        mutations: entries.reduce((result, entry) => {

            result["set_"+entry.id] = {
                args: createEntryArgs(entry),
                type: createEntryType("set_", entry),
                resolve: (source, args, context, info) => {

                    console.log("resolve: ", source, args);

                    const result = setEntry(
                        process.env.TABLE_NAME, //"code-architect-dev-data-layer", 
                        entry.primaryKey, // schema.Entry.ENTITY, //pkEntity
                        args[entry.primaryKey], // pkId
                        entry.rangeKey, //schema.Data.ENTITY, // skEntity
                        args[entry.rangeKey], // skId
                        Object.keys(args).reduce((result, key) => {
                            if (Object.keys(entry.data).find(datakey => datakey === key) !== undefined) {
                                result[key] = args[key];
                            }
                            return result;
                        },{}) // jsonData
                    );

                    console.log("result: ", result);
                    return result;
                }
            };
            return result;
        }, {}),

        queries: entries.reduce((result, entry) => {

            const listType = createEntryType("list_", entry);
            console.log("listType: ", listType);


            // list all the items, specifying the primaryKey
            const inputArgs = {};
            inputArgs[entry.primaryKey] = {name: entry.primaryKey, type: new GraphQLNonNull(GraphQLString)};

            result["list_"+entry.id+"_"+entry.primaryKey] = {
                args: inputArgs,
                type: new GraphQLList(listType),
                resolve: (source, args, context, info) => {

                    console.log("resolve: ", source, args);

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

                    });

                }
            };


            // list all the items, specifying the RANGE

            const inputRangeArgs = {};
            inputRangeArgs[entry.rangeKey] = {name: entry.rangeKey, type: new GraphQLNonNull(GraphQLString)};

            result["list_"+entry.id+"_"+entry.rangeKey] = {
                args: inputRangeArgs,
                type: new GraphQLList(listType),
                resolve: (source, args, context, info) => {

                    console.log("resolve: ", source, args);

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

                    });
                }
            };


            return result;
        }, {}),

        getEntryDataFields: (entryId) => {
            const entry = entries.find(entry => entry.id === entryId);
            if (entry !== undefined) {
                return createEntryFields(entry)
            };

            console.warn("could not find entry: ",entryId);
            return {};
        }

    };

    // we need to provide the DataLayerId to webApps, these may be anywhere in the tree, not
    // only direct children. So rather than mapping the children, we need to change them
    findComponentRecursively(props.children, (child) => child.setDataLayerId !== undefined).forEach( child => {
        child.setDataLayerId(props.id)
    });

    findComponentRecursively(props.children, (child) => child.setStoreData !== undefined).forEach( child => {
        child.setStoreData(
            (pkEntity, pkVal, skEntity, skVal, jsonData) => setEntry(
                process.env.TABLE_NAME, //"code-architect-dev-data-layer",
                pkEntity, // schema.Entry.ENTITY, //pkEntity
                pkVal, // pkId
                skEntity, //schema.Data.ENTITY, // skEntity
                skVal, // skId
                jsonData // jsonData
            )
        )
    });
    

    return Object.assign(props, componentProps, datalayerProps);

};