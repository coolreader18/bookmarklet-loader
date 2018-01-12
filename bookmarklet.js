BMLoader = {
  version: "v2.2.0", //CHANGE WITH EACH RELEASE
  scripts: {},
  parseFile: (data, providedmd) => {
    var inBlock = {
      md: false,
      multi: false
    },
    openMetadata = "==Bookmarklet==",
    closeMetadata = "==/Bookmarklet==",
    cmt = {
      cmt: /^(\s*\/\/\s*)/,
      multi: {
        start: /^(\s*\/\*\s*@bookmarklet\s*)/i,
        end: /^\s*\*\//
      }
    },
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
    bookmarklet = false,
    processCmt = comment => {
      var match = comment.match(/@([^\s]+)\s+(.*)$/);
      if (match) {
        var key = match[1],
        value = match[2];
        if (key) {
          if (Array.isArray(md[key])) {
            options[key] = options[key] || [];
            options[key].push(value);
          } else {
            options[key] = value;
          }
        } else {
          warn(`ignoring invalid metadata option: \`${k}\``);
        }
      }
    };
    data.match(/[^\r\n]+/g).forEach((line, i, lines) => {
      if (cmt.cmt.test(line)) {
        var comment = line.replace(cmt.cmt, "").trim(),
        canonicalComment = comment.toLowerCase().replace(/\s+/g, "");
        if (!inBlock.md) {
          if (canonicalComment == openMetadata.toLowerCase()) {
            inBlock.md = true;
            bookmarklet = true;
          }
        } else {
          if (canonicalComment == closeMetadata.toLowerCase()) {
            inBlock.md = false;
          } else {
            processCmt(comment);
          }
        }
      } else if (inBlock.multi) {
        processCmt(line);
      } else if (cmt.multi.start.test(line)) {
        inBlock.multi = true;
      } else if (cmt.multi.end.test(line)) {
        inBlock.multi = false;
      } else {
        code.push(line);
      }
      if (inBlock.md && i + 1 == lines.length) {
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
  processScript: (scripttext, providedmd) => new Promise(async resolve => {
    var parsed = BMLoader.parseFile(scripttext, providedmd), meta = parsed.metadata, code = parsed.code, waitScript = new Promise(async resolveAll => {
      if (!meta.script) {
        resolveAll();
      } else {
        let scripts = meta.script;
        for (var i = 0; i < scripts.length; i++) {
          let toload = scripts[i], split = toload.split(" "), md;
          if (split[0] == "dir") {
            await BMLoader.getGithub("coolreader18/bookmarklet-loader/depend-dir-scripts.min.json")
            .then(dirurl => {
              return fetch(dirurl);})
            .then(unpdir => unpdir.json())
            .then(dir => {
              var script = dir[split[1].toLowerCase()];
              toload = script.url.replace(/%version/, split[2] || script.latest);
              md = script.md;
            });
          }
          await BMLoader.loadBookmarklet(toload, md);
          if (i == scripts.length - 1) {
            resolveAll();
          }
        };
      }
    });
    if (meta.style) {
      meta.style.forEach(async cur => {
        var toload = cur, split = cur.split(" "), l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = toload;
        if (split[0] == "dir") {
          await BMLoader.getGithub("coolreader18/bookmarklet-loader/depend-dir-styles.min.json")
          .then(dirurl => fetch(dirurl))
          .then(unpdir => unpdir.json()).then(dir => {
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
    resolve();
  }),
  loadBookmarklet: (script, md) =>
    fetch(script).then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error("Couldn't load the bookmarklet");
      }
    }).then(js =>
      BMLoader.processScript(js, md)
    ).catch(alert)
  ,
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
  loadGithub: file => BMLoader.getGithub(file).then(latest => BMLoader.loadBookmarklet(latest))
};
