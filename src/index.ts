
/**
 * Add the exports of the library here
 *
 */
export const ConfigTypes = require('./lib/config').ConfigTypes;

export const SlsIsomorphic = require('./lib/sls-isomorphic').default;
export const ClientApp = require('./lib/client-app').default;
export const Middleware = require('./lib/middleware').default;
export const Redirect = require('./lib/redirect').default;
export const Route = require('./lib/route').default;
export const Environment = require('./lib/environment').default;

export const loadIsoConfigFromComponent = require("./isolib").loadIsoConfigFromComponent;

export const AppConfig = require ('./types/app-config').AppConfig;
export const toClientWebpackConfig = require ('./types/app-config').toClientWebpackConfig;
export const toServerWebpackConfig = require ('./types/app-config').toServerWebpackConfig;
export const getBuildPath = require ('./types/app-config').getBuildPath;

export const IClientApp = require ("./types/client-app-config").IClientApp;
export const withRequest = require("./iso_src/attach-request").withRequest;