import * as React from 'react';

export interface IMiddleware {
    callback: (req, res, next) => any
}


export class Middleware extends React.Component<IMiddleware, {}> {

    constructor(props) {
        super(props);
    }

    render () {
        return null;
    }
}

export default Middleware;
