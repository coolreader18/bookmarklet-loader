BMLoader = {
  scripts: {}
};

BMLoader.parseFile = function(data) {
  var inMetadataBlock = false,
    openMetadata = '==Bookmarklet==',
    closeMetadata = '==/Bookmarklet==',
    rComment = /^(\s*\/\/\s*)/,
    md = {
      name: '',
      version: '',
      description: '',
      repository: '',
      author: '',
      email: '',
      url: '',
      license: '',
      script: [],
      style: [],
      init: []
    },
    options = {},
    code = [],
    errors = [],
    bookmarklet = false;

  data.match(/[^\r\n]+/g).forEach(function(line, i, lines) {
    if (rComment.test(line)) {
      var comment = line.replace(rComment, '').trim(),
        canonicalComment = comment.toLowerCase().replace(/\s+/g, '');

      if (!inMetadataBlock) {
        if (canonicalComment == openMetadata.toLowerCase()) {
          inMetadataBlock = true;
          bookmarklet = true;
        }
      } else {
        if (canonicalComment == closeMetadata.toLowerCase()) {
          inMetadataBlock = false;
        } else {
          var m = comment.match(/^@([^\s]+)\s+(.*)$/);
          if (m) {
            var k = m[1],
              v = m[2];
            if (k) {
              if (Array.isArray(md[k])) {
                options[k] = options[k] || [];
                options[k].push(v);
              } else {
                options[k] = v;
              }
            } else {
              warn('ignoring invalid metadata option: `' + k + '`');
            }
          }
        }
      }
    } else {
      code.push(line);
    }

    if (inMetadataBlock && i + 1 == lines.length) {
      errors.push('missing metdata block closing `' +
        closeMetadata + '`');
    }
  });
  return {
    metadata: options,
    code: code.join('\n'),
    errors: errors.length ? errors : null,
    bookmarklet: bookmarklet
  };
}

BMLoader.loadBookmarklet = function(script) {
  return fetch(script).then(function(response) {
    if (response.ok) {
      return response.text().then(BMLoader.processScript)
    } else if (xmlhttp.status == 400) {
      alert("Couldn't load the bookmarklet");
    }
  });
}

BMLoader.processScript = async function(scripttext) {
  var parsed = BMLoader.parseFile(scripttext),
    meta = parsed.metadata,
    code = parsed.code,
    waitScript = new Promise(async function(resolveAll) {
      if (!meta.script) {
        resolveAll()
      } else {
        meta.script.forEach(async function(cur, i, scripts) {
          await BMLoader.loadBookmarklet(cur);
          if (i == scripts.length - 1) {
            resolveAll();
          }
        })
      }
    });
  if (meta.style) {
    meta.style.forEach(function(cur) {
      var l = document.createElement("link");
      l.rel = "stylesheet";
      l.href = cur;
      document.head.append(l);
    })
  }
  await waitScript;
  if (parsed.bookmarklet) {
    var namespace = BMLoader.scripts[meta.name] = BMLoader.scripts[meta.name] || parsed;
    namespace.clicks = namespace.clicks + 1 || 0;
    eval("(function(){" + code + "})").apply(namespace);
  } else {
    eval(code);
  }
  return;
}

BMLoader.loadGithub = function(file) {
  var filearr = file.split("/"),
    slug = filearr.slice(0, 2).join("/"),
    filepath = filearr.slice(2).join("/");
  return fetch("https://api.github.com/repos/" + slug + "/releases/latest")
    .then(response => {
      if (response.ok) {
        response.json().then(release => {
          BMLoader.loadBookmarklet("https://cdn.rawgit.com/" + slug + "/" + release.tag_name + "/" + filepath);
        });
      } else {
        alert("Couldn't connect to GitHub");
      }
    });
};
