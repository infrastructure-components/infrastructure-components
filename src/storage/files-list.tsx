import React, { useState, useEffect } from 'react'
import { listFiles } from './storage-libs';
import { withStorageSsrRendering } from '../components/attach-storage';
import ExecutionEnvironment from 'exenv';
//import hash from 'object-hash';

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

    const hash = require('object-hash');
    const hashValue = hash({
        storageId: props.storageId,
        prefix: props.prefix ? props.prefix : "",
        mode: props.mode,
        data: props.data
    });

    //console.log("hashValue: ", hashValue);

    const [state, setState] = useState({state: STATE.LOADING, data: undefined, setRefetch: true, ignorePreloaded: false});

    const refetch = () => {
        setState({state: STATE.LOADING, data: undefined, setRefetch: true, ignorePreloaded: true});
    };

    const loadData = (onSuccess, onError) => {
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
        if (state.ignorePreloaded) {
            return undefined;
        }

        if (!ExecutionEnvironment.canUseDOM) {

            if (renderListResults) {
                const foundVal = renderListResults.find(el => el.hashValue == hashValue);
                if (foundVal) {
                    return foundVal;
                }
            }

            if (state.state === STATE.LOADING) {
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
        setState({
            state: STATE.RESPONSE,
            data: {
                data: preloaded.data,
                files: preloaded.files,
            },
            setRefetch: state.setRefetch,
            ignorePreloaded: state.ignorePreloaded
        });
    };

    //console.log("state: ", state.data);

    useEffect(() => {
        if (props.onSetRefetch && state.setRefetch /*state.state === STATE.LOADING /*!isRefetchSet*/) {
            props.onSetRefetch(()=>refetch);
        }

        if (state.state === STATE.LOADING) {
            loadData(
                ({data, files, folders}) => {
                    //console.log(data, files, folders)
                    setState({
                        state: STATE.RESPONSE,
                        data: {
                            data: data,
                            files: files,
                        },
                        setRefetch: false,
                        ignorePreloaded: state.ignorePreloaded
                    });
                },
                (err) => {
                    setState({
                        state: STATE.RESPONSE,
                        data: err,
                        setRefetch: false,
                        ignorePreloaded: state.ignorePreloaded
                    });

                });
        } else if (state.setRefetch) {
            setState({
                state: state.state,
                data: state.data,
                setRefetch: false,
                ignorePreloaded: state.ignorePreloaded
            });
        }

    }, [state]);




    return props.children({
        loading: state.state === STATE.LOADING /*|| state.state === STATE.SSR*/,
        data: state.state === STATE.RESPONSE ? state.data.data : undefined,
        files: state.state === STATE.RESPONSE ? state.data.files : undefined,
        error: state.state === STATE.ERROR ? state.data : undefined,
    });
});