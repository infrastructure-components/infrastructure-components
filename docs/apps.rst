****
Apps
****

Apps represent the top-level-components of an **infrastructure-components**-based project. In your entry-point
source file, e.g. ``src/index.tsx`` (yes, you can use typescript with jsx-extension in this file -- out of the box),
you need to export an app-component as default, like this::

    import * as React from 'react';

    import {
        SinglePageApp
    } from "infrastructure-components";

    export default (
        <SinglePageApp
            stackName = "spa-example"
            buildPath = 'build'
            region='us-east-1' />
    );

The app-component determines the architecture of your project at runtime. Each architecture has advantages and may be
suited for certain use-cases.

While a change of the architecture is a breaking change in a traditional project setup, **infrastructure-compponents**
support this out of the box! If you want to change the architecture of your application, just replace the
top-level-component and you're done!

Each app-component supports running it offline (on your development machine) and deploying it to the Amazon Web Services
(AWS) cloud with a single command!


:ref:`SinglePageApp`
=====================

A Single-Page-App (SPA) is an interactive web application that rewrites the current page rather than loading new pages
from a server. In fact, a SPA consists of a very basic html that simply loads the app`s Javascript-code. Once loaded,
this code creates a user experience that avoids interruption between successive pages and behaves more like a desktop
application than a traditional website.

:doc:`apps/spa` provides further details on Infrastructure-Component's ``SinglePageApp``.


:ref:`IsomorphicApp`
====================

An Ismorphic-App (aka universal app) is an interactive web application that complements the advantages of a single-page-app
with the ability of server-side-rendering. In an isomorphic setting, the server renders the whole Javascript-code
and returns a full html-file to the browser. As a result, the browser can display the html without any further processing.

An Isomorphic-App downloads the Javascript-code to the browser, too. This enables a dynamic user experience.

:doc:`apps/isomorphic` provides further details on Infrastructure-Component's ``IsomorphicApp``.