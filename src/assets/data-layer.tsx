declare var require: any;

declare var __DATALAYER_ID__: any;


// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";
import AWS from 'aws-sdk';

import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull
}  from 'graphql';

import Types from '../types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';


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

/*
const dbSchema = {
    // in the datalayer-plugin.ts, we add this environment-variable, alternatively, we could replace it
    Table: process.env.TABLE_NAME !== undefined ? process.env.TABLE_NAME : "",
    Primary: {
        Key: 'pk',
        Range: 'sk'
    },
    // use the schema as per configuration
    ...require('../config/driver').schema

};*/


/**
 * Handler-Function
 *
 * @param event of the http-request (POST). The event.body must be json-formatted and must contain
 * `query` as a GraphQl-Query object
 *
 * @param context
 * @param callback
 */
async function query (event, context, callback) {

    const parsedBody = JSON.parse(event.body);
    console.log("parsedBody: ", parsedBody);

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    // let's extract it from the root configuration
    const dataLayer = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        __DATALAYER_ID__
    );

    /**
     * The schema specifies the queries that the user can run. It also connects to implementation of the DynamoDb-connection
     * through the resolve-functions!
     */
    const schema = new GraphQLSchema({
        query: new GraphQLObjectType({
            name: 'RootQueryType', // an arbitrary name
            fields: dataLayer.queries
        }), mutation: new GraphQLObjectType({
            name: 'RootMutationType', // an arbitrary name
            fields: dataLayer.mutations
        })
    });

    await graphql(schema, parsedBody.query)
        .then(
            result => callback(null, {statusCode: 200, body: JSON.stringify(result)}),
            err => callback(err)
        );
}

export default query;
