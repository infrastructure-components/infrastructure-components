.. _Service:

*******
Service
*******

A ``<Service/>``-component specifies a custom path that calls the middlewares you provide as children.
This function lets you easily provide backend functions.


Parents
=======

A ``<Service />``-component is supported as a direct child of an :doc:`apps/soa` or of a :doc:`apps/isomorphic`-component.
You can have any number of services in an app.


Properties
==========

The ``<Service />``-component requires you to define the following properties:

* ``path`` the relative path of the service at the domain, e.g. "/" for the root, or "/something"
* ``id`` the unique string that identifies your service.
* ``method`` the HTTP-method that your service listens to, valid values are: GET, POST, UPDATE, DELETE

Allowed Children
================

The ``<Service />``-component supports the following infrastructure-components as direct children:

* a :doc:`../components/middleware` lets  you specify a server-side function that runs whenever a user requests this exact route from the server.
