var str = 1,
  list = 2,
  metadata = {
    types: {
      string: str,
      list: list
    },
    keys: {
      name: str,
      version: str,
      description: str,
      repository: str,
      author: str,
      email: str,
      url: str,
      license: str,
      script: list,
      style: list
    }
  };

function quoteEscape(x) {
  return x.replace('"', '\\"').replace("'", "\\'");
}

function convert(codein) {
  var stylesCode = '';
  var codetmp = parseFile(codein);
  var options = codetmp.options;
  var code = codetmp.code;
  if (options.script) {
    options.script = options.script.reverse();
    for (var i = 0, len = options.script.length; i < len; i++) {
      code = loadScript(code, options.script[i]);
    }
  }

  if (options.style) {
    for (var j = 0, length = options.style.length; j < length; j++) {
      stylesCode += 'var link = document.createElement("link"); link.rel="stylesheet"; link.href = "' + quoteEscape(options.style[j]) + '"; document.body.appendChild(link);';
    }
    code = stylesCode + code;
  }
  return code;
}

function parseFile(data) {
  var inMetadataBlock = false,
    openMetadata = '==Bookmarklet==',
    closeMetadata = '==/Bookmarklet==',
    rComment = /^(\s*\/\/\s*)/,
    mdKeys = metadata.keys,
    mdTypes = metadata.types,
    options = {},
    code = [],
    errors = [];

  // parse file and gather options from metadata block if available
  data.match(/[^\r\n]+/g).forEach(function(line, i, lines) {

    // comment
    if (rComment.test(line)) {
      var comment = line.replace(rComment, '').trim(),
        canonicalComment = comment.toLowerCase().replace(/\s+/g, '');

      if (!inMetadataBlock) {
        if (canonicalComment == openMetadata.toLowerCase()) {
          inMetadataBlock = true;
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
              if (mdKeys[k] == mdTypes.list) {
                options[k] = options[k] || [];
                options[k].push(v);
              } else {
                options[m[1]] = m[2];
              }
            } else {
              warn('ignoring invalid metadata option: `' + k + '`');
            }
          }
        }
      }

      // code
    } else {
      code.push(line);
    }

    if (inMetadataBlock && i + 1 == lines.length) {
      errors.push('missing metdata block closing `' +
        closeMetadata + '`');
    }
  });

  return {
    code: code.join('\n'),
    options: options,
    errors: errors.length ? errors : null
  };
}

function quoteEscape(x) {
  return x.replace('"', '\\"').replace("'", "\\'");
}

function loadScript(code, path) {
  return 'function callback(){' + code + '}' + 'var s = document.createElement("script"); if (s.addEventListener) {s.addEventListener("load", callback, false)} else if (s.readyState) {s.onreadystatechange = callback}s.src = "' + quoteEscape(path) + '";document.body.appendChild(s);'
}

function loadBookmarklet(script) {
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4) {
      if (xmlhttp.status == 200) {
        processScript(xmlhttp.responseText);
      } else if (xmlhttp.status == 400) {
        alert('There was an error 400');
      }
    }
  };
  xmlhttp.open("GET", script, true);
  xmlhttp.send();
}

function processScript(scripttext) {
  eval(convert(scripttext));
}

function loadGithub(slug, filepath) {
  function filterEmpty(str) {
    return str.split("/").filter(function(elem) {
      return elem !== ""
    }).join("/");
  }
  slug = filterEmpty(slug);
  var gitRequest = new XMLHttpRequest();
  gitRequest.onreadystatechange = function() {
    if (gitRequest.readyState == 4) {
      if (gitRequest.status == 200) {
        filepath = filterEmpty(filepath);
        loadBookmarklet("https://cdn.rawgit.com/" + slug + "/" + JSON.parse(gitRequest.responseText).tag_name + "/" + filepath);
      } else if (gitRequest.status == 400) {
        alert("Couldn't connect to GitHub");
      }
    }
  };
  gitRequest.open("GET", "https://api.github.com/repos/" + slug + "/releases/latest", true)
  gitRequest.send();
}
