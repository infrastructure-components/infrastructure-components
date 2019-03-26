import * as React from 'react';

export interface IRoute {
    path: string,

    name: string,

    render: any
}


export class Route extends React.Component<IRoute, {}> {

    constructor(props) {
        super(props);
    }

    render () {
        return null;
    }
}

export default Route;
