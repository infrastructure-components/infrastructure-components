
/**
 * A configuration of a client in a higher-level (e.g. SSR) context
 */
export interface AppConfig {
    /**
     * path to the entry component, e.g. './src/client/index.tsx'
     */
    entry: string| any,

    /**
     * name of the client-app
     */
    name: string,

}

export const getClientFilename = (name: string): string => {
    return name+".bundle.js";
}

export const getServerFilename = (name: string): string => {
    return name+".js";
}

/**
 * transform a Client-Config to a Webpack-Client-Config
 * @param config
 */
export const toClientWebpackConfig = (config: AppConfig, buildPath: string) => {

    return {
        entry: {
            app: config.entry
        },
        output: {
            path: getBuildPath(config, buildPath),
            filename: getClientFilename(config.name)
        },
        target: "web"
    }
}

export const toServerWebpackConfig = (config: AppConfig, buildPath: string) => {

    // here we need to take care of multiple entries



    return {
        /*entry: {
            handler: config.entry
        },*/
        entry: config.entry,
        output: {
            libraryTarget: "commonjs2",
            path: getBuildPath(config, buildPath),
            filename: getServerFilename(config.name), //'[name].js',
            publicPath: '/'
        },
        target: "node"
    }
}

export const getBuildPath = (config: AppConfig, buildPath: string) => {
    const path = require('path');
    
    return path.resolve(buildPath, config.name);
}