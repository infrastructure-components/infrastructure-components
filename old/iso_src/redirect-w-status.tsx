import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const RedirectWithStatus = ({ key, from, to, status }) => (
    <Route render={({ staticContext }) => {
        // there is no `staticContext` on the client, so
        // we need to guard against that here
        if (staticContext)
            staticContext.status = status
        return <Redirect key={key} from={from} to={to} />
    }} />
)
export default RedirectWithStatus;