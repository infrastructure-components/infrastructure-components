import React, { useState, useEffect } from 'react'
import { listFiles } from './storage-libs';

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
    ERROR: "ERROR",
    RESPONSE: "RESPONSE"
}

export default function (props: IFilesList) {
    //const [isRefetchSet, setRefetch] = useState(false);

    //const [response, setResponse] = useState(undefined);
    //const [error, setError] = useState(undefined);
    const [state, setState] = useState({state: STATE.LOADING, data: undefined});

    //console.log("response:  ", response);
    const refetch = () => {
        //setResponse(undefined);
        //setError(undefined);
        //setRefetch(false);
        setState({state: STATE.LOADING, data: undefined});
    };

    useEffect(() => {
        if (props.onSetRefetch && state.state === STATE.LOADING /*!isRefetchSet*/) {
            props.onSetRefetch(()=>refetch);
            //setRefetch(true);
        }

        state.state === STATE.LOADING && listFiles(
            props.storageId,
            props.prefix ? props.prefix : "",
            props.mode,
            props.data,
            (data, files) => {
                setState({
                    state: STATE.RESPONSE,
                    data: {
                        data: data,
                        files: files,
                    }
                })
            },
            (err) => {
                setState({
                    state: STATE.RESPONSE,
                    data: err
                })
            }

        );

    }, [state]);



    return props.children({
        loading: state.state === STATE.LOADING,
        data: state.state === STATE.RESPONSE ? state.data.data : undefined,
        files: state.state === STATE.RESPONSE ? state.data.files : undefined,
        error: state.state === STATE.ERROR ? state.data : undefined,
    });
};