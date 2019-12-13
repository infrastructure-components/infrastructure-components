
/**
 * Add the exports of the library here
 *
 */
export const WebApp = require('./webapp/webapp-component').default;
export const Middleware = require('./middleware/middleware-component').default;
export const Route = require('./route/route-component').default;
export const IsomorphicApp = require('./isomorphic/iso-component').default;
export const Environment = require('./environment/environment-component').default;
export const EnvValue = require('./environment/env-value-component').default;
export const SinglePageApp = require('./spa/spa-component').default;
export const ServiceOrientedApp = require('./soa/soa-component').default;
export const DataLayer = require('./datalayer/datalayer-component').default;
export const Entry = require('./datalayer/entry-component').default;
export const Service = require('./service/service-component').default;
export const Storage = require('./storage/storage-component').default;
export const File = require('./storage/file-component').default;

export const withRequest = require('./components/attach-request').withRequest;
export const AttachRequest = require('./components/attach-request').default;
export const withIsomorphicState = require('./components/attach-isomorphic-state').withIsomorphicState;
export const AttachIsomorphicState = require('./components/attach-isomorphic-state').default;

export const uploadFile = require('./storage/storage-libs').uploadFile;
export const listFiles = require('./storage/storage-libs').listFiles;
export const LISTFILES_MODE = require('./storage/storage-libs').LISTFILES_MODE;
export const FilesList = require('./storage/files-list').default;
export const IFilesList = require('./storage/files-list').IFilesList;
export const STORAGE_ACTION = require('./storage/storage-libs').STORAGE_ACTION;

export const SecuredEntry = require('./authentication/securedentry-component').default;
export const Authentication = require('./authentication/authentication-component').default;
export const AuthenticationProvider = require('./authentication/authentication-component').AuthenticationProvider;
export const SecuredRoute = require('./authentication/securedroute-component').default;
export const SecuredService = require('./authentication/securedservice-component').default;
export const Identity = require('./identity/identity-component').default;
export const AUTH_RESPONSE = require('./authentication/authentication-component').AUTH_RESPONSE;


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
export const ddbListEntries = require('./datalayer/datalayer-libs').ddbListEntries;
export const getEntry = require('./datalayer/datalayer-libs').getEntry;
export const update = require('./datalayer/datalayer-libs').update;
export const mutate = require('./datalayer/datalayer-libs').mutate;
export const select = require('./datalayer/datalayer-libs').select;
export const withDataLayer = require('./assets/attach-data-layer').withDataLayer;
export const AttachDataLayer = require('./assets/attach-data-layer').default;
export const serviceWithDataLayer = require('./assets/attach-data-layer').serviceWithDataLayer;

export const getClientFilename = require('./libs/server-libs').getClientFilename;

export const withRoutes = require('./assets/attach-routes').withRoutes;
export const AttachRoutes = require('./assets/attach-routes').default;
export const IRoute = require('./assets/routed-app').IRoute;

export const withUser = require('./assets/attach-user').withUser;
export const userLogout = require('./assets/attach-user').userLogout;
export const AttachUser = require('./assets/attach-user').default;
export const getUserId = require('./assets/attach-user').getUserId;
export const getWebToken = require('./assets/attach-user').getWebToken;

export const getBrowserId = require('./identity/identity-component').getBrowserId;

export const withAuthCallback = require('./assets/attach-auth').withAuthCallback;
export const getAuthCallback = require('./assets/attach-auth').getAuthCallback;
export const AttachAuth = require('./assets/attach-auth').default;


export const ForceLogin = require('./assets/force-login').default;


export const callService = require('./assets/service-libs').callService;
export const getServiceUrl = require('./assets/service-libs').getServiceUrl;

export const getBasename = require('./libs/iso-libs').getBasename;

export const fetchData = require('./libs/scripts-libs').fetchData;

