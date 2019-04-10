
# Infrastructure-Components

Infrastructure-Components configure the infrastructure of your React-App as part of your React-Components.

This piece of code is all you need to create, build, and deploy a **Serverless Isomorphic React App**!

```
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
```

[This repository](https://github.com/infrastructure-components/isomorphic_example) provides a working example
of a Serverless Isomorphic React App with Infrastructure-Components.


## Installation

Infrastructure-Components require the following libraries during runtime:

- express
- infrastructure-components
- react
- react-dom
- react-helmet
- react-router
- react-router-dom
- serverless-http
- styled-components


```
npm install --save \
    express \
    infrastructure-components \
    react \
    react-dom \
    react-helmet \
    react-router \
    react-router-dom \
    serverless-http \
    styled-components
```

The library [infrastructure-scripts](https://github.com/infrastructure-components/infrastructure-scripts) comprise
the scripts required of building, starting, and deploying the app.For this lib contains many libraries that you only
need during development/deployment, install this library as devDependency:

```
npm install --save-dev infrastructure-scripts
```

Infrastructure-Components use the [Serverless framework](https://serverless.com/) that you need to install globally.
`serverless-offline` lets you start your application on localhost

```
npm install -g serverless
npm install --save-dev serverless-offline
```


## Help and Support

Infrastructure-Components are under active development. If you find a bug or need support of any kind,
please have a look at our [Spectrum-Chat](https://spectrum.chat/infrastructure).

Further, we frequently publish descriptions and tutorials on new features on [Medium.com](https://medium.com/@fzickert).