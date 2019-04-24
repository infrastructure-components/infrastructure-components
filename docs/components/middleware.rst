.. _Middleware:

**********
Middleware
**********

An :doc:`apps/isomorphic` renders ``<WebApp />``-Components at the server-side and returns the rendered html as response
to the client requesting the url. ``<Middleware />``-components let you add code executed at the server before the html is returned.

The concept of middlewares is taken directly from `Express.js <https://expressjs.com/de/>`_.

Middlewares apply in the order of hierarchy and in the order they are defined in your app! This means, middlewares higher
in the hierarchy (at ``<IsomorphicApp />`` level) apply before lower-level middlewares (e.g. ``<WebApp/>``, ``<Route/>``)

Parents
=======

A ``<Middleware />`` component is supported as a direct child of an :doc:`apps/isomorphic`, a :doc:`../components/webapp`, or
a :doc:`../components/route`.

Depending on its location, it will have a broader or narrower scope of requests it applies to.


Properties
==========

The ``<Middleware />``-component requires you to define the following properties:

* ``callback`` is a function, either ``(req, res, next) => {}`` or ``(err, req, res, next) => {}``

This callback is used as an Express.js-Middleware.

The callback has the following arguments:

* ``req`` is the request-object received from the client. It contains all the information you may want to work with
* ``res`` is the response-object that you can use to return a response to the client, e.g. ``res.status(200).send('Your Response');``. Note: if you respond from within a middleware, following middlewares and any following ``<Route/>``-components will not be called anymore! If you want to provide data to subsequent middlewares, complement the ``req`` object with your data.
* ``next`` is a function that you can call to hand over to the next middleware.

If you specify a middleware with four arguments, i.e. then the first argument is:

* ``err`` an error that has been thrown previously and which you can act on now.

When a middleware throws an error, only subsequent middlewares with error-handling apply. If no error is thrown, middlewares
with an error-handling do **not** apply.