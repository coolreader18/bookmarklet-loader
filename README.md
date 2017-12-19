# Bookmarklet Loader
A bookmarklet loader using mrcoles/bookmarklet syntax

## Usage
Example of how you'd use this:
```
var s = document.createElement("script");
s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v1.1/bookmarklet.min.js";
document.body.append(s);
s.onload = function() {
  loadGithub("name/repo","path/file.min.js");
}
```
 Minify it, bookmarklify it with http://mrcoles.com/bookmarklet, whatever. Keep in mind that this draws from GitHub releases, not git tags.
 
## Credit

[mrcoles/bookmarklet](https://github.com/mrcoles/bookmarklet), I took some code from there to parse the bookmarklet files.
