.. _ServiceOrientedApp:

********************
Service-Oriented-App
********************

Installation
============

Please follow the general installation instructions: :doc:`../installation`.

The ServiceOrientedApp-component further requires the following libraries as devDependencies::

    npm install --save-dev infrastructure-scripts \
        serverless-offline \
        serverless-pseudo-parameters \
        serverless-single-page-app-plugin

Further, the ``<ServiceOrientedApp />``-component requires the following libraries during runtime::

    npm install --save \
        infrastructure-components \
        @babel/polyfill \
        express \
        isomorphic-fetch \
        react \
        react-dom \
        serverless-http

Have a look at our `Service-Oriented-App-Example <https://github.com/infrastructure-components/serviceoriented_example>`_.


Develop
=======


Properties
----------

The ServiceOrientedApp-component requires you to define the following properties:

* ``stackName`` the (arbitrary) name of your app, please use only lower case characters and hyphens for the name serves as identifier within AWS
* ``buildPath`` the relative path to the folder within your project, where to put the build-resources, e.g. "build". You may want to add this name to your .gitignore file to keep your repository free from compiled files.
* ``region`` the AWS-region you want your infrastructure to reside after deployment, e.g. 'us-east-1'


Allowed Children
----------------

The ServiceOrientedApp-component supports the following infrastructure-components as direct children:

* a :doc:`../components/route` lets you specify a custom path (at the domain of your app) that gets served by its render-function. You should have at least the home-path-route ("/") in any meaningful web-application.
* an :doc:`../components/environment` defines a runtime environment of your app.
* a :doc:`../components/service` lets you specify a backend service.

Example
-------

The following snippet depicts a Service-Oriented-App with a route, a service, and a develop environment::

    import * as React from 'react';
    import "@babel/polyfill";
    import {
        callService,
        Environment,
        Middleware,
        Route,
        Service,
        ServiceOrientedApp
    } from "infrastructure-components";

    const SERVICE_ID = "myservice";

    async function callMyService () {

        await callService(
            SERVICE_ID,
            { some: "data" },
            (data: any) => {
                console.log("received data: ", data);

            },
            (error) => {
                console.log("error: " , error)
            }
        );

    }

    export default (
        <ServiceOrientedApp
            stackName = "soa-example"
            buildPath = 'build'
            region='eu-west-1'>

            <Environment name="dev"/>

            <Route
                path='/'
                name='My Service-Oriented React App'
                render={()=><div>
                    <button onClick={callMyService}>Hello Infrastructure-Components!</button>
                </div>}
            />

            <Service
                id={ SERVICE_ID }
                path="/myservice"
                method="POST">

                <Middleware
                    callback={ function (req, res, next) {
                        const parsedBody = JSON.parse(req.body);

                        console.log("this is the service: ", parsedBody);

                        res.status(200).set({
                            "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                        }).send("ok");

                }}/>

            </Service>
        </ServiceOrientedApp>);



Build
=====

The library `infrastructure-scripts <https://github.com/infrastructure-components/infrastructure-scripts>`_
provides the scripts command. Run it with the arguments ``build`` and the relative path to the file that exports the
``<ServiceOrientedApp/>`` component, e.g. ``src/index.tsx``.

If you prefer using the usual ``npm run build`` command for building, simply add the script to your package.json file::

    "scripts": {
      "build": "scripts build src/index.tsx"
    }

The build process adds further scripts to your ``package.json``. These let you start your software stack offline
in hot-development-mode and deploy it to AWS.


Run Hot-Development
===================

Once you ran the ``build`` script, your ``package.json`` will contain a script for the hot-development-mode.

Now run ``scripts {your_stackName} src/index.tsx`` or ``npm run {your_stackName}`` to start your web-app in
hot-development-mode (replace ``{your_stackName}`` with the stackName of your ServiceOrientedApp-Component).

Wait until the console says that your app is running and open localhost:3000 in your browser.

You should see your app displaying "Hello from a React Web App!" - or whatever your own component renders.
Changes to your source code become effective immediately in this mode. Just edit your source code and reload your page
in the browser.

In this mode, your services are not available.

If you want to stop the app, use "ctrl-c" (or whatever command your console-application uses to interrupt a running script).


Run Offline
===========

Once you ran the ``build`` script, your ``package.json`` will contain a start-script for each environment to run the
whole stack offline::

    npm run start-{your_environment_name}

Open your the url localhost:3000 in a browser and you can see your application in action. Have a look at the console
of your development environment for outputs made on server-side (e.g. services)

The services run at localhost:3001.

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
You'll get back an URL like https://{your_stackName}-{your_environment_name}.s3.amazonaws.com that now serves your app.