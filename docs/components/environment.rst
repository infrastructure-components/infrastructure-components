.. _Environment:

***********
Environment
***********


An ``<Environment/>``-component specifies a runtime environment of your app. With environments you can distinguish your
development-environments from your production-environment.


Parents
=======

An ``<Environment />``-component is supported as a direct child of an app-component, i.e. either
:doc:`apps/spa` or :doc:`apps/isomorphic`.


Properties
==========

The ``<Environment />``-component requires you to define the following properties:

* ``name`` is the name of the environment that serves as literal in scripts that work with a certain environment, like ``deploy``. Thus, use short names, with no special characters other than hyphens.
* ``domain`` (optional) is a valid domain, including subdomains (e.g. www) and top-level-domain (e.g. com) that this environment should be available at. Note: you need to have this domain registered and setup in your AWS account!
* ``certArn`` (optional, required in an Single-Page-App-environment with a domain) specifies the ARN (identifier) of the`certificate that covers your domain, e.g. ``"arn:aws:acm:us-east-1:************:certificate/********-****-****-****-************"`, not required of an isomorphic app.
* ``offlinePort`` (optional) specifies the port number when running your app locally, replaces the port ``:3000``.

You can have multiple environments per app.