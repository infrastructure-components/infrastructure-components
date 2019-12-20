declare var require: any;
import React, { useState } from 'react';


// create empty context as default
const StorageContext = React.createContext({});

export interface IAttachStorage {
    addToRenderList: (fRender, hashValue) => void,
    isOffline: Boolean | undefined
    config: any,
    children: any,
    preloadedFiles: any,
    renderListResults: any
}


const AttachStorage = (props: IAttachStorage) => {

    return <StorageContext.Provider
        value={{
            addRenderSsr: props.addToRenderList,
            config: props.config,
            isOffline: props.isOffline,
            preloadedFiles: props.preloadedFiles,
            renderListResults: props.renderListResults
        }}>{props.children}</StorageContext.Provider>

};


export const serviceWithStorage = (complementedCallback: (listFiles, cbreq, cbres, cbnext) => any) => {

    // we return an array of valid middleware-callbacks
    return [
        async function (req, res, next) {
            return await complementedCallback(req.listFiles, req, res, next)
        }
    ]
};


export const serviceAttachStorage = (listFiles) => {
    return (req, res, next) => {

        req.listFiles = listFiles;
        next();
    };
}

export function withStorageSsrRendering(Component) {
    return function WrapperComponent(props) {
        return (
            <StorageContext.Consumer>
                {(context: any) => {
                    return <Component
                        {...props}
                        renderSsr={context.addRenderSsr}
                        config={context.config}
                        isOffline={context.isOffline}
                        preloadedFiles={context.preloadedFiles}
                        renderListResults={context.renderListResults}
                    />
                }}
            </StorageContext.Consumer>
        );
    };
}

export default AttachStorage;




