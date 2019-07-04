/**
 * Created by frank.zickert on 02.05.19.
 */

import AWS from 'aws-sdk';
import gql from 'graphql-tag';
import Cookies from 'universal-cookie';

/**
 * transforms a function into a Promise
 */
const promisify = foo => new Promise((resolve, reject) => {
    foo((error, result) => {
        if(error) {
            reject(error)
        } else {
            resolve(result)
        }
    })
});

export const setEntry = (tableName, pkEntity, pkId, skEntity, skId, jsonData) => {

    console.log("setEntry: ", pkEntity, "|", pkId, "|", skEntity, "|", skId );

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().update({
            TableName: tableName,
            /**
             * ALL KEYS MUST BE SPECIFIED HERE!
             */
            Key: {
                pk: `${pkEntity}|${pkId}`,
                sk: `${skEntity}|${skId}`
            },
            UpdateExpression: `SET jsonData = :jsonData`,
            ExpressionAttributeValues: {
                ':jsonData': `${JSON.stringify(jsonData)}`,
            }
        }, callback))
        .then(() => {
            //console.log("data stored!")

            var result = {};
            result[pkEntity] = pkId;
            result[skEntity] = skId;
            result["data"] = `${JSON.stringify(jsonData).replace(/"/g, "\\\"")}`;

            return result;
        }).catch(error => { console.log(error) });
};


/**
 * Get all entries to a entity|value pair in the key-field whose range have the specified rangeEntity
 *
 * @param key specify which field is the key: pk or sk
 * @param entity specifies the entity of the key-field
 * @param value specify the id of the key-field
 * @param rangeEntity specify the entity of the range
 * @returns {Promise<string>|any}
 */
export const ddbListEntries = (tableName, key, entity, value, rangeEntity) => {

    console.log("ddbListEntries: ", tableName, key, entity, value, rangeEntity);

    const q = {
        // use the table_name as specified in the serverless.yml
        TableName: tableName,
        IndexName: key === "sk" ? "reverse" : undefined,
        /**
         * ALL KEYS MUST HAVE KEY-CONDITION-EXPRESSIONS!
         */
        KeyConditionExpression: `${
            key
            } = :value and begins_with(${
            key === "pk" ? "sk" : "pk"
            }, :entity)`,
        ExpressionAttributeValues: {
            ":value": `${entity}|${value}`,
            ":entity": rangeEntity
        }
    };

    //console.log("query: ", q);

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().query(q, callback))
        .then(result => {
            console.log("ddb-result: ", result);
            return result["Items"];

            /*
             if (result.Items) {

             return result.Items.map(item => JSON.stringify(item));
             }

             return [];*/
            //return result.Items.map(item => JSON.stringify(item));
        }).catch(error => { console.log(error) });
};

export const ddbGetEntry = (tableName, pkEntity, pkValue, skEntity, skValue) => {

    console.log("ddbGetEntry: ", `${pkEntity}|${pkValue}`, ` -- ${skEntity}|${skValue}`, " -- ", tableName);

    const q = {
        TableName: tableName,
        Key: {
            pk: `${pkEntity}|${pkValue}`,
            sk: `${skEntity}|${skValue}`
        }
    };

    console.log("ddbGetEntry-query: ", q);

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().get(q, callback))
        .then(result => {
            console.log("ddbGetEntry result: ", result);

            return result["Item"] ? result["Item"] : result;

        }).catch(error => { console.log(error) });
};


export const deleteEntry = (tableName, pkEntity, pkValue, skEntity, skValue) => {

    console.log("delete entry: ", pkEntity, pkValue, skEntity, skValue)
    //console.log("pk: ", `${pkEntity}|${pkValue}`);
    //console.log("sk: ", `${skEntity}|${skValue}`);

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().delete({
            // use the table_name as specified in the serverless.yml
            TableName: tableName,
            Key: {
                pk: `${pkEntity}|${pkValue}`,
                sk: `${skEntity}|${skValue}`
            }
        }, callback))
        .then(result => {
            //console.log("result: ", result);

            return result["Item"] ? result["Item"] : result;

        }).catch(error => { console.log(error) });
};

import { mutation, params, types, query } from 'typed-graphqlify'
import {IC_USER_ID} from "../authentication/auth-middleware";



/**
 * this function provides a executable graphql-query
 * TODO the fields must be taken from the data-layer, not requiring the user to provide them
 */
export const setEntryMutation = ( entryId, data, fields, context={}) => {
    console.log("setEntryMutation: ", entryId, data, fields);


    const mutationObj = {};
    mutationObj[`set_${entryId}`] = params(
        Object.keys(data).reduce((result, key) => {
            result[key] = `"${data[key]}"`;
            return result;
        },{}),
        Object.keys(fields).reduce((result, key) => {
            result[key] = types.string;
            return result;
        },{})
    );

    return {
        mutation: gql`${mutation(mutationObj)}`,
        context: context
    }

};


export const deleteEntryMutation = ( entryId, data, fields, context={}) => {
    console.log("deleteEntryMutation: ", entryId, data);

    const mutationObj = {};
    mutationObj[`delete_${entryId}`] = params(
        Object.keys(data).reduce((result, key) => {
            result[key] = `"${data[key]}"`;
            return result;
        },{}),
        Object.keys(fields).reduce((result, key) => {
            result[key] = types.string;
            return result;
        },{})
    );

    return {
        mutation: gql`${mutation(mutationObj)}`,
        context: context
    }

};


/**
 * this function provides a executable graphql-query
 * TODO the fields must be taken from the data-layer, not requiring the user to provide them
 */
export const getEntryListQuery = ( entryId, data, fields, context={}) => {
    console.log("getEntryListQuery: ", entryId, data, fields, context);

    

    if (data == undefined) {
        console.error("getEntryListQuery requires a data argument");
        return undefined;
    }



    if (Object.keys(data).length !== 1) {
        console.error("getEntryListQuery requires exact 1 field provided in the data argument");
        return undefined;
    }

    const queryKey = Object.keys(data)[0];

    const queryObj = {};
    queryObj[`list_${entryId}_${queryKey}`] = params(
        Object.keys(data).filter(key => key === queryKey).reduce((result, key) => {
            result[key] = `"${data[key]}"`;
            return result;
        },{}),
        Object.keys(fields).reduce((result, key) => {
            result[key] = types.string;
            return result;
        },{})
    );

    //console.log("listQuery string: ", query(queryObj));

    return {
        query:gql`${query(queryObj)}`,
        context: context
    }
    
};

export const getEntryQuery = ( entryId, data, fields, context={}) => {
    console.log("getEntryQuery: ", entryId, data, fields, context);

    if (data == undefined) {
        console.error("getEntryQuery requires a data argument");
        return undefined;
    }

    if (Object.keys(data).length !== 2) {
        console.error("getEntryQuery requires exact 2 fields provided in the data argument");
        return undefined;
    }

    const queryObj = {};
    queryObj[`get_${entryId}`] = params(
        Object.keys(data).reduce((result, key) => {
            result[key] = `"${data[key]}"`;
            return result;
        },{}),
        Object.keys(fields).reduce((result, key) => {
            result[key] = types.string;
            return result;
        },{})
    );

    //console.log("listQuery string: ", query(queryObj));

    return {
        query:gql`${query(queryObj)}`,
        context: context
    }

};

export async function select (client, {query, context={}})  {


    if (!context["userId"]) {
        context["userId"] = new Cookies().get(IC_USER_ID);
    }

    //console.log("select: ", query, context);

    
    return await client.query({
        query: query,
        context: context
    }).then(result => {
        //console.log("select result: ", result)

        return result.data;

    }).catch(error => {
        console.log(error);
    });

};



/**
 * uses this: https://github.com/acro5piano/typed-graphqlify
 *
 * TODO generalize to other data-types than string
 *
 * @param client
 * @param entryId
 * @param data
 * @returns {any|Promise<T>|Promise<U>}
 */
export async function mutate (client, { mutation, context={}}) {

    if (!context["userId"]) {
        context["userId"] = new Cookies().get(IC_USER_ID);
    }


    console.log("mutate: ", mutation, context);

    //console.log("mutation string: ", mutation(mutationObj));

    return await client.mutate({
        mutation: mutation,
        context: context
    }).then(result => { console.log(result)}).catch(error => { console.log(error) });

};

