window.BMLoader = {
  version: "v2.2.3", // CHANGE WITH EACH RELEASE
  scripts: {},
  parseScript(data, providedmd) { // parses the script
    var inBlock = {
      md: false,
      multi: false
    },
    openMetadata = "==Bookmarklet==",
    closeMetadata = "==/Bookmarklet==",
    cmt = { // different comment regex's
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
    md = { // possible metadata values
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
    processCmt = comment => { // parses a comment
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
    data.match(/[^\r\n]+/g).forEach((line, i, lines) => { // parses each line
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
      } else if (cmt.multi.end.test(line) && inBlock.multi) { // ↓ checks for a multiline metadata block
        inBlock.multi = false;
      } else if (inBlock.multi) {
        processCmt(line);
      } else if (cmt.multi.start.test(line)) {
        inBlock.multi = true;
        bookmarklet = true;
      } else {
        code.push(line); // pushes line to the running code if it isn't in a md block
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
  processScript(scripttext, providedmd) { // process bookmarklet
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
      ["var", "async"].forEach(cur => { // metadata that fits better in the base object
        if (parsed[cur]) {
          parsed[cur] = parsed.metadata[cur];
          delete parsed[cur];
        }
      })
      Object.assign(parsed.metadata, providedmd);
      await waitScript; // wait for the scripts to be loaded before running the script that needs them
      var namespace;
      if (parsed.metadata.name) {
        namespace = this.scripts[meta.name] = this.scripts[meta.name] || parsed;
      }
      parsed.var = parsed.var || [];
      parsed.var = parsed.var.reduce((obj, cur) => {
        var split = cur.split(" ")
        obj[split[0]] = split[1] || split[0];
        return obj
      }, {});
      var module = {
        exports: undefined
      };
      if (parsed.bookmarklet) {
        namespace.clicks = namespace.clicks + 1 || 0;
        eval(`(${parsed.metadata.async ? "async " : ""}function(${Object.values(parsed.var).join()}){${code}})`) // possibility for async, args
        .apply(namespace, eval(`[${Object.keys(parsed.var).join()}]`)); // run the function with the vars requested
      } else {
        eval(code); // if it's not a bookmarklet, just run the code normally
      }
      resolve(module.exports);
    });
  },
  loadScript(script, md) { // load script from url
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
  get loadBookmarklet() { // backward compatibility
    return BMLoader.loadScript
  },
  getGithub(file) { // get cdn.rawgit link of a github repo's file
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
  loadGithub(file) { // load script from latest github release
    return this.getGithub(file).then(latest => this.loadScript(latest));
  }
};
