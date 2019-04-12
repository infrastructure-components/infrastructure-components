
/**
 * Add the exports of the library here
 *
 */
export const WebApp = require('./webapp/webapp-component').default;
export const Middleware = require('./middleware/middleware-component').default;
export const Route = require('./route/route-component').default;
export const withRequest = require('./components/attach-request').withRequest;
export const AttachRequest = require('./components/attach-request').default;
export const IsomorphicApp = require('./isomorphic/iso-component').default;
export const Environment = require('./environment/environment-component').default;

export const Link = require('../node_modules/react-router-dom/Link');

export const INFRASTRUCTURE_MODES = require('./libs/loader').INFRASTRUCTURE_MODES;
export const loadInfrastructureComponent = require('./libs/loader').loadInfrastructureComponent;
export const extractObject = require('./libs/loader').extractObject;
export const loadConfigurationFromModule = require('./libs/loader').loadConfigurationFromModule;

export const loadConfiguration = require('./libs/loader').loadConfiguration;
export const IConfigParseResult = require('./libs/config-parse-result').IConfigParseResult;
export const parseForPlugins = require('./libs/parser').parseForPlugins;
export const extractConfigs = require('./libs/parser').extractConfigs;

export const IPlugin = require('./libs/plugin').IPlugin;
export const isWebApp = require('./webapp/webapp-component').isWebApp;
export const isMiddleware = require('./middleware/middleware-component').isMiddleware;


export const Types = require('./types').default;
export const IConfiguration = require('./types/configuration').IConfiguration;
export const IInfrastructure = require('./types/configuration').IInfrastructure;


export const getChildrenArray = require('./libs').getChildrenArray;
export const getStaticBucketName = require('./libs/iso-libs').getStaticBucketName;

export const IEnvironmentArgs = require('./environment/environment-component').IEnvironmentArgs;
export const PARSER_MODES = require('./libs/parser').PARSER_MODES;