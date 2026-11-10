(() => {
  document.documentElement.classList.add("js");

  const config = window.LEGAL_SITE_CONFIG || {};
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reduceMotion = motionPreference.matches;
  let leavingPage = false;
  let cancelIdleTask = () => {};
  let cleanupMotion = () => {};
  const motionCleanups = new Set();
  let imageWarmObserver = null;
  const pendingImageWarmups = new Set();
  const getAnchorOffset = () => Number.parseFloat(window.getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const getHashTarget = () => {
    if (!window.location.hash) return null;
    try {
      return document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch {
      return null;
    }
  };
  const registerMotionCleanup = (cleanup) => motionCleanups.add(cleanup);

  const lenis = typeof window.Lenis === "function"
    ? new window.Lenis({
      autoRaf: true,
      lerp: 0.1,
      anchors: { offset: getAnchorOffset() },
      smoothWheel: true,
      syncTouch: false,
      stopInertiaOnNavigate: true,
      respectReducedMotion: true,
      prevent: (node) => Boolean(node.closest?.("[data-lenis-prevent]"))
    })
    : null;

  const handleInPageAnchorClick = (event) => {
    const anchor = event.target instanceof Element ? event.target.closest('a[href*="#"]') : null;
    if (!anchor) return;
    try {
      const url = new URL(anchor.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash) {
        lenis.resize();
        if (lenis.options.anchors && typeof lenis.options.anchors === "object") {
          lenis.options.anchors.offset = getAnchorOffset();
        }
      }
    } catch {
      // Links inválidos continuam com o comportamento nativo do navegador.
    }
  };

  const syncHistoryPosition = () => {
    if (lenis) {
      lenis.resize();
      lenis.scrollTo(window.scrollY, { immediate: true, force: true });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        lenis.resize();
        const target = getHashTarget() || window.scrollY;
        lenis.scrollTo(target, { immediate: true, force: true, offset: getAnchorOffset() });
      }));
    }
  };

  const resizeLenis = () => {
    if (lenis) {
      lenis.resize();
      if (lenis.options.anchors && typeof lenis.options.anchors === "object") {
        lenis.options.anchors.offset = getAnchorOffset();
      }
    }
  };

  if (lenis) {
    document.addEventListener("click", handleInPageAnchorClick, true);
    window.addEventListener("popstate", syncHistoryPosition);
    window.addEventListener("resize", resizeLenis, { passive: true });
    registerMotionCleanup(() => {
      document.removeEventListener("click", handleInPageAnchorClick, true);
      window.removeEventListener("popstate", syncHistoryPosition);
      window.removeEventListener("resize", resizeLenis);
    });

    if (window.location.hash) {
      requestAnimationFrame(() => {
        lenis.resize();
        lenis.scrollTo(getHashTarget() || window.scrollY, {
          immediate: true,
          force: true,
          offset: getAnchorOffset()
        });
      });
    }
  }

  const bindValues = {
    firmName: config.firmName || "NOME DO ESCRITÓRIO",
    city: config.city || "CIDADE · UF",
    address: config.address || ""
  };

  Object.entries(bindValues).forEach(([key, value]) => {
    document.querySelectorAll(`[data-bind="${key}"]`).forEach((node) => {
      node.textContent = value;
    });
  });

  if (config.firmName) document.title = `${config.firmName} | Advocacia`;
  const year = document.querySelector("#current-year");
  if (year) year.textContent = String(new Date().getFullYear());

  const contactLinks = document.querySelectorAll("[data-contact-link]");
  contactLinks.forEach((link) => {
    const kind = link.dataset.contactLink;
    if (kind === "email" && config.contactEmail) {
      link.href = `mailto:${config.contactEmail}`;
      link.textContent = config.contactEmail;
    }
    if (kind === "phone" && config.phone) {
      const digits = config.phone.replace(/\D/g, "");
      link.href = `tel:${digits}`;
      link.textContent = config.phone;
    }
  });

  const menuButton = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#nav-principal");
  const setMenuOpen = (open) => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    nav.classList.toggle("is-open", open);
  };

  menuButton?.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setMenuOpen(false);
  });

  const typewriterTargets = new Set([
    ...document.querySelectorAll(".display-heading.reveal:not(.word-reveal)"),
    ...document.querySelectorAll(".reveal h3")
  ]);
  const graphemeSegmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter(document.documentElement.lang || "pt-BR", { granularity: "grapheme" })
    : null;

  typewriterTargets.forEach((heading) => {
    heading.classList.add("reveal", "typewrite-ready");
    heading.dataset.typewrite = "true";
    const accessibleCopy = heading.cloneNode(true);
    accessibleCopy.querySelectorAll("br").forEach((lineBreak) => lineBreak.replaceWith(" "));
    const accessibleText = (accessibleCopy.textContent || "").replace(/\s+/gu, " ").trim();
    if (accessibleText && !heading.hasAttribute("aria-label")) heading.setAttribute("aria-label", accessibleText);
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let typeIndex = 0;

    textNodes.forEach((textNode) => {
      const text = textNode.nodeValue || "";
      const characters = graphemeSegmenter
        ? [...graphemeSegmenter.segment(text)].map((part) => part.segment)
        : Array.from(text);
      const fragment = document.createDocumentFragment();

      characters.forEach((character) => {
        if (/^\s+$/u.test(character)) {
          fragment.append(document.createTextNode(character));
          return;
        }
        const span = document.createElement("span");
        span.className = "type-char";
        span.setAttribute("aria-hidden", "true");
        span.textContent = character;
        span.style.setProperty("--type-index", String(typeIndex++));
        fragment.append(span);
      });

      textNode.replaceWith(fragment);
    });

    const step = Math.min(24, 950 / Math.max(1, typeIndex - 1));
    heading.querySelectorAll(".type-char").forEach((character) => {
      const index = Number.parseInt(character.style.getPropertyValue("--type-index"), 10) || 0;
      character.style.setProperty("--type-delay", `${Math.round(index * step)}ms`);
    });
  });

  const allRevealItems = [...document.querySelectorAll(".reveal")];
  const revealGroups = [...document.querySelectorAll("[data-reveal-group]")].map((group) => ({
    target: group,
    items: [...group.querySelectorAll(":scope > [data-reveal-group-item]")]
  }));
  const groupedRevealItems = new Set(revealGroups.flatMap((group) => group.items));
  const individualRevealItems = allRevealItems.filter((item) => !groupedRevealItems.has(item));
  const revealResetTimers = new Map();
  const revealVersions = new WeakMap();
  let revealObserver = null;
  let revealResetObserver = null;
  let idleTaskId = null;
  let idleTaskKind = "";

  const clearIdleTask = () => {
    if (idleTaskId === null) return;
    if (idleTaskKind === "idle" && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleTaskId);
    } else {
      window.clearTimeout(idleTaskId);
    }
    idleTaskId = null;
    idleTaskKind = "";
  };

  cancelIdleTask = () => {
    clearIdleTask();
    pendingImageWarmups.clear();
  };

  const decodeImage = (image) => {
    if (!(image instanceof HTMLImageElement)) return Promise.resolve();
    image.fetchPriority = "low";
    image.loading = "eager";
    if (typeof image.decode === "function") return image.decode().catch(() => {});
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
  };

  const scheduleImageWarmups = () => {
    if (idleTaskId !== null || !pendingImageWarmups.size || leavingPage) return;
    const flush = () => {
      idleTaskId = null;
      idleTaskKind = "";
      if (leavingPage) return;
      const images = [...pendingImageWarmups];
      pendingImageWarmups.clear();
      images.forEach((image) => { void decodeImage(image); });
    };

    if (typeof window.requestIdleCallback === "function") {
      idleTaskKind = "idle";
      idleTaskId = window.requestIdleCallback(flush, { timeout: 1500 });
    } else {
      idleTaskKind = "timeout";
      idleTaskId = window.setTimeout(flush, 180);
    }
  };

  const heroImage = document.querySelector(".hero-art img");
  const heroDecode = heroImage && typeof heroImage.decode === "function"
    ? heroImage.decode().catch(() => {})
    : Promise.resolve();

  if ("IntersectionObserver" in window) {
    imageWarmObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        imageWarmObserver.unobserve(entry.target);
        pendingImageWarmups.add(entry.target);
        heroDecode.then(scheduleImageWarmups);
      });
    }, { threshold: 0, rootMargin: "1000px" });

    document.querySelectorAll('img[loading="lazy"]').forEach((image) => imageWarmObserver.observe(image));
  }
  registerMotionCleanup(() => imageWarmObserver?.disconnect());

  const nextRevealVersion = (item) => {
    const version = (revealVersions.get(item) || 0) + 1;
    revealVersions.set(item, version);
    return version;
  };

  const setRevealDelay = (item, delay = 0) => {
    item.style.setProperty("--reveal-delay", `${Math.min(300, Math.max(0, delay))}ms`);
  };

  const applyRevealVisibility = (item, visible) => {
    const existingTimer = revealResetTimers.get(item);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      revealResetTimers.delete(item);
    }

    if (visible) {
      item.classList.remove("is-resetting", "typewrite-complete");
      item.classList.add("is-visible");
      return;
    }

    setRevealDelay(item, 0);
    if (!item.classList.contains("is-visible")) return;
    item.classList.add("is-resetting");
    item.classList.remove("is-visible");
    const timer = window.setTimeout(() => {
      item.classList.remove("is-resetting");
      revealResetTimers.delete(item);
    }, 320);
    revealResetTimers.set(item, timer);
  };

  const setRevealVisibility = (item, visible) => {
    const version = nextRevealVersion(item);
    if (!visible) {
      applyRevealVisibility(item, false);
      return;
    }

    const images = item.matches("[data-service-carousel]")
      ? (() => {
        const viewport = item.querySelector("[data-service-viewport]");
        const viewportRect = viewport?.getBoundingClientRect();
        const visibleImages = [...item.querySelectorAll(".service-card img")].filter((image) => {
          if (!viewportRect) return false;
          const imageRect = image.getBoundingClientRect();
          return imageRect.right > viewportRect.left && imageRect.left < viewportRect.right;
        });
        return visibleImages.length
          ? visibleImages
          : [item.querySelector(".service-card.is-active img") || item.querySelector(".service-photo")].filter(Boolean);
      })()
      : [...item.querySelectorAll("img")];
    Promise.all(images.map(decodeImage)).then(() => {
      if (leavingPage || reduceMotion || revealVersions.get(item) !== version) return;
      applyRevealVisibility(item, true);
    });
  };

  const setGroupVisibility = (group, visible) => {
    const versions = group.items.map((item) => nextRevealVersion(item));
    if (!visible) {
      group.items.forEach((item) => applyRevealVisibility(item, false));
      return;
    }

    const images = group.items.flatMap((item) => [...item.querySelectorAll("img")]);
    Promise.all(images.map(decodeImage)).then(() => {
      const stillCurrent = group.items.every((item, index) => revealVersions.get(item) === versions[index]);
      if (leavingPage || reduceMotion || !stillCurrent) return;
      group.items.forEach((item, index) => {
        setRevealDelay(item, index * 90);
        applyRevealVisibility(item, true);
      });
    });
  };

  const disconnectRevealObservers = () => {
    revealObserver?.disconnect();
    revealResetObserver?.disconnect();
    revealObserver = null;
    revealResetObserver = null;
  };

  const showAllReveals = () => {
    disconnectRevealObservers();
    revealResetTimers.forEach((timer) => window.clearTimeout(timer));
    revealResetTimers.clear();
    allRevealItems.forEach((item) => {
      nextRevealVersion(item);
      setRevealDelay(item, 0);
      item.classList.remove("is-resetting");
      item.classList.add("is-visible");
      if (item.classList.contains("typewrite-ready")) item.classList.add("typewrite-complete");
    });
  };

  const startRevealObservers = () => {
    disconnectRevealObservers();
    if (reduceMotion || !("IntersectionObserver" in window)) {
      showAllReveals();
      return;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const group = revealGroups.find((candidate) => candidate.target === entry.target);
        if (group) setGroupVisibility(group, true);
        else setRevealVisibility(entry.target, true);
      });
    }, { threshold: 0, rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.25)}px 0px` });

    revealResetObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) return;
        const group = revealGroups.find((candidate) => candidate.target === entry.target);
        if (group) setGroupVisibility(group, false);
        else setRevealVisibility(entry.target, false);
      });
    }, { threshold: 0, rootMargin: "32px 0px 32px 0px" });

    [...individualRevealItems, ...revealGroups.map((group) => group.target)].forEach((item) => {
      revealObserver.observe(item);
      revealResetObserver.observe(item);
    });
  };

  startRevealObservers();
  const handleMotionPreferenceChange = (event) => {
    reduceMotion = event.matches;
    if (reduceMotion) showAllReveals();
    else startRevealObservers();
  };
  const refreshRevealObservers = () => {
    if (!reduceMotion) startRevealObservers();
  };
  motionPreference.addEventListener("change", handleMotionPreferenceChange);
  window.addEventListener("resize", refreshRevealObservers, { passive: true });
  registerMotionCleanup(() => {
    motionPreference.removeEventListener("change", handleMotionPreferenceChange);
    window.removeEventListener("resize", refreshRevealObservers);
    disconnectRevealObservers();
    revealResetTimers.forEach((timer) => window.clearTimeout(timer));
    revealResetTimers.clear();
  });

  document.querySelectorAll(".word-reveal").forEach((heading) => {
    heading.querySelectorAll(".word").forEach((word, index) => {
      word.style.setProperty("--word-index", index);
    });
  });

  const serviceCarousel = document.querySelector("[data-service-carousel]");
  if (serviceCarousel) {
    const viewport = serviceCarousel.querySelector("[data-service-viewport]");
    const cards = [...serviceCarousel.querySelectorAll(".service-card")];
    const serviceSection = serviceCarousel.closest(".services-section");
    const previousButton = serviceSection?.querySelector("[data-service-prev]");
    const nextButton = serviceSection?.querySelector("[data-service-next]");
    let activeIndex = 0;
    let scrollFrame = 0;
    let initialFrame = 0;

    const scrollByPage = (direction) => {
      if (!viewport) return;
      const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      viewport.scrollBy({ left: direction * viewport.clientWidth * 0.8, behavior });
    };

    const updateActiveCard = () => {
      if (!viewport || !cards.length) return;
      const center = viewport.getBoundingClientRect().left + viewport.clientWidth / 2;
      activeIndex = cards.reduce((closestIndex, card, index) => {
        const cardCenter = card.getBoundingClientRect().left + card.offsetWidth / 2;
        const closestCenter = cards[closestIndex].getBoundingClientRect().left + cards[closestIndex].offsetWidth / 2;
        return Math.abs(cardCenter - center) < Math.abs(closestCenter - center) ? index : closestIndex;
      }, 0);
      cards.forEach((card, index) => card.classList.toggle("is-active", index === activeIndex));
      const maxScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
      if (previousButton) previousButton.disabled = viewport.scrollLeft <= 1;
      if (nextButton) nextButton.disabled = viewport.scrollLeft >= maxScroll - 1;
    };

    const handleCarouselScroll = () => {
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        updateActiveCard();
      });
    };
    const handleCarouselResize = () => updateActiveCard();
    const handleCarouselKeydown = (event) => {
      if (event.target !== viewport) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollByPage(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollByPage(1);
      }
    };
    const handlePrevious = () => scrollByPage(-1);
    const handleNext = () => scrollByPage(1);

    viewport?.addEventListener("scroll", handleCarouselScroll, { passive: true });
    viewport?.addEventListener("keydown", handleCarouselKeydown);
    previousButton?.addEventListener("click", handlePrevious);
    nextButton?.addEventListener("click", handleNext);
    window.addEventListener("resize", handleCarouselResize);
    registerMotionCleanup(() => {
      viewport?.removeEventListener("scroll", handleCarouselScroll);
      viewport?.removeEventListener("keydown", handleCarouselKeydown);
      previousButton?.removeEventListener("click", handlePrevious);
      nextButton?.removeEventListener("click", handleNext);
      window.removeEventListener("resize", handleCarouselResize);
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (initialFrame) cancelAnimationFrame(initialFrame);
    });
    initialFrame = requestAnimationFrame(() => {
      initialFrame = 0;
      if (viewport) viewport.scrollLeft = 0;
      updateActiveCard();
    });
  }

  const methodStage = document.querySelector("[data-method-stage]");
  const methodScene = methodStage?.querySelector("[data-method-scene]");
  const methodVisual = methodStage?.querySelector("[data-method-visual]");
  if (methodStage && methodScene && methodVisual) {
    const getMethodCardOffset = () => {
      const photoWidth = parseFloat(window.getComputedStyle(methodVisual).width) || 0;
      const gap = parseFloat(window.getComputedStyle(methodScene).columnGap) || 0;
      return Math.max(0, (photoWidth - gap) / 2);
    };

    if (reduceMotion) {
      methodStage.style.setProperty("--method-image-scale", "1");
      methodStage.style.setProperty("--method-image-opacity", "1");
      methodStage.style.setProperty("--method-card-offset", `${getMethodCardOffset()}px`);
    } else {
      let methodFrame = 0;
      const updateMethodImage = () => {
        if (methodFrame) return;
        methodFrame = requestAnimationFrame(() => {
          methodFrame = 0;
          let progress;

          if (window.matchMedia("(max-width: 700px)").matches) {
            const imageTop = methodVisual.getBoundingClientRect().top;
            const start = window.innerHeight * 0.92;
            const distance = window.innerHeight * 0.82;
            progress = (start - imageTop) / distance;
          } else {
            const stageTop = methodStage.getBoundingClientRect().top;
            const stickyTop = parseFloat(window.getComputedStyle(methodScene).top) || 0;
            const travel = Math.max(1, methodStage.offsetHeight - methodScene.offsetHeight);
            progress = (stickyTop - stageTop) / travel;
          }

          progress = Math.max(0, Math.min(1, progress));
          methodStage.style.setProperty("--method-image-scale", String(0.08 + progress * 0.92));
          methodStage.style.setProperty("--method-image-opacity", String(Math.min(1, progress * 1.35)));
          methodStage.style.setProperty("--method-card-offset", `${getMethodCardOffset() * progress}px`);
        });
      };

      window.addEventListener("scroll", updateMethodImage, { passive: true });
      window.addEventListener("resize", updateMethodImage);
      registerMotionCleanup(() => {
        window.removeEventListener("scroll", updateMethodImage);
        window.removeEventListener("resize", updateMethodImage);
        if (methodFrame) cancelAnimationFrame(methodFrame);
      });
      updateMethodImage();
    }
  }

  document.querySelectorAll(".faq-item").forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      document.querySelectorAll(".faq-item[open]").forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  const form = document.querySelector("#contact-form");
  const note = document.querySelector("#form-note");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!config.contactEmail) {
      note.textContent = "Configure o e-mail do escritório em site.config.js antes de habilitar o formulário.";
      note.setAttribute("role", "status");
      return;
    }

    const data = new FormData(form);
    const subject = `Pedido de contato pelo site — ${data.get("area")}`;
    const message = [
      `Nome: ${data.get("name")}`,
      `E-mail: ${data.get("email")}`,
      `Assunto geral: ${data.get("area")}`,
      "",
      `Resumo: ${data.get("summary") || "Não informado"}`,
      "",
      "A mensagem foi preparada no navegador. A pessoa remetente precisa confirmar o envio no aplicativo de e-mail."
    ].join("\n");
    window.location.href = `mailto:${encodeURIComponent(config.contactEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    note.textContent = "Rascunho aberto no aplicativo de e-mail. Confira o destinatário e o conteúdo antes de enviar.";
  });

  cleanupMotion = () => {
    cancelIdleTask();
    motionCleanups.forEach((cleanup) => cleanup());
    motionCleanups.clear();
    lenis?.destroy();
  };

  window.addEventListener("pagehide", (event) => {
    if (event.persisted) {
      lenis?.stop();
      return;
    }
    leavingPage = true;
    cleanupMotion();
  });

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    leavingPage = false;
    lenis?.resize();
    lenis?.start();
    if (!reduceMotion) startRevealObservers();
  });
})();
