*************************
Infrastructure-Components
*************************

Infrastructure-Components configure the infrastructure of your React-App as part of your React-Components.

This piece of code is all you need to create, build, and deploy a **Serverless Isomorphic React App**!

.. code-block:: typescript
    /** index.tsx */
    import * as React from 'react';

    import {
        IsomorphicApp,
        WebApp,
        Route
    } from "infrastructure-components";

    export default (
      <IsomorphicApp
        stackName = "my-isomorphic-app"
        buildPath = 'build'
        assetsPath = 'assets'
        region='eu-west-1'>

        <WebApp
          id="main"
          path="*"
          method="GET">

          <Route
            path='/'
            name='My Serverless Isomorphic React App'
            render={(props) => <div>Hello World</div>}
          />

        </WebApp>
    </IsomorphicApp>);

[This repository](https://github.com/infrastructure-components/isomorphic_example) provides a working example
of a Serverless Isomorphic React App with Infrastructure-Components.


.. toctree::
   :caption: Contents
   :maxdepth: 2

   installation
   apps/spa
   apps/isomorphic
   components/webapp
   components/route
   components/middleware
   components/environment
   help