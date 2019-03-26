
export const ConfigTypes = {
    /**
     * The Low-Level Server accepts basic webpack- and sls- configs
     * It does not take care of ensuring that anything fits together
     */
    LOWLEVEL_SERVER:'LOWLEVEL_SERVER',

    /**
     * The low-level SPA accepts a basic webpack configuration
     */
    LOWLEVEL_SPA:'LOWLEVEL_SPA',

    /**
     * The higher level API to build/start a SSR app
     */
    SSR:'SSR',

    /**
     * the higher level API to build/start/deploy an isomorphic app that comes with
     * a pre-implemented client/server-framework
     */
    ISOMORPHIC:'ISOMORPHIC'

};

/**
 * This interface describes the input into the build-script
 */
export interface Config {

    /**
     * can be of ConfigTypes, either SSR or SPA
     */
    type: string,

    /**
     * A webpack-configuration of the app
     */
    webpackConfig: any,

    /**
     * the serverless.yml specification as js-object
     */
    slsConfig: any
};