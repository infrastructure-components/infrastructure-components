import React, { useState } from 'react'
import { listFiles } from './storage-libs';

export interface IFilesList {
    children: any,
    storageId: string,
    prefix: string | undefined,
    mode: string
}

export default function (props: IFilesList) {

    const [filesList, setFilesList] = useState(undefined);
    const [error, setError] = useState(undefined);

    !(filesList || error) && listFiles(
        props.storageId,
        props.prefix ? props.prefix : "",
        props.mode,
        setFilesList,
        setError
    );

    return props.children({
        loading: !(filesList || error),
        data: filesList,
        error: error
    });
};