Gravity Simulator
=================
JavaScript gravity simulator using WebGL to render. Because this project uses
worker threads, you need a real web server during development (i.e., you can't
just load it from the file system on your computer or else the cross site scripting
security feature will kick in and deny your worker script from being loaded). To
deal with this, you can use the SimpleHTTPServer built into python. Simply cd to
this directory, and then run `python -m SimpleHTTPServer`.
