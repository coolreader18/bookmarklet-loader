---
---
var qs = {};
for (pair of new URL(location.href).searchParams.entries()) {
  qs[pair[0]] = pair[1];
};
if (qs.name && qs.method && qs.script) {
  (async () => {
    if (qs.ver == 'latest' || !qs.ver) {
      qs.ver = (await $.getJSON("https://api.github.com/repos/coolreader18/bookmarklet-loader/releases/latest")).tag_name
    }
    $("#bookmarklet-link")
    .text(qs.name)
    .attr("href", `javascript:${encodeURIComponent(`{let c=()=>{BMLoader.${qs.method}("${qs.script}")};if(window.BMLoader){c()}else{let s=document.createElement("script");s.src="https://cdn.rawgit.com/coolreader18/bookmarklet-loader/${qs.ver}/bookmarklet.min.js";document.body.append(s);s.onload=c}}`)}`);
    $("#user").show();
  })()
} else {
  $("#method").change(e => {
    var methods = {{ site.data.methods | replace: "=>", ":" }};
    for (m of methods) {
      if (m.label.toLowerCase() == e.currentTarget.value.toLowerCase()) {
        curmethod = m;
        break;
      }
    }
    $("#script").attr("placeholder", curmethod.placeholder)
    $("label[for=script]").text(curmethod.type)
  }).change();
  $(() => {
    $(".select").material_select()
    $.getJSON("https://api.github.com/repos/coolreader18/bookmarklet-loader/releases")
    .done(json => {
      $("#version").material_select("destroy");
      var group;
      $("#version").append(group = $("<optgroup label='Individual Versions'>"));
      json.forEach(rel => {
        group.append($("<option>").val(rel.tag_name).text(rel.tag_name));
      })
      $("#version").material_select();
    });
  })
  $("#dev").show()
  $("#create").click(function() {
    if ($("#name:valid").length && $("#script:valid").length) {
      var url = new URL("https://coolreader18.github.io/bookmarklet-loader"),
      params = url.searchParams;
      params.set("name", $("#name").val());
      params.set("script", $("#script").val());
      params.set("method", curmethod.function);
      params.set("ver", $("#version").val());
      $("#res-link").text($("#name").val()).attr("href", '?' + params.toString()).attr("target","bmlinktest");
      $("#result").show();
    }
  });
}
