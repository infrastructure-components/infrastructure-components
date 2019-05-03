/**
 * Created by frank.zickert on 02.05.19.
 */

import AWS from 'aws-sdk';


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

    console.log("setEntry: ", pkEntity, "/", pkId);

    promisify(callback =>
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
            var result = {};
            result[pkEntity] = pkId;
            result[skEntity] = skId;

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
export const listEntries = (tableName, key, entity, value, rangeEntity) => {

    console.log("listEntries: ", tableName, key, entity, value, rangeEntity);

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().query({
            // use the table_name as specified in the serverless.yml
            TableName: tableName,
            IndexName: key == "sk" ? "reverse" : undefined,
            /**
             * ALL KEYS MUST HAVE KEY-CONDITION-EXPRESSIONS!
             */
            KeyConditionExpression: `${
                key
                } = :value and begins_with(${
                key == "pk" ? "sk" : "pk"
                }, :entity)`,
            ExpressionAttributeValues: {
                ":value": `${entity}|${value}`,
                ":entity": rangeEntity
            }
        }, callback))
        .then(result => {
            console.log("result: ", result);
            return result["Items"];

            /*
             if (result.Items) {

             return result.Items.map(item => JSON.stringify(item));
             }

             return [];*/
            //return result.Items.map(item => JSON.stringify(item));
        }).catch(error => { console.log(error) });
};

export const getEntry = (tableName, pkEntity, pkValue, skEntity, skValue) => {

    console.log("pk: ", `${pkEntity}|${pkValue}`);
    console.log("sk: ", `${skEntity}|${skValue}`);

    return promisify(callback =>
        new AWS.DynamoDB.DocumentClient().get({
            // use the table_name as specified in the serverless.yml
            TableName: tableName,
            Key: {
                pk: `${pkEntity}|${pkValue}`,
                sk: `${skEntity}|${skValue}`
            }
        }, callback))
        .then(result => {
            console.log("result: ", result);

            return result["Item"] ? result["Item"] : result;

        }).catch(error => { console.log(error) });
};
