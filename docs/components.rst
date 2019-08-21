**********
Components
**********

Components complement the top-level-apps of an **infrastructure-components**-based project. Components are children
(direct or indirect) of the app, like::

    <SinglePageApp
        stackName = "example"
        buildPath = 'build'
        region='us-east-1' >

        <Route
            path='/'
            name='Infrastructure-Components'
            render={() => <div>Hello from a React Web App!</div>}/>

    </SinglePageApp>

Note: Which components you can use and may depend on the top-level-app.

:ref:`Webapp`
==============

The WebApp-Component is available only in an :doc:`apps/isomorphic`. In this context, it creates a client-app
with a custom html and Javascript code.

See :doc:`components/webapp` for more details.


:ref:`Service`
==================

The Service-Components is available in :doc:`apps/soa` and :doc:`apps/isomorphic`. It specifies a server-side route to
one or many :doc:`components/middleware`-components

See :doc:`components/service` for more details.

:ref:`Middleware`
==================

The Middleware-Components is available only in an :doc:`apps/isomorphic` or as child of a :doc:`components/service`.
In an Isomorphic App context, it specifies a server-side function that runs whenever a user requests a page from the server.

See :doc:`components/middleware` for more details.

:ref:`Route`
=============

A Route-Component specifies a custom path (at the domain of your app) that gets served by its render-function. This function
lets you easily render your own React-components.

See :doc:`components/route` for more details.


:ref:`Environment`
===================

An Environment-Component defines a runtime environment of your app. With environments you can distinguish your
development-environments from your production-environment. An environment lets you attach a real domain to it, like
www.your-domain.com.

See :doc:`components/environment` for more details.


:ref:`DataLayer`
================

The DataLayer-component adds a NoSQL-database (DynamoDB) to your app. It takes
It takes :doc:`components/entry` and :doc:`components/service` as children. The DataLayer is available in
a :doc:`apps/soa` and in an :doc:`apps/isomorphic`.

See :doc:`components/datalayer` for more details.


:ref:`Entry`
================

The Entry-component describes the type of items in your database. The entry must be a child of a :doc:`components/datalayer`.

See :doc:`components/entry` for more details.
