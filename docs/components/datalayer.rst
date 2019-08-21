.. _DataLayer:

*********
DataLayer
*********

A ``<DataLayer/>``-component adds a DynamoDB database to your app.


Parents
=======

A ``<DataLayer />``-component is supported as a direct child of an :doc:`apps/soa` or of a :doc:`apps/isomorphic`-component.
You can have a single DataLayer in an app.


Properties
==========

The ``<DataLayer />``-component requires you to define the following properties:

* ``id`` the unique string that identifies your datalayer.


Allowed Children
================

The ``<DataLayer />``-component supports the following infrastructure-components as direct children:

* a :doc:`../components/service` specifies a backend service that has access to the database.
* an :doc:`../components/entry` describes the type of items in your database.

The ``<DataLayer />`` can have multiple services and entries as children.