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




