import * as React from 'react';

export interface Props {
    stackName: string,
    buildPath: string,
    assetsPath: string,

    isoConfig: any,
}

export class SlsIsomorphic extends React.Component<Props, {}> {

    constructor(props) {
        super(props);

    }

    render () {
        return null;
    }
}

export default SlsIsomorphic;
