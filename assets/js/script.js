var qs = {};
for (let pair in new URL(location.href).searchParams.entries()) {
  qs[pair[0]] = pair[1];
});
if (qs.name && qs.method && qs.script) {
  $("#bookmarklet-link")
    .text(qs.name)
    .attr("href", `javascript:${encodeURIComponent(`{let c=()=>{BMLoader.${qs.method}("${qs.script}")};if(window.BMLoader){c()}else{let s=document.createElement("script");s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/v2.1.0/bookmarklet.min.js";document.body.append(s);s.onload=c}}`)}`);
  $("#user").show();
} else {
  $("input[name=method]:radio").change(e => {
    var checked = $("input[name=method]:radio:checked");
    $("label[for=script]").text(checked.data("type"));
    $("#script").attr("placeholder", checked.data("placeholder"))
  }).change();
  $("#dev").show
  $("#create").click(function() {
    $("#res-link").text($("#name").val()).attr("href",`https://coolreader18.github.io/bookmarklet-loader?name=${encodeURIComponent($("#name").val())}&script=${encodeURIComponent($("#script").val())}&method=${$("input[name=method]:radio:checked").data("function")}`).attr("target","bmlinktest");
    $("#result").show();
  });
}
