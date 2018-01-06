BMLoader = {
  scripts: {},
  parseFile: (data, providedmd) => {
    var inMetadataBlock = false,
    openMetadata = "==Bookmarklet==",
    closeMetadata = "==/Bookmarklet==",
    rComment = /^(\s*\/\/\s*)/,
    md = {
      name: "",
      version: "",
      description: "",
      repository: "",
      author: "",
      email: "",
      url: "",
      license: "",
      script: [],
      style: []
    },
    options = {},
    code = [],
    errors = [],
    bookmarklet = false;
    data.match(/[^\r\n]+/g).forEach((line, i, lines) => {
      if (rComment.test(line)) {
        var comment = line.replace(rComment, "").trim(), canonicalComment = comment.toLowerCase().replace(/\s+/g, "");
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
              var k = m[1], v = m[2];
              if (k) {
                if (Array.isArray(md[k])) {
                  options[k] = options[k] || [];
                  options[k].push(v);
                } else {
                  options[k] = v;
                }
              } else {
                warn(`ignoring invalid metadata option: \`${k}\``);
              }
            }
          }
        }
      } else {
        code.push(line);
      }
      if (inMetadataBlock && i + 1 == lines.length) {
        errors.push(`missing metdata block closing \`${closeMetadata}\``);
      }
    });
    return {
      metadata: Object.assign(options, providedmd),
      code: code.join("\n"),
      errors: errors.length ? errors : null,
      bookmarklet: bookmarklet
    };
  },
  processScript: async (scripttext, providedmd) => {
    var parsed = BMLoader.parseFile(scripttext, providedmd), meta = parsed.metadata, code = parsed.code, waitScript = new Promise(async resolveAll => {
      if (!meta.script) {
        resolveAll();
      } else {
        meta.script.forEach(async (cur, i, scripts) => {
          var toload = cur, split = cur.split(" "), md;
          if (split[0] == "dir") {
            await BMLoader.getGithub("coolreader18/bookmarklet-loader/depend-dir-scripts.min.json").then(dirurl => fetch(dirurl)).then(unpdir => unpdir.json()).then(dir => {
              var script = dir[split[1].toLowerCase()];
              toload = script.url.replace(/%version/, split[2] || script.latest);
              md = script.md;
            });
          }
          await BMLoader.loadBookmarklet(toload, md);
          if (i == scripts.length - 1) {
            resolveAll();
          }
        });
      }
    });
    if (meta.style) {
      meta.style.forEach(async cur => {
        var toload = cur, split = cur.split(" "), l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = toload;
        if (split[0] == "dir") {
          await BMLoader.getGithub("coolreader18/bookmarklet-loader/depend-dir-styles.min.json").then(dirurl => fetch(dirurl)).then(unpdir => unpdir.json()).then(dir => {
            var style = dir[split[1].toLowerCase()];
            toload = style.url.replace(/%version/, split[2] || style.latest);
          });
        }
        document.head.append(l);
      });
    }
    Object.assign(parsed, providedmd);
    await waitScript;
    if (parsed.bookmarklet) {
      var namespace = BMLoader.scripts[meta.name] = BMLoader.scripts[meta.name] || parsed;
      namespace.clicks = namespace.clicks + 1 || 0;
      eval(`(function(){${code}})`).call(namespace);
    } else {
      eval(code);
    }
    return;
  },
  loadBookmarklet: (script, md) => {
    return fetch(script).then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error("Couldn't load the bookmarklet");
      }
    }).then(js => {
      BMLoader.processScript(js, md);
    }).catch(alert);
  },
  parseGithub: file => {
    var filearr = file.split("/");
    return {
      slug: filearr.slice(0, 2).join("/"),
      filepath: filearr.slice(2).join("/")
    };
  },
  getGithub: file => {
    var parsed = BMLoader.parseGithub(file);
    return fetch(`https://api.github.com/repos/${parsed.slug}/releases/latest`).then(response => {
      if (response.ok) {
        return response.json().then(json => `https://cdn.rawgit.com/${parsed.slug}/${json.tag_name}/${parsed.filepath}`);
      } else {
        throw new Error("Couldn't connect to GitHub");
      }
    }).catch(alert);
  },
  loadGithub: file => {
    BMLoader.getGithub(file).then(latest => BMLoader.loadBookmarklet(latest));
  }
};
