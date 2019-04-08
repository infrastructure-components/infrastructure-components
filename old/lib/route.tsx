import * as React from 'react';

export interface IRoute {
    path: string,

    name: string,

    render?: any,

    component?: any
}


export class Route extends React.Component<IRoute, {}> {

    constructor(props) {
        super(props);

        //console.log("route: ", props)
    }

    render () {
        return null;
    }
}

export default Route;
