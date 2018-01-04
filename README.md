# Bookmarklet Loader
A bookmarklet loader using mrcoles/bookmarklet syntax. It allows for easy bookmarklet loading and processing from a remote url, using mrcoles' bookmarklet metadata, and it getting a file from the latest GitHub repository release.

## Usage
Look at [mrcoles/bookmarklet](https://github.com/mrcoles/bookmarklet), use that metadata if you'd like to. It lets you effectively 'require' scripts or import css, which makes things very easy.
Example of how you'd use this:
```javascript
{
  let c=()=>{
    BMLoader.loadGithub("<name>/<repo>/<path or whatever>/<file>.min.js")
  }
  if (window.BMLoader) {
    c()
  } else {
    let s = document.createElement("script");
    s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v2.0.0/bookmarklet.min.js";
    document.body.append(s);
    s.onload = c
  }
}
```
Keep in mind that this draws from GitHub releases, not git tags.
Other options are `loadBookmarklet("<url>")`, which loads directly from a given url, `processScript("<script>")`, which directly takes a script input, runs it through the parser, and executes it. You could also just copy the entirety of the bookmarkelt.min.js, and put your loader function after. Then minify it, bookmarklify it, whatever. Just make sure to keep the metadata, as it is in comments that would likely be removed.

## Credit
[mrcoles/bookmarklet](https://github.com/mrcoles/bookmarklet), I took some code from there to parse the bookmarklet files, and it uses his syntax in the first place. It also inspired me to make this in the first place, so kudos to him.
