/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 */
import { isIsomorphicApp } from './iso-component';
import { resolveAssetsPath, getStaticBucketName } from '../libs/iso-libs';
import * as deepmerge from 'deepmerge';
import { IConfigParseResult } from '../libs/config-parse-result';
import {IPlugin, forwardChildIamRoleStatements} from '../libs/plugin';
import { PARSER_MODES } from '../libs/parser';


/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IIsoPlugin {

    /**
     * one of the [[PARSER_MODES]]
     */
    parserMode: string,

    /**
     * path to a directory where we put the final bundles
     */
    buildPath: string,

    /**
     * path to the main config file
     */
    configFilePath: string
}

/**
 * A Plugin to detect Isomorphic-App-Components
 * @param props
 */
export const IsoPlugin = (props: IIsoPlugin): IPlugin => {

    //console.log("configFilePath: " , props.configFilePath);

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isIsomorphicApp(component);
        },

        // convert the component into configuration parts
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
    ): IConfigParseResult => {

            const path = require('path');

            // we use the hardcoded name `server` as name
            const serverName = "server";

            const serverBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);



            // the isomorphic app has a server application
            const serverWebPack = require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(
                require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createServerWebpackConfig(
                    "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "server.js"), //entryPath: string,
                    serverBuildPath, //use the buildpath from the parent plugin
                    serverName, // name of the server
                    {
                        __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle

                        // required of data-layer, makes the context match!
                        "infrastructure-components": path.join(
                            require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                            "node_modules", "infrastructure-components", "dist", "index.js"),

                        // required of the routed-app
                        "react-router-dom": path.join(
                            require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                            "node_modules", "react-router-dom"),

                        // required of the data-layer / apollo
                        "react-apollo": path.join(
                            require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                            "node_modules", "react-apollo"),
                    }, {
                        __ISOMORPHIC_ID__: `"${component.instanceId}"`,
                        __ASSETS_PATH__: `"${component.assetsPath}"`,
                        __DATALAYER_ID__: `"${component.dataLayerId}"`,
                        __ISOFFLINE__: props.parserMode === PARSER_MODES.MODE_START,
                        __RESOLVED_ASSETS_PATH__: `"${resolveAssetsPath(
                            component.buildPath,
                            serverName, 
                            component.assetsPath ) 
                        }"`

                        // TODO add replacements of datalayers here!
                    }
                ),
                props.parserMode === PARSER_MODES.MODE_DEPLOY //isProd
            );
            
            const domain = childConfigs.map(config => config.domain).reduce((result, domain) => result !== undefined ? result : domain, undefined);
            const certArn = childConfigs.map(config => config.certArn).reduce((result, certArn) => result !== undefined ? result : certArn, undefined);

            const environments = childConfigs.reduce((result, config) => (result !== undefined ? result : []).concat(config.environments !== undefined ? config.environments : []), []);

            // provide all client configs in a flat list
            const webpackConfigs: any = childConfigs.reduce((result, config) => result.concat(
                
                config.webpackConfigs.map(wp => wp({
                    // when we deploy an Isomorphic App without a domain, we need to add the stagename!
                    stagePath: props.parserMode === PARSER_MODES.MODE_DEPLOY &&
                        domain == undefined && 
                        environments !== undefined &&
                        environments.length > 0 ? environments[0].name : undefined
                }))
            ), []);

            const copyAssetsPostBuild = () => {
                //console.log("check for >>copyAssetsPostBuild<<");
                if (props.parserMode !== PARSER_MODES.MODE_DOMAIN && props.parserMode !== PARSER_MODES.MODE_DEPLOY) {
                    // always copy the assets, unless we setup the domain
                    console.log("copyAssetsPostBuild: now copy the assets!");

                    webpackConfigs.map(config => require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets( config.output.path, path.join(serverBuildPath, serverName, component.assetsPath)));

                } else {
                    // delete the assets folder for we don't want to include all these bundled files in the deployment-package
                    const rimraf = require("rimraf");
                    rimraf.sync(path.join(serverBuildPath, serverName, component.assetsPath));

                }
            };

            /*
            const postDeploy = async () => {
                console.log("check for >>postDeploy<<");
                
                if (props.parserMode === PARSER_MODES.MODE_DEPLOY) {
                    var endpointUrl = undefined;


                    var eps: any = {};

                    await require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").runSlsCmd("echo $(sls info)", data => {
                        //console.log("data: " , data);

                        eps = data.split(" ").reduce(({inSection, endpoints}, val, idx) => {
                            //console.log("eval: " , val);

                            if (inSection && val.indexOf("https://") > -1) {
                                return { inSection: true, endpoints: endpoints.concat(
                                    val.indexOf("{proxy+}") == -1 ? [val] : []
                                )}
                            }

                            if (val.startsWith("endpoints:")) {
                                return { inSection: true, endpoints: endpoints }
                            }

                            if (val.startsWith("functions:")) {
                                return { inSection: false, endpoints: endpoints }
                            }

                            return { inSection: inSection, endpoints: endpoints }

                        }, {inSection: false, endpoints: []});

                        //console.log("endpoints" , eps)

                    }, false);


                    const data = Object.assign({
                        proj: component.stackName,
                        envi: component.name,
                        domain: domain
                    }, eps.endpoints.length > 0 ? { endp: eps.endpoints[0]} : {});

                    await require('../libs/scripts-libs').fetchData("deploy", data);

                    if (eps.endpoints.length > 0) {
                        console.log("Your React-App is now available at: ", eps.endpoints[0])
                    }
                }

            }*/

            /*
            async function uploadAssetsPostBuild () {
                //console.log("check for >>copyAssetsPostBuild<<");
                if (props.parserMode === PARSER_MODES.MODE_DEPLOY) {
                    // always copy the assets, unless we setup the domain
                    console.log("uploadAssetsPostBuild: now copy the assets!");

                    const staticBucketName = getStaticBucketName(component.stackName, component.assetsPath, stage);

                    // copy the client apps to the assets-folder
                    console.log("start S3 Sync");

                    await Promise.all(
                        // only copy webapps
                        webpackConfigs.filter(wpConfig => wpConfig.target === "web").map(async wpConfig => {
                            await s3sync(component.region, staticBucketName, path.join(component.buildPath, wpConfig.name))
                        })
                    );

                    //webpackConfigs.map(config => require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets( config.output.path, path.join(serverBuildPath, serverName, component.assetsPath)));

                }
            };*/

            async function initDomain () {
                //console.log("check for >>initDomain<<");
                if (props.parserMode === PARSER_MODES.MODE_DOMAIN) {
                    console.log("initDomain!")
                    await require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").initDomain(component.stackName);
                }

            }

            

            const domainConfig = domain !== undefined ? {
                    plugins: ["serverless-domain-manager"],

                    custom: {
                        customDomain: {
                            domainName: domain,
                            basePath: "''",
                            stage: "${self:provider.stage, env:STAGE, 'dev'}",
                            createRoute53Record: true
                        }
                    }

                } : {};



            const additionalStatements: Array<any> = forwardChildIamRoleStatements(childConfigs).concat(
                component.iamRoleStatements ? component.iamRoleStatements : []
            );

            //console.log("additionalStatements: ", additionalStatements);

            const iamRoleAssignment = {
                functions: {}
            };

            iamRoleAssignment.functions[serverName] = {
                role: "IsomorphicAppLambdaRole"
            }


            const iamPermissions = {

                resources: {
                    Resources: {
                        IsomorphicAppLambdaRole: {
                            Type: "AWS::IAM::Role",

                            Properties: {
                                RoleName: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-IsomorphicAppLambdaRole",
                                AssumeRolePolicyDocument: {
                                    Version: '"2012-10-17"',
                                    Statement: [
                                        {
                                            Effect: "Allow",
                                            Principal: {
                                                Service: ["lambda.amazonaws.com"]
                                            },
                                            Action: "sts:AssumeRole"
                                        }
                                    ]
                                },
                                Policies: [
                                    {
                                        PolicyName: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-IsomorphicAppLambdaPolicy",
                                        PolicyDocument: {
                                            Version: '"2012-10-17"',
                                            Statement: [
                                                {
                                                    Effect: "Allow",
                                                    Action: [
                                                        '"logs:*"',
                                                        '"cloudwatch:*"'
                                                    ],
                                                    Resource: '"*"'
                                                }, {
                                                    Effect: "Allow",
                                                    Action: [
                                                        "s3:Get*",
                                                        "s3:List*",
                                                    ],
                                                    Resource: '"*"'
                                                },

                                            ].concat(additionalStatements)
                                        }
                                    }
                                ]
                            }
                        },
                    },
                }
            }

            return {
                stackType: "ISO",

                slsConfigs: deepmerge.all([
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").toSlsConfig(
                        component.stackName,
                        serverName,
                        component.buildPath,
                        component.assetsPath,
                        component.region),
                    
                    // # allows running the stack locally on the dev-machine
                    {
                        plugins: ["serverless-offline", "serverless-pseudo-parameters"],

                        custom: {

                            "serverless-offline": {
                                host: "0.0.0.0",
                                port: "${self:provider.port, env:PORT, '3000'}"
                            }
                        }

                    },

                    // add the domain config
                    domainConfig,

                    ...childConfigs.map(config => config.slsConfigs),

                    // add the IAM-Role-Statements
                    iamPermissions,

                    // assign the role
                    // assign the role
                    iamRoleAssignment

                ]),
                
                // add the server config 
                webpackConfigs: webpackConfigs.concat([serverWebPack]),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds),
                    [copyAssetsPostBuild, initDomain /*, postDeploy*/]),

                iamRoleStatements: [],

                environments: environments,

                stackName: component.stackName,

                assetsPath: component.assetsPath,

                buildPath: component.buildPath,

                region: component.region,

                domain: domain,

                certArn: certArn,

                supportOfflineStart: true,

                supportCreateDomain: true
            }
        }
    }

    return result;

};