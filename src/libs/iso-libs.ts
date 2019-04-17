


/**
 * the resolved assets path is the path ot the assets folder in the running environment
 */
export const resolveAssetsPath = (buildPath: string, serverName: string, assetsPath: string) => {
    const path = require('path');

    const resolvedPath = path.resolve(buildPath, serverName, assetsPath);

    return !resolvedPath.endsWith("/") ? resolvedPath+"/" : resolvedPath;
};


export const getStaticBucketName = (stackName: string, assetsPath: string | undefined, stage: string) => {
    return `${stackName}-${assetsPath !== undefined ? assetsPath+"-" : ""}${stage}`;
}