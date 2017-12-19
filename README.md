# Bookmarklet Loader
A bookmarklet loader using mrcoles/bookmarklet syntax

## Usage
Look at [mrcoles/bookmarklet](https://github.com/mrcoles/bookmarklet), use that metadata syntax to do it.
Example of how you'd use this:
```
var s = document.createElement("script");
s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v1.1/bookmarklet.min.js";
document.body.append(s);
s.onload = function() {
  loadGithub("<name>/<repo>","<path>/<file>.min.js");
}
```
Keep in mind that this draws from GitHub releases, not git tags.
Other options are `loadScript("<url>")`, which loads directly from a given url, and `processScript("<script>")`, which directly takes a script input, runs it through the parser, and executes it. Then minify it, bookmarklify it with http://mrcoles.com/bookmarklet, whatever. Just make sure to keep the metadata, as it is in comments that would likely be removed.
 
## Credit
[mrcoles/bookmarklet](https://github.com/mrcoles/bookmarklet), I took some code from there to parse the bookmarklet files, and it uses his syntax in the first place.
