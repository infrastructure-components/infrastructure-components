***************
Getting Started
***************

Start with an Example
=====================

Our `GitHub-Repository <https://github.com/infrastructure-components>`_ contains exemplary projects of each supported
architecture topology:

* `Single-Page-App <https://github.com/infrastructure-components/singlepage_example>`_
* `Isomorphic App <https://github.com/infrastructure-components/isomorphic_example>`_

Fork or clone any of these repositories and run ``npm install``.


Install manually
================

You can install `infrastructure-components <https://github.com/infrastructure-components/infrastructure-components>`_
easily::

    npm install --save infrastructure-components


`infrastructure-scripts <https://github.com/infrastructure-components/infrastructure-scripts>`_
provide all the scripts required to `build`, `start`, and `deploy`. This lib contains many libraries that you only
need during development/deployment. Thus, install this library as devDependency::

    npm install --save-dev infrastructure-scripts

Infrastructure-components use the `Serverless framework <https://serverless.com/>`_ that you need to install globally::

    npm install -g serverless

Finally, apps (e.g. single-page-app, isomorphic-app) and components (environment, webapp) can have further dependencies.
Have a look at them in this documentation.