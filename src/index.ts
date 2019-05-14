
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
export const SinglePageApp = require('./spa/spa-component').default;
export const DataLayer = require('./datalayer/datalayer-component').default;
export const Entry = require('./datalayer/entry-component').default;

export const Authentication = require('./authentication/authentication-component').default;
export const AuthenticationProvider = require('./authentication/authentication-component').AuthenticationProvider;
export const SecuredRoute = require('./authentication/securedroute-component').default;
export const Identity = require('./identity/identity-component').default;

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

export const setEntry = require('./datalayer/datalayer-libs').setEntry;
export const getEntryListQuery = require('./datalayer/datalayer-libs').getEntryListQuery;
export const getEntry = require('./datalayer/datalayer-libs').getEntry;
export const mutate = require('./datalayer/datalayer-libs').mutate;
export const select = require('./datalayer/datalayer-libs').select;
export const withDataLayer = require('./assets/attach-data-layer').withDataLayer;
export const AttachDataLayer = require('./assets/attach-data-layer').default;

export const withRoutes = require('./assets/attach-routes').withRoutes;
export const AttachRoutes = require('./assets/attach-routes').default;
export const IRoute = require('./assets/routed-app').IRoute;
