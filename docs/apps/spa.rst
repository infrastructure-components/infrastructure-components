.. _SinglePageApp:

***************
Single-Page-App
***************

Installation
============

Please follow the general installation instructions: :doc:`../installation`.

The SinglePageApp-component further requires the ``serverless-single-page-app-plugin`` as a devDependency::

    npm install --save-dev serverless-single-page-app-plugin

Further, the ``<SinglePageApp />``-component requires the following libraries during runtime::

    npm install --save react react-dom

Have a look at our `Single-Page-App-Example <https://github.com/infrastructure-components/singlepage_example>`_.


Develop
=======


Properties
----------

The SinglePageApp-component requires you to define the following properties:

* ``stackName`` the (arbitrary) name of your app, please use only lower case characters and hyphens for the name serves as identifier within AWS
* ``buildPath`` the relative path to the folder within your project, where to put the build-resources, e.g. "build". You may want to add this name to your .gitignore file to keep your repository free from compiled files.
* ``region`` the AWS-region you want your infrastructure to reside after deployment, e.g. 'us-east-1'


Allowed Children
----------------

The SinglePageApp-component supports the following infrastructure-components as direct children:

* a :doc:`../components/route` lets you specify a custom path (at the domain of your app) that gets served by its render-function. You should have at least the home-path-route ("/") in any meaningful web-application.
* an :doc:`../components/environment` defines a runtime environment of your app.

Example
-------

The following snippet depicts a Single-Page-App with two routes, a develop- and a production-environment::

    import * as React from 'react';

    import {
        SinglePageApp,
        Environment,
        Route
    } from "infrastructure-components";

    export default (
        <SinglePageApp
            stackName = "example"
            buildPath = 'build'
            region='us-east-1'>

            <Environment
                name="dev"
            />

            <Environment
                name="prod"
                domain="www.infrastructure-components.com"
                certArn="arn:aws:acm:us-east-1:************:certificate/********-****-****-****-************"
            />

            <Route
                path='/'
                name='Infrastructure-Components'
                render={()=> <div>Hello from a React Web App!</div>}
            />

            <Route
                path='/some-page'
                name='Some Page'
                render={()=> <div>This is some page at the path /some-page</div>}
            />

        </SinglePageApp>
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

The build process adds further scripts to your ``package.json``. These let you start your software stack offline
in hot-development-mode and deploy it to AWS.


Run Offline
===========

Once you ran the ``build`` script, your ``package.json`` will contain a script for the hot-development-mode.

Now run ``scripts {your_stackName} src/index.tsx`` or ``npm run {your_stackName}`` to start your web-app in
hot-development-mode (replace ``{your_stackName}`` with the stackName of your SinglePageApp-Component).

Wait until the console says that your app is running and open localhost:3000 in your browser.

You should see your app displaying "Hello from a React Web App!" - or whatever your own component renders.
Changes to your source code become effective immediately in this mode. Just edit your source code and reload your page
in the browser.

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


Domain
======

Have a look at our tutorial on how to register and prepare a domain within AWS.

If you specified an ``<Environment/>``-component with a ready-to-use-domain (do not forget to specify the ``certArn``!)
and once you deployed your app, you can initialize the domain with the following command::

    npm run domain-{your_environment_name}

**Note:** The ``domain``-script adds an entry to your ``.env``-file: ``DOMAIN_{your_environment_name}=TRUE``
You must not remove this flag or the connection to the domain might stop working. If you use a git-repository (what
you should do), make sure you add this flag to all the local copies.

**Note:** You only need to run this command once. But it may take quite some time (an hour) to complete!

**Note:** Once the script finishes, you can start using your domain. But you'll notice that the URL redirects to the
URL like https://{your_stackName}-{your_environment_name}.s3.amazonaws.com. This is a temporary redirect (code 307) that
AWS adds automatically. It may a day until AWS removes the redirect. Per AWS documentation
(http://docs.aws.amazon.com/AmazonS3/latest/dev/Redirects.html): Due to the distributed nature of Amazon S3,
requests can be temporarily routed to the wrong facility. This is most likely to occur immediately after
buckets are created or deleted. The redirect should circumvent this problem.