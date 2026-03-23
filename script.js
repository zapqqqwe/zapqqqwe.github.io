(() => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const renderLatestPosts = async () => {
    const listEl = document.getElementById("postList");
    if (!listEl) return;

    const emptyEl = document.getElementById("postListEmpty");

    try {
      const res = await fetch("./content.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`Failed to load content.json (${res.status})`);
      const posts = await res.json();

      const normalized = Array.isArray(posts) ? posts : [];
      normalized.sort((a, b) => {
        const da = a?.date ? Date.parse(a.date) : 0;
        const db = b?.date ? Date.parse(b.date) : 0;
        return db - da;
      });

      const latest = normalized.slice(0, 6);
      if (latest.length === 0) {
        if (emptyEl) emptyEl.hidden = false;
        return;
      }

      listEl.innerHTML = latest
        .map((post) => {
          const title = String(post?.title ?? "Untitled");
          const path = String(post?.path ?? "");

          const d = post?.date ? new Date(post.date) : null;
          const dateText = d && !Number.isNaN(d.valueOf()) ? d.toISOString().slice(0, 10) : "";

          const tagNames = Array.isArray(post?.tags)
            ? post.tags
                .map((t) => String(t?.name ?? "").trim())
                .filter(Boolean)
                .slice(0, 3)
            : [];

          const tagsHtml =
            tagNames.length > 0
              ? `<span class="post-tags">${tagNames
                  .map((n) => `<span class="tag">${escapeHtml(n)}</span>`)
                  .join("")}</span>`
              : "";

          return `
            <li class="post-item">
              <a class="post-link" href="/${path}">
                <span class="post-title">${escapeHtml(title)}</span>
                <span class="post-meta">${escapeHtml(dateText)}${tagsHtml}</span>
              </a>
            </li>
          `;
        })
        .join("");

      if (emptyEl) emptyEl.hidden = true;
    } catch (err) {
      if (emptyEl) {
        emptyEl.textContent = "Could not load posts list (content.json missing).";
        emptyEl.hidden = false;
      }
      // Keep silent in console in production; uncomment to debug.
      // console.error(err);
    }
  };

  const escapeHtml = (input) =>
    String(input)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  renderLatestPosts();

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) {
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => el.classList.add("is-revealed"));
  } else {
    // Apply stagger delays automatically for lists/grids.
    const setStagger = (selector, stepMs, startMs = 0) => {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((el, i) => {
        const existing = el.style.getPropertyValue("--d");
        if (!existing) el.style.setProperty("--d", `${startMs + i * stepMs}ms`);
      });
    };

    setStagger(".cards .card[data-reveal]", 70, 0);
    setStagger(".timeline .timeline-item[data-reveal]", 60, 0);

    // Make the header feel like a "page load" animation rather than a scroll reveal.
    document
      .querySelectorAll(".site-header[data-reveal]")
      .forEach((el) => el.classList.add("is-revealed"));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" },
    );

    document.querySelectorAll("[data-reveal]").forEach((el) => {
      if (el.classList.contains("is-revealed")) return;
      observer.observe(el);
    });
  }
})();
