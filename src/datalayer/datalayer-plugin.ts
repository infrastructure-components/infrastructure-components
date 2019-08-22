/**
 * This plugin adds the following libraries to the requirements:
 * 
 * - GraphQL: npm install --save apollo-client apollo-cache-inmemory apollo-link-http graphql-tag graphql
 * - React Apollo: npm install --save react-apollo
 * //- isomorphic-fetch: npm install --save isomorphic-fetch es6-promise
 * - AWS SDK: npm install --save aws-sdk
 * 
 * 
 */



import { IConfigParseResult } from '../libs/config-parse-result';
import {
    IPlugin, forwardChildWebpackConfigs, forwardChildPostBuilds, forwardChildIamRoleStatements
} from '../libs/plugin';
import { isDataLayer } from './datalayer-component'
import * as deepmerge from 'deepmerge';
import {PARSER_MODES} from "../libs/parser";

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 *
 * The DataLayer is supported by:
 * - `IsomorphicApp`
 */
export interface IDataLayerPlugin {
    /**
     * path to a directory where we put the final bundles
     */
    buildPath: string,

    /**
     * path to the main config file
     */
    configFilePath: string,
}

/**
 * The Data
 *
 * @param props
 */
export const DataLayerPlugin = (props: IDataLayerPlugin): IPlugin => {
    const path = require('path');

    const result: IPlugin = {
        applies: (component):boolean => {

            return isDataLayer(component);
        },

        // convert the component into configuration parts
        // while the component is of Type `any`, its props must be of type `IDataLayerArgs` | `IDataLayerProps`
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
        ):IConfigParseResult => {

            // the datalayer has a (query) server application
            const queryWebPack = (args) => require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(
                require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createServerWebpackConfig(
                    "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "data-layer.js"), //entryPath: string,
                    path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath), //use the buildpath from the parent plugin
                    component.id, // name of the server

                    // aliasesDict
                    {
                        __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle

                        
                    },

                    // replacementsDict
                    {
                        __DATALAYER_ID__: `"${component.id}"`
                        /*,
                        __ASSETS_PATH__: `"${component.assetsPath}"`,
                        __RESOLVED_ASSETS_PATH__: `"${resolveAssetsPath(
                            component.buildPath,
                            serverName,
                            component.assetsPath )
                            }"`*/
                    }
                )
            );

            /**
             * setup a database and a handler
             */
            const dataLayerConfig = {
                /*functions: {

                    /*
                    query: {
                        // index.default refers to the default export of the file, points to the output of the queryWebpack-bundle
                        handler: path.join(props.buildPath, component.id, `${component.id}.default`),
                        role: "DataLayerLambdaRole",
                        events: [
                            {
                                http: {
                                    //this path must match the path specified in the environment below
                                    path: "query",

                                    // the Apollo Api usually works via POST, mutations always use POST
                                    method: "POST",

                                    cors: "true"
                                }
                            },
                        ]
                    }

                },*/

                plugins: ["serverless-dynamodb-local"],

                /* see: https://www.npmjs.com/package/serverless-dynamodb-local */
                custom: {
                    "dynamodb": {
                        stages: ["dev", ],
                        start: {
                            port: 8000,
                            inMemory: "true",
                            heapInitial: "200m",
                            heapMax: "1g",
                            migrate: "true",
                            //seed: "true",
                            convertEmptyValues: "true",
                            //cors: ['localhost:3000', 'localhost:3001']
                        },
                    }
                },

                provider: {
                    environment: {
                        // set the table name in an environment variable
                        TABLE_NAME: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-data-layer",

                        // must match the http-path from the function-event
                        GRAPHQL_PATH: "query"
                    }
                },

                resources: {
                    Resources: {
                        ApplicationDynamoDBTable: {
                            Type: "AWS::DynamoDB::Table",
                            Properties: {
                                TableName: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-data-layer",
                                BillingMode: "PAY_PER_REQUEST",
                                AttributeDefinitions: [
                                    {
                                        AttributeName: "pk",
                                        AttributeType: "S"
                                    }, {
                                        AttributeName: "sk",
                                        AttributeType: "S"
                                    }
                                ],
                                KeySchema: [
                                    {
                                        AttributeName: "pk",
                                        KeyType: "HASH"
                                    }, {
                                        AttributeName: "sk",
                                        KeyType: "RANGE"
                                    }
                                ],
                                GlobalSecondaryIndexes: [
                                    {
                                        IndexName: "reverse",
                                        KeySchema: [
                                            {
                                                AttributeName: "sk",
                                                KeyType: "HASH"
                                            }, {
                                                AttributeName: "pk",
                                                KeyType: "RANGE"
                                            }
                                        ],
                                        Projection: {
                                            ProjectionType: "ALL"
                                        }

                                    }
                                ]
                            }
                        }
                    }
                }
            };


            const iamRoleStatements = [
                    {
                        Effect: "Allow",
                        Action: [
                            "dynamodb:GetItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:PutItem",
                            "dynamodb:Scan",
                            "dynamodb:Query"
                        ],
                        Resource: [
                            '"arn:aws:dynamodb:${self:provider.region}:*:table/${self:service}-${self:provider.stage, env:STAGE, \'dev\'}-data-layer"',
                            '"arn:aws:dynamodb:${self:provider.region}:*:table/${self:service}-${self:provider.stage, env:STAGE, \'dev\'}-data-layer/*"'
                        ]
                    }
                ].concat(forwardChildIamRoleStatements(childConfigs));


            //console.log("datalayer iamStatements: ", iamRoleStatements);


            return {
                slsConfigs: deepmerge.all([
                    dataLayerConfig
                ].concat(childConfigs.map(config => config.slsConfigs))),

                // forward the webpacks (of the WebApps) as-is, add the queryApp-Webpack-bundle
                webpackConfigs: /*[queryWebPack].concat(*/forwardChildWebpackConfigs(childConfigs).map(
                    // complement the args with the datalayer-id
                    fWp => (args) => fWp(Object.assign({ datalayerid : component.id}, args))
                )/*)*/,

                postBuilds: forwardChildPostBuilds(childConfigs),

                iamRoleStatements: iamRoleStatements


            }
        }
    };


    return result;

};