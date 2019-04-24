.. _IsomorphicApp:

**************
Isomorphic-App
**************


Installation
============

Please follow the general installation instructions: :doc:`../installation`.

The ``<IsomorphicApp />``-component  further requires the ``serverless-domain-manager`` and the ``serverless-offline`` libraries
as devDependencies::

    npm install --save-dev serverless-domain-manager serverless-offline

Further, the ``<IsomorphicApp />``-component requires the following libraries during runtime::

* express
* infrastructure-components
* react
* react-dom
* react-helmet
* react-router
* react-router-dom
* serverless-http
* styled-components

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


Have a look at our `IsomorphicApp-Example <https://github.com/infrastructure-components/isomorphic_example>`_.


Develop
=======


Properties
----------

The SinglePageApp-component requires you to define the following properties:

* ``stackName`` the (arbitrary) name of your app, please use only lower case characters and hyphens for the name serves as identifier within AWS
* ``buildPath`` the relative path to the folder within your project, where to put the build-resources, e.g. "build". You may want to add this name to your .gitignore file to keep your repository free from compiled files.
* ``assetsPath`` the relative path to the folder where the app stores the bundled Javascript-code at runtime, e.g. "assets"
* ``region`` the AWS-region you want your infrastructure to reside after deployment, e.g. 'us-east-1'


Allowed Children
----------------

The IsomorphicApp-component supports the following infrastructure-components as direct children:


* a :doc:`../components/webapp` lets you specify a client-app with a custom html and Javascript code. The ``<WebApp/>`` supports ``<Route/>`` components that let you specify custom paths (at the domain of your app) that get served by their render-functions.
* a :doc:`../components/middleware` lets  you specify a server-side function that runs whenever a user requests a page from the server. When you specify it as a direct child of your ``<IsomorphicApp/>`` then it applies to all requests made to the server. If you want ``<Middleware/>``s to apply to a subset, you can put them as children to ``<WebApp/>`` or ``<Route/>``, too!
* an :doc:`../components/environment` defines a runtime environment of your app.

Example
-------

The following snippet depicts an IsomorphicApp with one WebApp and two routes, a develop- and a production-environment,
and middlewares at different levels::

    import * as React from 'react';

    import {
        Environment,
        IsomorphicApp,
        Link,
        Route,
        WebApp
    } from "infrastructure-components";

    export default (
        <IsomorphicApp
            stackName = "my-isomorphic-app"
            buildPath = 'build'
            assetsPath = 'assets'
            region='eu-west-1'>

            <Environment
                name="dev"
            />

            <Environment
                name="prod"
                domain="www.infrastructure-components.com"
            />

            <Middleware
                callback={(req, res, next) => {
                    console.log("this is an overall middleware");
                    next();
                }}
            />

            <WebApp
                id="main"
                path="*"
                method="GET">

                <Middleware
                    callback={(req, res, next) => {
                        console.log("this middleware applies to the ClientApp");
                        next();
                    }}
                />

                <Route
                    path='/'
                    name='My Serverless Isomorphic React App'
                    render={(props) => <div>Hello World</div>}
                >
                    <Middleware
                        callback={(req, res, next) => {
                            console.log("finally, a middleware of the /-route, be careful: this route does not apply when loading assets!");
                            next();
                        }}/>
                </Route>

                <Route
                    path='/test'
                    name='My Serverless Isomorphic React App'
                    render={(props) => <Link to="/">Back to Home</Link>}
                />

            </WebApp>
        </IsomorphicApp>
    );



Build
=====

The library `infrastructure-scripts <https://github.com/infrastructure-components/infrastructure-scripts>`_
provides the scripts command. Run it with the arguments ``build`` and the relative path to the file that exports the
``<SinglePageApp/>`` component, e.g. ``src/index.tsx``.

If you prefer using the usual ``npm run build`` command for building, simply add the script to your package.json file::

    "scripts": {
      "build": "scripts build src/index.tsx"
    }

The build process adds further scripts to your ``package.json``. These let you start your single webapps
in hot-development-mode, start the whole software stack offline, and deploy it to AWS.

Run your WebApp in Hot-Development-Mode
=======================================

When you develop a React-App, you may want to see your changes directly, without the need of triggering the build+start
commands manually every time. Use the script ``npm run ${webapp-id}`` with the id you specified in the WebApp-component.
This starts the webpack-hot-middleware. Open your the url localhost:3000 in a browser.

Your changes become effective once you reload the browser-page. Have a look at the output of your console to not miss any error messages.

NOTE: In this mode, the WebApp runs as a Single-Page-App without a backend!


Run Offline
===========

Once you ran the ``build`` script, your ``package.json`` will contain a start-script for each environment to run the
whole stack offline::

    npm run start-{your_environment_name}

Open your the url localhost:3000 in a browser and you can see your application in action. Have a look at the console
of your development environment for outputs made on server-side (e.g. middlewares)

Note: Changes at your source code require running ``npm run build`` before they become effective in this mode!

If you want to stop the app, use "ctrl-c" (or whatever command your console-application uses to interrupt a running script).

Deployment Preparations (only one-time)
=======================================

Deploying your app requires:

1. An AWS account that you can create at https://aws.amazon.com
2. A technical user (with programmatic access / API-key)

In your AWS-console, open the IAM menu and create a new user with the following policy::

    {
        "Statement": [
            {
                "Action": [
                    "s3:*",
                    "apigateway:*",
                    "lambda:*",
                    "logs:*",
                    "cloudformation:*",
                    "cloudfront:*",
                    "acm:ListCertificates",
                    "route53:ListHostedZones",
                    "route53:ListResourceRecordSets",
                    "route53:ChangeResourceRecordSets",
                    "route53:GetChange",
                    "iam:CreateRole",
                    "iam:DeleteRole",
                    "iam:DeleteRolePolicy",
                    "iam:GetRole",
                    "iam:PassRole",
                    "iam:PutRolePolicy",
                    "execute-api:ManageConnections",
                    "cloudfront:UpdateDistribution"
                ],
                "Effect": "Allow",
                "Resource": "*"
            }
        ],
        "Version": "2012-10-17"
    }

You'll get a AWS Key Id and an AWS Secret Key. 

3 . Put these into the.env-file in your project root::

    AWS_ACCESS_KEY_ID=********************
    AWS_SECRET_ACCESS_KEY=*****************************************


Deploy
======

Once you have your credentials at the right place and you ran the ``build`` script, your ``package.json`` will contain
a script for each environment your app contains::

    npm run deploy-{your_environment_name}


From here, the scripts create the whole infrastructure stack on your AWS account.
In the console output, you'll get back an URL that now serves your app.

Note: deploying an isomorphic app requires some time for it consists of several AWS resources, like: CloudFormation,
Lambda, S3, Api-Gateway, IAM, Route53.

Domain
======

Have a look at our tutorial on how to register and prepare a domain within AWS.

If you specified an ``<Environment/>``-component with a ready-to-use-domain
and once you deployed your app, you can initialize the domain with the following command::

    npm run domain-{your_environment_name}

Note: You only need to run this command once. But it may take quite some time to complete!