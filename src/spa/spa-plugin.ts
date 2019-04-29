/**
 * This module must not import anything globally not workin in web-mode! if needed, require it within the functions
 *
 * NOTE, we Ignore the infrastructure-scripts libraries when bundling, so these can be used ...
 * We also put fs to empty! If you need other libs, add them to `node: { fs: empty }`
 */
import { isSinglePageApp } from './spa-component';
import { resolveAssetsPath } from '../libs/iso-libs';
import * as deepmerge from 'deepmerge';
import { IConfigParseResult } from '../libs/config-parse-result';
import { IPlugin } from '../libs/plugin';
import { PARSER_MODES } from '../libs/parser';

import extractDomain from 'extract-domain';

/**
 * Parameters that apply to the whole Plugin, passed by other plugins
 */
export interface IIsoPlugin {

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
export const SpaPlugin = (props: IIsoPlugin): IPlugin => {

    //console.log("configFilePath: " , props.configFilePath);

    const result: IPlugin = {
        // identify Isomorphic-App-Components
        applies: (component): boolean => {

            return isSinglePageApp(component);
        },

        // convert the component into configuration parts
        process: (
            component: any,
            childConfigs: Array<IConfigParseResult>,
            infrastructureMode: string | undefined
    ): IConfigParseResult => {

            const path = require('path');

            
            const webappBuildPath = path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath);

            const spaWebPack = require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs")
                .complementWebpackConfig(require("../../../infrastructure-scripts/dist/infra-comp-utils/webpack-libs")
                    .createClientWebpackConfig(
                        "./"+path.join("node_modules", "infrastructure-components", "dist" , "assets", "spa.js"), //entryPath: string,
                        path.join(require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").currentAbsolutePath(), props.buildPath), //use the buildpath from the parent plugin
                        component.id, //appName
                        undefined, //assetsPath
                        undefined, // stagePath: TODO take from Environment!
                        {
                            __CONFIG_FILE_PATH__: require("../../../infrastructure-scripts/dist/infra-comp-utils/system-libs").pathToConfigFile(props.configFilePath), // replace the IsoConfig-Placeholder with the real path to the main-config-bundle
                        }, {
                        }
                    )
                );
            

            // provide all client configs in a flat list
            const webpackConfigs: any = childConfigs.reduce((result, config) => result.concat(config.webpackConfigs), []);

            const copyAssetsPostBuild = () => {
                //console.log("check for >>copyAssetsPostBuild<<");
                if (props.parserMode == PARSER_MODES.MODE_BUILD) {
                    console.log("write the index.html!");

                    require('fs').writeFileSync(path.join(webappBuildPath, component.stackName, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${component.stackName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script src="${component.stackName}.bundle.js"></script>
  </body>
</html>`);

                }

            };



            // check whether we already created the domain of this environment
            const deployedDomain = process.env[`DOMAIN_${props.stage}`] !== undefined;


            const domain = childConfigs.map(config => config.domain).reduce((result, domain) => result !== undefined ? result : domain, undefined);
            const certArn = childConfigs.map(config => config.certArn).reduce((result, certArn) => result !== undefined ? result : certArn, undefined);

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
            
            const showStaticPageName = () => {
                //console.log("check for >>showStaticPageName<<");
                if (props.parserMode === PARSER_MODES.MODE_DEPLOY) {
                    console.log(`Your SinglePageApp is now available at: http://${component.stackName}-${props.stage}.s3-website-${component.region}.amazonaws.com`);
                }
            };

            async function deployWithDomain() {
                // start the sls-config
                if (props.parserMode === PARSER_MODES.MODE_DOMAIN) {
                    await require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").deploySls();
                }
            }


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

            return {
                slsConfigs: deepmerge.all([
                    require("../../../infrastructure-scripts/dist/infra-comp-utils/sls-libs").toSpaSlsConfig(
                        component.stackName,
                        component.buildPath,
                        component.region,
                        domain
                    ),

                    domainConfig,

                    ...childConfigs.map(config => config.slsConfigs)
                    ]
                ),
                
                // add the server config 
                webpackConfigs: webpackConfigs.concat([spaWebPack]),

                postBuilds: childConfigs.reduce((result, config) => result.concat(config.postBuilds), [copyAssetsPostBuild, writeDomainEnv, showStaticPageName, deployWithDomain, invalidateCloudFrontCache]),

                environments: childConfigs.reduce((result, config) => (result !== undefined ? result : []).concat(config.environments !== undefined ? config.environments : []), []),

                stackName: component.stackName,

                assetsPath: undefined,

                buildPath: component.buildPath,

                region: component.region,

                domain: domain,

                certArn: certArn,

                // start the sls-stack offline does not work and does make sense either, we can use the hot-dev-mode
                supportOfflineStart: false,
                supportCreateDomain: true
            }
        }
    }

    return result;

};