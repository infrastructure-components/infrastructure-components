.. _Route:

*****
Route
*****

A ``<Route/>``-component specifies a custom path (at the domain of your app) that gets served by its render-function.
This function lets you easily render your own React-components.

You can regard it as a page of your app/website.

Parents
=======

A ``<Route />``-component is supported as a direct child of an :doc:`apps/spa` or of a ``<WebApp />``-component in an
``<IsomorhpicApp />``. In both cases, there may be multiple ``<Route />``-components.


Properties
==========

The ``<Route />``-component requires you to define the following properties:

* ``path`` the relative path of the route at the domain, e.g. "/" for the root, or "/something"
* ``name`` the name is used as the html-title
* ``render`` (optional) is a function ``() => React.node`` e.g. ``() => <div>Hi</div>`` that needs to return a React node to be rendered.
* ``component`` (optional) is a React-Element that you specified/imported, e.g. ``Something``, with ``<Something />`` being the rendered element.

You must specify either ``render`` or ``component``!

Allowed Children
================

The ``<Route />``-component supports the following infrastructure-components as direct children:

* a :doc:`../components/middleware` lets  you specify a server-side function that runs whenever a user requests this exact route from the server.
