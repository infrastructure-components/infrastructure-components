Installation
===

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


.. code-block:: bash
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


The library [infrastructure-scripts](https://github.com/infrastructure-components/infrastructure-scripts) comprise
the scripts required of building, starting, and deploying the app.For this lib contains many libraries that you only
need during development/deployment, install this library as devDependency:

.. code-block:: bash
    npm install --save-dev infrastructure-scripts


Infrastructure-Components use the [Serverless framework](https://serverless.com/) that you need to install globally.
`serverless-offline` lets you start your application on localhost

.. code-block:: bash
    npm install -g serverless

