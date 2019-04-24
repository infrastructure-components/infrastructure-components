.. _WebApp:

******
Webapp
******

An :doc:`apps/isomorphic` renders ``<WebApp />``-Components at the server-side and returns the rendered html as response
to the client requesting the url. Further, it provides the whole app as Javascript code for download to enable
a dynamic user experience.

If your application stack needs to serve completely separated applications that come with different html-templates
or different React-components it may make sense to use more than one ``<WebApp />``.

If you simply require different "pages", using multiple ``<Route/>``-components is the better choice.

Parents
=======

A ``<WebApp />`` component is supported as a direct child of an :doc:`apps/isomorphic`. An ``<IsomorhpicApp />`` can
have multiple WebApp-children. In this case, make sure the regular expression in the property ``path`` clearly distinguishes
all the possible paths.

Properties
==========

The WebApp-component requires you to define the following properties:

* ``id`` the (arbitrary) name of your webapp, please use only lower case characters and hyphens for the name serves as identifier within AWS
* ``path``the relative  path of the route, e.g. "/" for the root, or "/something", or "*" for any. Can be a regular expression.
* ``method`` the http-method that this app will work with, e.g. "GET", "POST", "PUT", "DELETE"


Allowed Children
================

The WebApp-component supports the following infrastructure-components as direct children:

* a :doc:`../components/route` lets you specify a custom path (at the domain of your app) that gets served by its render-function. You should have at least the home-path-route ("/") in any meaningful web-application.
* a :doc:`../components/middleware` lets  you specify a server-side function that runs whenever a user requests a page from the server. When you specify it as a direct child of your ``<WebApp/>`` then it applies to all routes of this webapp. If you want ``<Middleware/>``s to apply to a single ``<Route/>``, put them as children to ` ``<Route/>``

A ``<WebApp />`` can have multiple ``<Route/>`` and ``<Middleware />`` children.