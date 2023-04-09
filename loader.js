(function() {
    var dedupeId = 'brandMessengerBundleScript';
    if (!document.getElementById(dedupeId)) {
        var url = 'https://brand-messenger.app.khoros.com/branches/brand-messenger-v1.823.0/bundle.js';
        var scriptTag = document.createElement('script');
        scriptTag.src = url;
        scriptTag.id = dedupeId;
        scriptTag.charset = 'utf-8';
        document.head.appendChild(scriptTag);
    }
})();
