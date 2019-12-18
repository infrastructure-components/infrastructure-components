import React, { useState, useEffect } from 'react'
import { listFiles } from './storage-libs';
import { withStorageSsrRendering } from '../components/attach-storage';
import ExecutionEnvironment from 'exenv';
import hash from 'object-hash';

export interface IFilesList {
    children: any,
    storageId: string,
    prefix: string | undefined,
    mode: string,
    data: any,
    onSetRefetch?: (refetch: ()=> any) => void
};

const STATE = {
    //UNDEFINED: "UNDEFINED",
    LOADING: "LOADING",
    //SSR: "SSR",
    ERROR: "ERROR",
    RESPONSE: "RESPONSE"
}

export default withStorageSsrRendering(function ({renderSsr, config, isOffline, preloadedFiles, renderListResults, ...props}) {


    const hashValue = hash({
        storageId: props.storageId,
        prefix: props.prefix ? props.prefix : "",
        mode: props.mode,
        data: props.data
    });

    //console.log("hashValue: ", hashValue);

    const [state, setState] = useState({state: STATE.LOADING, data: undefined});

    const refetch = () => {
        setState({state: STATE.LOADING, data: undefined});
    };

    const loadData = (onSuccess, onError) => {
        console.log("loadData");
        listFiles(
            props.storageId,
            props.prefix ? props.prefix : "",
            props.mode,
            props.data,
            onSuccess,
            onError,
            config,
            isOffline
        );
    }

    const getPreloaded = () => {
        if (!ExecutionEnvironment.canUseDOM) {

            if (renderListResults) {
                return renderListResults.find(el => el.hashValue == hashValue);
            } else if (state.state === STATE.LOADING) {
                renderSsr(loadData, hashValue);
                return undefined;
            }

        } else {
            return preloadedFiles !== undefined ? preloadedFiles.find(el => el.hashValue == hashValue) : undefined;
        }

        return undefined;
    };

    const preloaded = getPreloaded();
    //console.log("preloaded: ", preloaded);


    if (preloaded && state.state === STATE.LOADING) {
        setState({state: STATE.RESPONSE, data: {
            data: preloaded.data,
            files: preloaded.files,
        }});
    };

    //console.log("state: ", state.data);

    useEffect(() => {
        if (props.onSetRefetch && state.state === STATE.LOADING /*!isRefetchSet*/) {
            props.onSetRefetch(()=>refetch);
            //setRefetch(true);
        }

        state.state === STATE.LOADING && loadData(
            (data, files) => {
                setState({
                    state: STATE.RESPONSE,
                    data: {
                        data: data,
                        files: files,
                    }
                });
            },
            (err) => {
                setState({
                    state: STATE.RESPONSE,
                    data: err
                });

            });

    }, [state]);




    return props.children({
        loading: state.state === STATE.LOADING /*|| state.state === STATE.SSR*/,
        data: state.state === STATE.RESPONSE ? state.data.data : undefined,
        files: state.state === STATE.RESPONSE ? state.data.files : undefined,
        error: state.state === STATE.ERROR ? state.data : undefined,
    });
});