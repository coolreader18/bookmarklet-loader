$(function() {
  var qs = queryString.parse(location.search),
    $body = $(document.body);
  if (qs.script) {
    $body.append($("<div>").append($("<p>")
      .html("Drag this to your bookmarks bar: ").append(
        $("<a>").html(qs.name || "bookmarklet").attr("href", "javascript:" + qs.script)
      )
    ))
  } else {
    $body.append("<p>I'm tired, wait pls</p>");
  }
});
