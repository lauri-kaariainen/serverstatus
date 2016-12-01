#Want to see sweet visualization of your linux server's status in the spirit of htop on the web?
Data scraped from "nmon" on unix systems.

#usage
<pre><code>
git clone {git url here};
cd serverstatus;
git checkout bundledserver;
npm install;
nodejs serverstatus.js;
</code></pre>
then test <a href="http://localhost:9010/">http://localhost:9010/</a>
#note: 
Master-branch only works as back-end, serving json out from http://localhost:9010/status .
If you want to use bundled frontend also, use bundledfrontend- or gh-pages-branch and try http://localhost:9010/ !

dependencies: nmon, nodejs, npm

#example of bundledfrontend:
https://lauri-kaariainen.github.io/serverstatus/frontend/index.html

