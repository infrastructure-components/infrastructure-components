import * as React from 'react';

export interface IRedirect {
    from: string,

    to: string,

    status: number
}


export class Redirect extends React.Component<IRedirect, {}> {

    constructor(props) {
        super(props);
    }

    render () {
        return null;
    }
}

export default Redirect;
