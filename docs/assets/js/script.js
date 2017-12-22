var qs = queryString.parse(location.search);
if (qs.name&&qs.method&&qs.script) {
  $("#bookmarklet-link")
    .text(qs.name || "bookmarklet")
    .attr("href", "javascript:" + encodeURIComponent(`(function(){if(!window.BMLoader){var s=document.createElement("script");s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v1.1.2/bookmarklet.min.js";document.body.append(s);s.onload=c}else{c()}function c(){BMLoader.${qs.method}(${qs.script}");}})()`));
  $("#user").show();
} else {
  $("input[name=method]:radio").change(e => {
    $("label[for=script]").text($(e.currentTarget).data("type"));
  }).change();
  $("#dev").show();
  $("#create").click(function() {
    $("#result").text(`Link to ${$("#name").val()}`).attr("href",`https://coolreader18.github.io/bookmarklet-loader?name=${encodeURIComponent($("#name").val())}&script=${encodeURIComponent($("#script").val())}&method=${$("input[name=method]:radio:checked").data("function")}`).attr("target","bmlinktest");
  });
}

