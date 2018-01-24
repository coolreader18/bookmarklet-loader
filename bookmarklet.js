window.BMLoader = {
  version: "v2.2.3", //CHANGE WITH EACH RELEASE
  scripts: {},
  parseScript(data, providedmd) {
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
      },
      single: {
        start: /\s*@bookmarklet\s*/,
        match: /\s*@[^@]*/g
      }
    },
    md = {
      name: "",
      version: "",
      description: "",
      repository: "",
      author: [],
      email: "",
      url: "",
      license: "",
      script: [],
      style: [],
      var: [],
      async: false
    },
    options = {},
    code = [],
    errors = [],
    bookmarklet = false,
    processCmt = comment => {
      var match = comment.trim().match(/@([^\s]+)(?:\s+(.*))?$/);
      if (match) {
        var key = match[1],
        value = match[2];
        if (key !== undefined) {
          if (Array.isArray(md[key])) {
            options[key] = options[key] || [];
            options[key].push(value);
          } else if (typeof md[key] == "boolean") {
            try {
              options[key] = JSON.parse(value);
            } catch (e) {
              options[key] = true;
            }
          } else {
            options[key] = value;
          }
        } else {
          console.warn(`ignoring invalid metadata option: \`${key}\``);
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
          } else if (cmt.single.start.test(comment)) {
            comment.replace(cmt.single.start, "");
            for (var m = cmt.single.match.exec(comment); m; m = cmt.single.match.exec(comment)) {
              processCmt(m[0]);
            }
          }
        } else {
          if (canonicalComment == closeMetadata.toLowerCase()) {
            inBlock.md = false;
          } else {
            processCmt(comment);
          }
        }
      } else if (cmt.multi.end.test(line) && inBlock.multi) {
        inBlock.multi = false;
      } else if (inBlock.multi) {
        processCmt(line);
      } else if (cmt.multi.start.test(line)) {
        inBlock.multi = true;
        bookmarklet = true;
      } else {
        code.push(line);
      }
      if ((inBlock.md || inBlock.multi) && i + 1 == lines.length) {
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
  processScript(scripttext, providedmd) {
    return new Promise(async resolve => {
      var parsed = this.parseScript(scripttext, providedmd),
      meta = parsed.metadata,
      code = parsed.code,
      waitScript = new Promise(async resolveAll => {
        if (!meta.script) {
          resolveAll();
        } else {
          let scripts = meta.script;
          for (var i = 0; i < scripts.length; i++) {
            let toload = scripts[i], split = toload.split(" "),
            md;
            if (split[0] == "dir") {
              await this.getGithub("coolreader18/bookmarklet-loader/depend-dir-scripts.min.json")
              .then(dirurl => fetch(dirurl))
              .then(unpdir => unpdir.json())
              .then(dir => {
                var script = dir[split[1].toLowerCase()];
                toload = script.url.replace(/%version/, split[2] || script.latest);
                md = script.md;
              });
            }
          }
          await this.loadScript(toload, md);
          if (i == scripts.length - 1) {
            resolveAll();
          }
        }
      });
      if (meta.style) {
        meta.style.forEach(async cur => {
          var toload = cur, split = cur.split(" "), l = document.createElement("link");
          l.rel = "stylesheet";
          l.href = toload;
          if (split[0] == "dir") {
            await this.getGithub("coolreader18/bookmarklet-loader/depend-dir-styles.min.json")
            .then(dirurl => fetch(dirurl))
            .then(unpdir => unpdir.json()).then(dir => {
              var style = dir[split[1].toLowerCase()];
              toload = style.url.replace(/%version/, split[2] || style.latest);
            });
          }
          document.head.append(l);
        });
      }
      Object.assign(parsed.metadata, providedmd);
      await waitScript;
      var namespace;
      if (parsed.metadata.name) {
        namespace = this.scripts[meta.name] = this.scripts[meta.name] || parsed;
      }
      parsed.metadata.var = parsed.metadata.var || [];
      parsed.metadata.var = parsed.metadata.var.reduce((obj, cur) => {
        var split = cur.split(" ")
        obj[split[0]] = split[1] || split[0];
        return obj
      }, {});
      var module = {
        exports: undefined
      };
      if (parsed.bookmarklet) {
        namespace.clicks = namespace.clicks + 1 || 0;
        eval(`(${parsed.metadata.async ? "async " : ""}function(${Object.values(parsed.metadata.var).join()}){${code}})`).apply(namespace, eval(`[${Object.keys(parsed.metadata.var).join()}]`));
      } else {
        eval(code);
      }
      resolve(module.exports);
    });
  },
  loadScript(script, md) {
    return fetch(script).then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error("Couldn't load the bookmarklet");
      }
    }).then(js =>
      this.processScript(js, md)
    ).catch(alert)
  },
  get loadBookmarklet() {
    return BMLoader.loadScript
  },
  getGithub(file) {
    var filearr = file.split("/"),
    slug = filearr.slice(0, 2).join("/");
    return fetch(`https://api.github.com/repos/${slug}/releases/latest`).then(response => {
      if (response.ok) {
        return response.json().then(json => `https://cdn.rawgit.com/${slug}/${json.tag_name}/${filearr.slice(2).join("/")}`);
      } else {
        throw new Error("Couldn't connect to GitHub");
      }
    }).catch(alert);
  },
  loadGithub(file) {
    return this.getGithub(file).then(latest => this.loadScript(latest));
  }
};
