declare var require: any;

declare var __DATALAYER_ID__: any;


// this must be imported to allow async-functions within an AWS lambda environment
// see: https://github.com/babel/babel/issues/5085
import "@babel/polyfill";

import {
    graphql,
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLNonNull
}  from 'graphql';

import Types from '../types';
import { extractObject, INFRASTRUCTURE_MODES, loadConfigurationFromModule } from '../libs/loader';
import {findComponentRecursively} from "../libs/index";

//const awsServerlessExpress = require('aws-serverless-express');


/**
 * Handler-Function
 *
 * @param event of the http-request (POST). The event.body must be json-formatted and must contain
 * `query` as a GraphQl-Query object
 *
 * @param context
 * @param callback
 *
async function query (event, context, callback) {

    console.log("event: ", event);
    const parsedBody = JSON.parse(event.body);
    console.log("parsedBody: ", parsedBody);

    console.log("context: ", context);


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
     * /
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
            result => callback(null, {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                    "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
                },
                body: JSON.stringify(result)
            }),
            err => callback(err)
        );
}*/

import cookiesMiddleware from 'universal-cookie-express';

const query = () => {
    const express = require('express');
    //const graphqlHTTP = require('express-graphql');

    const app = express();

    // load the IsomorphicComponent
    // we must load it directly from the module here, to enable the aliad of the config_file_path
    const isoConfig = loadConfigurationFromModule(require('__CONFIG_FILE_PATH__'), INFRASTRUCTURE_MODES.RUNTIME);

    // let's extract it from the root configuration
    const dataLayer = extractObject(
        isoConfig,
        Types.INFRASTRUCTURE_TYPE_COMPONENT,
        __DATALAYER_ID__
    );


    app.use(cookiesMiddleware());

    /*
    app.use((req, res, next) => {

        console.log("this it the datalayer-mw: ", req);

        const { body} = req;
        console.log("body: ", body);
        return next();
    });*/

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
    /*app.use('/query', graphqlHTTP({
        schema: schema,
        graphiql: false
    }));*/

    app.use('/query', (req, res, next) => {
        console.log("I should not be called...", req)
    });

    return app;
}

export default function (event, context) {
    //return awsServerlessExpress.proxy(query(), event, context);
}

