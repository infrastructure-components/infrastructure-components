
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
    region='us-east-1'>

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

You can install [infrastructure-components](https://github.com/infrastructure-components/infrastructure-components) easily

```
npm install --save infrastructure-components
```


[infrastructure-scripts](https://github.com/infrastructure-components/infrastructure-scripts)
provide all the scripts required to `build`, `start`, and `deploy`. This lib contains many libraries that you only
need during development/deployment. Thus, install this library as devDependency::

```
npm install --save-dev infrastructure-scripts
```

Infrastructure-components use the `Serverless framework <https://serverless.com/>`_ that you need to install globally::

```
npm install -g serverless
```

Finally, apps (e.g. single-page-app, isomorphic-app) and components (environment, webapp) can have further dependencies.
Have a look at them in [our documentation](https://infrastructure-components.readthedocs.io).


## Help and Support

Have a look at our [documentation](https://infrastructure-components.readthedocs.io).

Infrastructure-Components are under active development. If you find a bug or need support of any kind,
please have a look at our [Spectrum-Chat](https://spectrum.chat/infrastructure).

Further, we frequently publish descriptions and tutorials on new features on [Medium.com](https://medium.com/@fzickert).