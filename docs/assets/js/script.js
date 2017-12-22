(function() {
  var qs = queryString.parse(location.search),
    $body = $(document.body);
  if (qs.script) {
    $body.append($("<div>").append($("<p>")
      .html("Drag this to your bookmarks bar: ").append(
        $("<a>").html(qs.name || "bookmarklet").attr("href", "javascript:" + encodeURIComponent("(function(){if (!window.BMLoader){var s = document.createElement(\"script\");s.src=\"https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v1.1.2/bookmarklet.min.js\";document.body.append(s);s.onload = callback;} else {callback();}function callback() {BMLoader.load" + (qs.github === undefined ? "Bookmarklet" : "Github") + "(\"" + qs.script + "\");}})()"))
      )
    ))
  } else {
    $body.append($("<div>").append("<h2>Bookmarklets</h2>")
  }
})();
