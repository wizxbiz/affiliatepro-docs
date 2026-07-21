// share-util.js — helper แชร์มาตรฐานเดียวสำหรับหน้า legacy HTML
// ทุกการแชร์ → ลิงก์ /s/<type>/<id> (Worker render OG preview → redirect เนื้อหาจริง)
(function () {
  var SHARE_BASE = 'https://tuktukfeed.com';

  function buildShareUrl(type, id) {
    return SHARE_BASE + '/s/' + type + '/' + encodeURIComponent(id);
  }

  // แชร์: navigator.share → clipboard → prompt
  function tuktukShare(opts) {
    var type = opts.type || 'post';
    var id = opts.id;
    var title = opts.title || 'TukTuk Thailand';
    var text = (opts.text ? String(opts.text).slice(0, 160) : title);
    var url = buildShareUrl(type, id);

    if (navigator.share) {
      return navigator.share({ title: title, text: text, url: url })
        .then(function () { return 'shared'; })
        .catch(function () { return copyLink(url); });
    }
    return Promise.resolve(copyLink(url));
  }

  function copyLink(url) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(function () { window.prompt('คัดลอกลิงก์:', url); });
    } else {
      window.prompt('คัดลอกลิงก์:', url);
    }
    return 'copied';
  }

  // แชร์ตรงไป LINE / Facebook (เปิด dialog)
  function shareToLine(type, id, text) {
    var url = buildShareUrl(type, id);
    var msg = (text ? text + '\n' : '') + url;
    window.open('https://line.me/R/share?text=' + encodeURIComponent(msg), '_blank');
  }

  function shareToFacebook(type, id) {
    var url = buildShareUrl(type, id);
    window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url), '_blank');
  }

  window.buildShareUrl = buildShareUrl;
  window.tuktukShare = tuktukShare;
  window.tuktukShareToLine = shareToLine;
  window.tuktukShareToFacebook = shareToFacebook;
})();
