/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 *
 * NOTE, we Ignore the infrastructure-scripts libraries when bundling, so these can be used ...
 * We also put fs to empty! If you need other libs, add them to `node: { fs: empty }`
 */
import { isServiceOrientedApp } from './soa-component';
import { resolveAssetsPath } from '../libs/iso-libs';
import * as deepmerge from 'deepmerge';
import { IConfigParseResult } from '../libs/config-parse-result';
import {IPlugin, forwardChildIamRoleStatements} from '../libs/plugin';
import { PARSER_MODES } from '../libs/parser';

import extractDomain from 'extract-domain';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface ISoaPlugin {

    /**
     * the stage is the environment to apply
     */
    stage: string,

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
 * A Plugin to detect SinglePage-App-Components
 * @param props
 */
export const SoaPlugin = (props: ISoaPlugin): IPlugin => {

    //console.log("configFilePath: " , props.configFilePath);

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isServiceOrientedApp(component);
        },

        // convert the component into configuration parts
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
    ): IConfigParseResult => {

            console.log("services: ", component.services);
            const path = require('path');

            // we use the hardcoded name `server` as name
            const serverName = "server";

            const serverBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);



            // the service-oriented app has a server application
            const serverWebPack = require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").complementWebpackConfig(
                require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs").createServerWebpackConfig(
                    "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "soa-server.js"), //entryPath: string,
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
                        __SERVICEORIENTED_ID__: `"${component.instanceId}"`,
                        __ISOFFLINE__: props.parserMode === PARSER_MODES.MODE_START,
                        //__ASSETS_PATH__: `"${component.assetsPath}"`,
                        __DATALAYER_ID__: `"${component.dataLayerId}"`,

                        /*__RESOLVED_ASSETS_PATH__: `"${resolveAssetsPath(
                            component.buildPath,
                            serverName,
                            component.assetsPath )
                            }"`*/

                        // TODO add replacements of datalayers here!
                    },
                ),
                props.parserMode === PARSER_MODES.MODE_DEPLOY //isProd
            );

            
            const webappBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);

            const soaWebPack = require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs")
                .complementWebpackConfig(require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs")
                    .createClientWebpackConfig(
                        "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "soa.js"), //entryPath: string,
                        path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath), //use the buildpath from the parent plugin
                        component.id, //appName
                        undefined, //assetsPath
                        undefined, // stagePath: TODO take from Environment!
                        {
                            __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle
                            
                            // required of the routed-app
                            "react-router-dom": path.join(
                                require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                                "node_modules", "react-router-dom"),

                            // required of the data-layer / apollo
                            "react-apollo": path.join(
                                require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                                "node_modules", "react-apollo"),
                        }, {
                        }
                    ),
                    props.parserMode === PARSER_MODES.MODE_DEPLOY //isProd
                );
            

            // provide all client configs in a flat list
            const webpackConfigs: any = childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []);

            const copyAssetsPostBuild = () => {
                //console.log("check for >>copyAssetsPostBuild<<");
             /*   if (props.parserMode !== PARSER_MODES.MODE_DOMAIN && props.parserMode !== PARSER_MODES.MODE_DEPLOY) {
                    // always copy the assets, unless we setup the domain
                    console.log("copyAssetsPostBuild: now copy the assets!");

                    webpackConfigs.map(config => require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").copyAssets( config.output.path, path.join(serverBuildPath, serverName, component.assetsPath)));

                } else {
                    // delete the assets folder for we don't want to include all these bundled files in the deployment-package
                    const rimraf = require("rimraf");
                    rimraf.sync(path.join(serverBuildPath, serverName, component.assetsPath));

                }
                */
            };

            const environments = childConfigs.reduce((result, config) => (result !== undefined ? result : []).concat(config.environments !== undefined ? config.environments : []), []);

            // check whether we already created the domain of this environment
            const deployedDomain = process.env[`DOMAIN_${props.stage}`] !== undefined;


            const domain = childConfigs.map(config => config.domain).reduce((result, domain) => result !== undefined ? result : domain, undefined);
            const certArn = childConfigs.map(config => config.certArn).reduce((result, certArn) => result !== undefined ? result : certArn, undefined);


            const stagePath = props.parserMode === PARSER_MODES.MODE_DEPLOY &&
                domain == undefined &&
                environments !== undefined &&
                environments.length > 0 ? environments[0].name : undefined;

            const createHtml = ( { serviceEndpoints }) => {

                //console.log("check for >>copyAssetsPostBuild<<");
                //if (props.parserMode == PARSER_MODES.MODE_BUILD) {
                console.log("write the index.html!");
                console.log("serviceEndpoints: ", serviceEndpoints);


                // we need to get rid of the path of the endpoint
                const servicePath = serviceEndpoints && serviceEndpoints.length > 0 ? (
                    stagePath ?
                        // when we have a stagePath, we can remove anything behind it
                        serviceEndpoints[0].substr(0, serviceEndpoints[0].indexOf(stagePath)+stagePath.length) :
                        // when we don't have a stagePath - TODO
                        serviceEndpoints[0]
                ) : undefined;


                
                console.log ("servicePath: " , servicePath);


                // TODO this should not be hard-coded
                const graphqlUrl = component.dataLayerId ? (
                    props.parserMode === PARSER_MODES.MODE_START ? "http://localhost:3001/query" : servicePath+"/query"
                ) : undefined;

                //region: 'localhost',
                //endpoint: 'http://localhost:8000',

                require('fs').writeFileSync(path.join(webappBuildPath, component.stackName, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${component.stackName}</title>
    <style>
            body {
                display: block;
                margin: 0px;
            }
         </style>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script>
        ${graphqlUrl !== undefined ? `window.__GRAPHQL__ ="${graphqlUrl}"` : ""};
        ${servicePath !== undefined ? `window.__BASENAME__ ="${servicePath}"` : ""};
    </script>
    <script src="${component.stackName}.bundle.js"></script>
  </body>
</html>`);



            };




            const invalidateCloudFrontCache = () => {
                if (deployedDomain && props.parserMode === PARSER_MODES.MODE_DEPLOY) {
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").invalidateCloudFrontCache(domain);
                }
            }

            const hostedZoneName = domain !== undefined ? extractDomain(domain.toString()) : {};


            /** post build function to write to the .env file that the domain has been deployed */
            const writeDomainEnv = () => {
                //console.log("check for >>writeDomainEnv<<");

                // we only write to the .env file when we are in domain mode, i.e. this script creates the domain
                // and we did not yet deployed the domain previously
                if (!deployedDomain && props.parserMode === PARSER_MODES.MODE_DOMAIN) {
                    require('fs').appendFileSync(
                        path.join(
                            require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(),
                            ".env"),
                        `\nDOMAIN_${props.stage}=TRUE`
                    );
                }
            };

            /*
            const postDeploy = async () => {
                //console.log("check for >>showStaticPageName<<");
                if (props.parserMode === PARSER_MODES.MODE_DEPLOY) {


                    await require('../libs/scripts-libs').fetchData("deploy", {
                        proj: component.stackName,
                        envi: props.stage,
                        domain: domain,
                        endp: `http://${component.stackName}-${props.stage}.s3-website-${component.region}.amazonaws.com`
                    });

                    console.log(`Your SinglePageApp is now available at: http://${component.stackName}-${props.stage}.s3-website-${component.region}.amazonaws.com`);
                }

                
            };*/

            async function deployWithDomain() {
                // start the sls-config
                if (props.parserMode === PARSER_MODES.MODE_DOMAIN) {
                    await require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").deploySls(component.stackName);
                }
            }

            const additionalStatements: Array<any> = forwardChildIamRoleStatements(childConfigs).concat(
                component.iamRoleStatements ? component.iamRoleStatements : []
            );

            const iamRoleAssignment = {
                functions: {}
            };

            iamRoleAssignment.functions[serverName] = {
                role: "ServiceOrientedAppLambdaRole"
            }


            const iamPermissions = {

                resources: {
                    Resources: {
                        ServiceOrientedAppLambdaRole: {
                            Type: "AWS::IAM::Role",

                            Properties: {
                                RoleName: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-ServiceOrientedAppLambdaRole",
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
                                        PolicyName: "${self:service}-${self:provider.stage, env:STAGE, 'dev'}-ServiceOrientedAppLambdaPolicy",
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
                                                        "s3:Put*"
                                                    ],
                                                    Resource: {
                                                        "Fn::Join": '["", ["arn:aws:s3:::", {"Ref": "StaticBucket" }, "/*"]]'
                                                    }
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

            // TODO this should rather be put into DataLayer-Plugin!!!
            const dataLayerService = component.dataLayerId !== undefined ? [{
                method: "ANY",
                path: "query"
            }] : [];

            /**
             * ONLY add the domain config if we are in domain mode!
             * TODO once the domain has been added, we need to add this with every deployment
             */
            const domainConfig = (props.parserMode === PARSER_MODES.MODE_DOMAIN || deployedDomain) &&
                    domain !== undefined && certArn !== undefined ? {

                // required of the SPA-domain-alias
                provider: {
                    customDomainName: domain,
                    hostedZoneName: hostedZoneName,
                    certArn: certArn
                },

                resources: {
                    Resources: {
                        WebAppCloudFrontDistribution: {
                            Type: "AWS::CloudFront::Distribution",
                            Properties: {
                                DistributionConfig: {
                                    Origins: [
                                        {
                                            DomainName: "${self:provider.staticBucket}.s3.amazonaws.com",
                                            Id: component.stackName,
                                            CustomOriginConfig: {
                                                HTTPPort: 80,
                                                HTTPSPort: 443,
                                                OriginProtocolPolicy: "https-only",
                                            }
                                        }
                                    ],
                                    Enabled: "'true'",

                                    DefaultRootObject: "index.html",
                                    CustomErrorResponses: [{
                                        ErrorCode: 404,
                                        ResponseCode: 200,
                                        ResponsePagePath: "/index.html"
                                    }],

                                    DefaultCacheBehavior: {
                                        AllowedMethods: [
                                            "DELETE",
                                            "GET",
                                            "HEAD",
                                            "OPTIONS",
                                            "PATCH",
                                            "POST",
                                            "PUT"
                                        ],
                                        TargetOriginId: component.stackName,
                                        ForwardedValues: {
                                            QueryString: "'false'",
                                            Cookies: {
                                                Forward: "none"
                                            }
                                        },
                                        ViewerProtocolPolicy: "redirect-to-https"
                                    },
                                    ViewerCertificate: {
                                        AcmCertificateArn: "${self:provider.certArn}",
                                        SslSupportMethod: "sni-only",
                                    },
                                    Aliases: ["${self:provider.customDomainName}"]

                                }
                            }
                        },

                        DnsRecord: {
                            Type: "AWS::Route53::RecordSet",
                            Properties: {
                                AliasTarget: {
                                    DNSName: "!GetAtt WebAppCloudFrontDistribution.DomainName",
                                    HostedZoneId: "Z2FDTNDATAQYW2"
                                },
                                HostedZoneName: "${self:provider.hostedZoneName}.",
                                Name: "${self:provider.customDomainName}.",
                                Type: "'A'"
                            }
                        }
                    },
                    Outputs: {
                        WebAppCloudFrontDistributionOutput: {
                            Value: {
                                "Fn::GetAtt": "[ WebAppCloudFrontDistribution, DomainName ]"
                            }
                        }
                    }
                }

            } : {};

            const envS3Config = {
                provider: {
                    environment: {
                        BUCKET_ID: "${self:provider.staticBucket}",
                    }
                }
            };

            return {
                stackType: "SOA",
                
                slsConfigs: deepmerge.all([
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").toSoaSlsConfig(
                        component.stackName,
                        serverName,
                        component.buildPath,
                        component.assetsPath,
                        component.region,
                        dataLayerService.concat(component.services)
                    ),

                        // the datalayer (maybe a child-config) must load before the plugin serverless-offline!
                        ...childConfigs.map(config => config.slsConfigs),

                        // # allows running the stack locally on the dev-machine
                        {
                            plugins: ["serverless-offline", "serverless-pseudo-parameters"],

                            custom: {

                                "serverless-offline": {
                                    host: "0.0.0.0",
                                    port: "${self:provider.port, env:PORT, '3001'}"
                                }
                            }

                        },

                        domainConfig,

                        // add the IAM-Role-Statements
                        iamPermissions,

                        // assign the role
                        iamRoleAssignment,

                        // set the bucket as an env
                        envS3Config
                    ]
                ),
                
                // add the server config 
                webpackConfigs: webpackConfigs.concat([soaWebPack, serverWebPack]),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds),
                    [createHtml, writeDomainEnv, copyAssetsPostBuild, deployWithDomain, invalidateCloudFrontCache /*, postDeploy*/]),

                iamRoleStatements: [],
                
                environments: environments,

                stackName: component.stackName,

                assetsPath: undefined,

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