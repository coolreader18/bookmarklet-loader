var qs = queryString.parse(location.search);
if (qs.script) {
  $("#bookmarklet-link")
    .text(qs.name || "bookmarklet")
    .attr("href", "javascript:" + encodeURIComponent(`(function(){if(!window.BMLoader){var s=document.createElement("script");s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v1.1.2/bookmarklet.min.js";document.body.append(s);s.onload=c}else{c()}function c(){BMLoader.load${qs.github === undefined ? "Bookmarklet" : "Github"}(${qs.script}");}})()`));
  $("#user").show();
} else {
  $("input[name=method]:radio").change(e => {
    $("label[for='url']").text(this.value);
  }).change();
  $("#dev").show();
  $("#create").click(function() {
    $("#result").text(`https://coolreader18.github.io/bookmarklet?name=${$("#name").val()}&script=${$("#script").val()}&github`);
  });
}

