.. _Entry:

*****
Entry
*****

An ``<Entry/>``-component describes a type of items in your database.


Parents
=======

An ``<Entry />``-component is supported as a direct child of a :doc:`../components/datalayer`.
You can have any number of entries in your datalayer.


Properties
==========

The ``<Entry />``-component requires you to define the following properties:

* ``id`` the unique string that identifies your entry.
* ``primaryKey`` the name of the first queryable field
* ``rangeKey`` the name of the second queryable field
* ``data`` a Javascript object. each key in this object specifies a data field of the entry. The value specifies the
type of data. Currently, only ``GraphQLString`` is supported.


Allowed Children
================

The ``<Entry />``-component does not support children.