


master_doc = 'index'
project = u'Infrastructure-Components'
copyright = '2019, Frank Zickert'
htmlhelp_basename = 'Infrastructure-Components-Doc'
language = 'en'
gettext_compact = False

html_theme = 'sphinx_rtd_theme'
#html_logo = 'img/logo.svg'
html_theme_options = {
    'logo_only': True,
    'display_version': False,
}
# sphinx-notfound-page
# https://github.com/rtfd/sphinx-notfound-page
notfound_context = {
    'title': 'Page Not Found',
    'body': '''
<h1>Page Not Found</h1>

<p>Sorry, we couldn't find that page.</p>

<p>Try using the search box or go to the homepage.</p>
''',
}