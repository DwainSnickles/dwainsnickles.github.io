/* Share buttons: drop <div class="share" data-share data-url="…" data-title="…"></div>
   anywhere and this fills it with X / LinkedIn / Facebook / Reddit / copy-link buttons.
   Pages rendered later by JS (repo.html) can call window.MountShare() again. */
(function () {
  "use strict";

  var SVG = {
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    reddit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485l-2.286 2.286C.775 23.225 1.097 24 1.738 24H12c6.627 0 12-5.373 12-12S18.627 0 12 0zm4.388 3.199c1.104 0 1.999.895 1.999 1.999 0 1.105-.895 2-1.999 2-.946 0-1.739-.657-1.947-1.539v.002c-1.147.162-2.032 1.15-2.032 2.341v.007c1.776.067 3.4.567 4.686 1.363.473-.363 1.064-.58 1.707-.58 1.547 0 2.802 1.254 2.802 2.802 0 1.117-.655 2.081-1.601 2.531-.088 3.256-3.637 5.876-7.997 5.876-4.361 0-7.905-2.617-7.998-5.87-.954-.447-1.614-1.415-1.614-2.538 0-1.548 1.255-2.802 2.803-2.802.645 0 1.239.218 1.712.585 1.275-.79 2.881-1.291 4.64-1.365v-.01c0-1.663 1.263-3.034 2.88-3.207.188-.911.993-1.595 1.959-1.595zm-8.085 8.376c-.784 0-1.459.78-1.506 1.797-.047 1.016.64 1.429 1.426 1.429.786 0 1.371-.369 1.418-1.385.046-1.017-.553-1.841-1.338-1.841zm7.406 0c-.786 0-1.384.824-1.338 1.841.047 1.017.634 1.385 1.418 1.385.785 0 1.473-.413 1.426-1.429-.046-1.017-.721-1.797-1.506-1.797zm-3.703 4.013c-.974 0-1.907.048-2.77.135-.147.015-.241.168-.183.305.483 1.154 1.622 1.964 2.953 1.964 1.33 0 2.47-.81 2.953-1.964.057-.137-.037-.29-.184-.305-.863-.087-1.795-.135-2.769-.135z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
  };

  var NETWORKS = [
    { key: "x", label: "Share on X", href: function (u, t) { return "https://twitter.com/intent/tweet?url=" + encodeURIComponent(u) + "&text=" + encodeURIComponent(t); } },
    { key: "linkedin", label: "Share on LinkedIn", href: function (u) { return "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(u); } },
    { key: "facebook", label: "Share on Facebook", href: function (u) { return "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(u); } },
    { key: "reddit", label: "Share on Reddit", href: function (u, t) { return "https://www.reddit.com/submit?url=" + encodeURIComponent(u) + "&title=" + encodeURIComponent(t); } }
  ];

  function el(tag, className, html) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (html !== undefined) node.innerHTML = html;
    return node;
  }

  function mount(container) {
    if (container.dataset.shareMounted) return;
    container.dataset.shareMounted = "1";

    var url = container.getAttribute("data-url") || window.location.href;
    var title = container.getAttribute("data-title") || document.title;

    var label = el("span", "share__label", "Share");
    container.appendChild(label);

    NETWORKS.forEach(function (network) {
      var link = el("a", "share__btn", SVG[network.key]);
      link.href = network.href(url, title);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", network.label);
      link.title = network.label;
      container.appendChild(link);
    });

    var copy = el("button", "share__btn share__btn--copy", SVG.copy);
    copy.type = "button";
    copy.setAttribute("aria-label", "Copy link");
    copy.title = "Copy link";
    copy.addEventListener("click", function () {
      var done = function () {
        copy.classList.add("is-copied");
        window.setTimeout(function () { copy.classList.remove("is-copied"); }, 1400);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, function () { window.prompt("Copy this link:", url); });
      } else {
        window.prompt("Copy this link:", url);
      }
    });
    container.appendChild(copy);
  }

  window.MountShare = function () {
    document.querySelectorAll("[data-share]:not([data-share-mounted])").forEach(mount);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", window.MountShare);
  } else {
    window.MountShare();
  }
})();
