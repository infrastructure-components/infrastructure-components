*******
Scripts
*******


The library `infrastructure-scripts <https://github.com/infrastructure-components/infrastructure-scripts>`_ provides
the scripts command.

Run it with one of the arguments specified below and the relative path to the file that exports the your app-component,
e.g. ``src/index.tsx``.

Scripts enable you to ``build``, ``start`` (offline), ``deploy``, and attach a ``domain`` to your
**infrastructure-components**-based project.


Build
=====

The ``build``-script prepares your project for local start or deployment::

    scripts build src/index.tsx

If you prefer using the usual ``npm run build`` command for building, simply add the following script to your
``package.json`` file::

    "scripts": {
      "build": "scripts build src/index.tsx"
    }

The build process adds further scripts to your ``package.json``.
These let you start your software stack offline, start hot development, and deploy it.

Which scripts are created depends on your app-component and its ``<Environment />``- and ``<WebApp />``-components.

Look at the app-components for more details on the created scripts:

* :doc:`apps/spa`
* :doc:`apps/isomorphic`


Run Offline
===========

Run ``scripts {your_stackName} src/index.tsx`` or ``npm run {your_stackName}`` to start your ``<SinglePageApp />`` or
your ``<WebApp />`` within an ``<IsomorphicApp />`` in hot-development-mode.

Wait until the console says that your app is running and open localhost:3000 in your browser.

Changes to your source code become effective immediately in this mode. Just edit your source code and reload your page
in the browser. Note that an ``<IsomorphicApp />`` does not run with a backend (e.g. middlewares) in this mode!

If you want to stop the app, use "ctrl-c" (or whatever command your console-application uses to interrupt a running script).


Start
=====

The script ``npm run start-{your_environment_name}`` starts your ``<IsomorphicApp />`` locally (offline).

Open your the url localhost:3000 in a browser and you can see your application in action. Have a look at the console
of your development environment for outputs made on server-side (e.g. middlewares)

Note: Changes at your source code require running ``npm run build`` before they become effective in this mode!


Deploy
======

Once you ran the ``build`` script, your ``package.json`` will contain
a script for each environment your app contains::

    npm run deploy-{your_environment_name}


From here, the scripts create the whole infrastructure stack on your AWS account.
You'll get back an URL that now serves your app.

Note: This script may take some time to complete!


Domain
======

Have a look at our tutorial on how to register and prepare a domain within AWS.

If you specified an ``<Environment/>``-component with a ready-to-use-domain
and once you deployed your app, you can initialize the domain with the following command::

    npm run domain-{your_environment_name}

Note: You only need to run this command once. But it may take quite some time to complete!