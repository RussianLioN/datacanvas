(() => {
  "use strict";

  const data = window.LISA_PROTOTYPE_DATA;
  if (!data || !Array.isArray(data.states) || data.states.length === 0) {
    throw new Error("Данные прототипа не загружены.");
  }

  const root = document.getElementById("prototype-root");
  const caption = document.getElementById("state-caption");
  const counter = document.getElementById("state-counter");
  const previousButton = document.getElementById("previous-state");
  const nextButton = document.getElementById("next-state");
  const slideNavigation = document.getElementById("slide-navigation");
  const previousSlideButton = document.getElementById("previous-slide");
  const nextSlideButton = document.getElementById("next-slide");
  const liveRegion = document.getElementById("prototype-live-region");
  const stateIds = data.states.map((state) => state.id);
  const states = new Map(data.states.map((state) => [state.id, state]));
  const phoneLayerRoles = ["system_top", "scroll_content", "system_bottom"];
  let currentIndex = readInitialIndex();
  let activeDocumentScroller = null;
  let currentSlideIndex = 0;
  let kineticFrame = 0;

  function readInitialIndex() {
    try {
      const values = new URLSearchParams(window.location.search).getAll("state");
      if (values.length === 1) {
        const index = stateIds.indexOf(values[0]);
        if (index >= 0) return index;
      }
    } catch {
      // При повреждённом адресе безопасно открывается первый экран.
    }
    return Math.max(0, stateIds.indexOf(data.initial_state_id));
  }

  function safeAssetPath(value) {
    if (typeof value !== "string" || !/^assets\/[a-z0-9-]+\.png$/u.test(value)) {
      throw new Error("В данных прототипа указан небезопасный путь к изображению.");
    }
    return value;
  }

  function requiredDimensions(value, label) {
    if (
      !value ||
      !Number.isFinite(value.width) ||
      !Number.isFinite(value.height) ||
      value.width <= 0 ||
      value.height <= 0
    ) {
      throw new Error(`${label}: неверные размеры.`);
    }
    return value;
  }

  function requiredRect(value, label) {
    if (
      !value ||
      !Number.isFinite(value.x) ||
      !Number.isFinite(value.y) ||
      !Number.isFinite(value.width) ||
      !Number.isFinite(value.height) ||
      value.width <= 0 ||
      value.height <= 0
    ) {
      throw new Error(`${label}: неверная область.`);
    }
    return value;
  }

  function isDocumentState(state) {
    return state?.presentation === "desktop" && state.scrollable === true;
  }

  function documentSlideCount(state) {
    const viewport = requiredDimensions(state.viewport, `${state.id}/viewport`);
    const logicalDimensions = requiredDimensions(state.asset?.logical_dimensions, `${state.id}/asset/logical_dimensions`);
    const slideCount = logicalDimensions.height / viewport.height;
    if (!Number.isInteger(slideCount) || slideCount <= 0) {
      throw new Error(`${state.id}: число слайдов должно быть положительным целым.`);
    }
    return slideCount;
  }

  function setAddress(stateId) {
    try {
      const url = new URL(window.location.href);
      url.search = "";
      url.searchParams.set("state", stateId);
      window.history.replaceState({ stateId }, "", url);
    } catch {
      // Сам прототип не зависит от возможности изменить локальный адрес.
    }
  }

  function announce(text) {
    liveRegion.textContent = text;
  }

  function cancelKinetics() {
    if (kineticFrame) window.cancelAnimationFrame(kineticFrame);
    kineticFrame = 0;
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function phoneLayers(state) {
    const layers = state.asset?.layers || state.raster_layers;
    if (!Array.isArray(layers) || layers.length !== phoneLayerRoles.length) {
      throw new Error(`${state.id}: телефонное состояние должно содержать три слоя.`);
    }
    return phoneLayerRoles.map((role) => {
      const layer = layers.find((candidate) => candidate.role === role);
      if (!layer) throw new Error(`${state.id}: отсутствует слой ${role}.`);
      return layer;
    });
  }

  function layerByRole(state, role) {
    return phoneLayers(state).find((layer) => layer.role === role);
  }

  function applyPixelLimits(state, scene) {
    const density = Math.max(1, Number(window.devicePixelRatio) || 1);
    if (state.presentation === "phone") {
      const contentLayer = layerByRole(state, "scroll_content");
      const physicalBodyRatio = data.device.body_mm.width / data.device.body_mm.height;
      const screenRatio = contentLayer.viewport_rect.width / (
        layerByRole(state, "system_top").viewport_rect.height +
        contentLayer.viewport_rect.height +
        layerByRole(state, "system_bottom").viewport_rect.height
      );
      const sourceScreenRatio = contentLayer.viewport_rect.width /
        (layerByRole(state, "system_top").viewport_rect.height + contentLayer.viewport_rect.height + layerByRole(state, "system_bottom").viewport_rect.height);
      const sourceScreenShare = sourceScreenRatio / physicalBodyRatio;
      scene.style.setProperty("--phone-pixel-limit", `${Math.floor(contentLayer.pixel_dimensions.width / sourceScreenShare / density)}px`);
      scene.style.setProperty("--phone-body-ratio", String(physicalBodyRatio));
      scene.style.setProperty("--phone-screen-ratio", String(screenRatio));
      scene.style.setProperty("--phone-screen-width-share", `${sourceScreenShare * 100}%`);
    } else {
      const viewport = requiredDimensions(state.viewport, `${state.id}/viewport`);
      const aspectRatio = `${viewport.width} / ${viewport.height}`;
      scene.style.setProperty("--desktop-aspect-ratio", aspectRatio);
      if (isDocumentState(state)) {
        const assetDimensions = requiredDimensions(state.asset?.pixel_dimensions, `${state.id}/asset`);
        scene.style.setProperty("--desktop-pixel-limit", `${Math.floor(assetDimensions.width / density)}px`);
      } else {
        scene.style.removeProperty("--desktop-pixel-limit");
      }
    }
  }

  function watchImage(image) {
    image.addEventListener("load", () => {
      const pending = Number(root.dataset.pendingImages || "1") - 1;
      root.dataset.pendingImages = String(Math.max(0, pending));
      if (pending <= 0) root.dataset.imageReady = "true";
    }, { once: true });
    image.addEventListener("error", () => {
      root.dataset.imageReady = "false";
      announce("Изображение текущего экрана не загрузилось.");
    }, { once: true });
  }

  function createProtectedImage({ src, alt, pixelDimensions, testId }) {
    const image = document.createElement("img");
    image.className = "protected-image";
    if (testId) image.dataset.testid = testId;
    image.alt = alt;
    image.width = pixelDimensions.width;
    image.height = pixelDimensions.height;
    image.decoding = "sync";
    image.draggable = false;
    watchImage(image);
    image.src = safeAssetPath(src);
    return image;
  }

  function installDragScrolling(scroller) {
    let drag = null;

    scroller.addEventListener("pointerdown", (event) => {
      if (
        event.pointerType === "touch" ||
        event.button !== 0 ||
        event.target.closest(".semantic-action") ||
        scroller.scrollHeight <= scroller.clientHeight
      ) return;
      cancelKinetics();
      drag = {
        pointerId: event.pointerId,
        y: event.clientY,
        time: event.timeStamp,
        velocity: 0,
      };
      scroller.dataset.dragging = "true";
      scroller.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    scroller.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const elapsed = Math.max(1, event.timeStamp - drag.time);
      const delta = drag.y - event.clientY;
      scroller.scrollTop += delta;
      drag.velocity = delta / elapsed;
      drag.y = event.clientY;
      drag.time = event.timeStamp;
      event.preventDefault();
    });

    function finish(event) {
      if (!drag || event.pointerId !== drag.pointerId) return;
      const velocity = drag.velocity * 16;
      drag = null;
      delete scroller.dataset.dragging;
      if (scroller.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
      let remainingVelocity = velocity;
      const step = () => {
        remainingVelocity *= .92;
        if (Math.abs(remainingVelocity) < .18) {
          kineticFrame = 0;
          return;
        }
        const before = scroller.scrollTop;
        scroller.scrollTop += remainingVelocity;
        if (scroller.scrollTop === before) {
          kineticFrame = 0;
          return;
        }
        kineticFrame = window.requestAnimationFrame(step);
      };
      if (Math.abs(remainingVelocity) >= .18 && !prefersReducedMotion()) {
        kineticFrame = window.requestAnimationFrame(step);
      }
    }

    scroller.addEventListener("pointerup", finish);
    scroller.addEventListener("pointercancel", finish);
  }

  function createLayerImage(state, layer, testId) {
    return createProtectedImage({
      src: layer.src,
      alt: state.caption,
      pixelDimensions: requiredDimensions(layer.pixel_dimensions, `${state.id}/${layer.role}`),
      testId,
    });
  }

  function createStaticLayer(state, layer, testId) {
    const slot = document.createElement("div");
    slot.className = `phone-fixed-layer phone-${layer.role.replace("_", "-")}`;
    slot.dataset.testid = testId;
    slot.append(createLayerImage(state, layer));
    return slot;
  }

  function addCta(state, contentLayer, content) {
    if (!state.cta_rect) return;
    const sourceRect = requiredRect(contentLayer.source_rect, `${state.id}/scroll_content`);
    const ctaRect = requiredRect(state.cta_rect, `${state.id}/CTA`);
    const control = document.createElement("button");
    control.type = "button";
    control.className = "semantic-action";
    control.dataset.testid = "order-presentation";
    control.dataset.actionId = "order-presentation";
    control.setAttribute("aria-label", "Сформировать презентацию");
    control.style.left = `${((ctaRect.x - sourceRect.x) / sourceRect.width) * 100}%`;
    control.style.top = `${((ctaRect.y - sourceRect.y) / sourceRect.height) * 100}%`;
    control.style.width = `${(ctaRect.width / sourceRect.width) * 100}%`;
    control.style.height = `${(ctaRect.height / sourceRect.height) * 100}%`;
    const controlLabel = document.createElement("span");
    controlLabel.className = "visually-hidden";
    controlLabel.textContent = "Сформировать презентацию";
    control.append(controlLabel);
    control.addEventListener("click", () => navigateToId(data.order_target_state_id, "Открыт экран формирования презентации."));
    content.append(control);
  }

  function createPhoneScene(state) {
    const topLayer = layerByRole(state, "system_top");
    const contentLayer = layerByRole(state, "scroll_content");
    const bottomLayer = layerByRole(state, "system_bottom");
    const topRect = requiredRect(topLayer.viewport_rect, `${state.id}/system_top`);
    const contentRect = requiredRect(contentLayer.viewport_rect, `${state.id}/scroll_content`);
    const bottomRect = requiredRect(bottomLayer.viewport_rect, `${state.id}/system_bottom`);
    const contentDimensions = requiredDimensions(contentLayer.logical_dimensions, `${state.id}/scroll_content`);
    const sourceBodyViewport = requiredRect(data.device?.source_body_viewport, "device/source_body_viewport");
    const sourceBodyCornerRadius = Number(data.device?.source_body_corner_radius);
    if (!Number.isFinite(sourceBodyCornerRadius) || sourceBodyCornerRadius <= 0) {
      throw new Error("device/source_body_corner_radius: неверный радиус.");
    }
    const screenHeight = topRect.height + contentRect.height + bottomRect.height;

    const scene = document.createElement("section");
    scene.className = "phone-scene";
    scene.dataset.testid = "phone-stage";
    scene.dataset.stateId = state.id;
    scene.dataset.presentation = "phone";
    scene.setAttribute("aria-label", state.caption);
    scene.style.setProperty("--phone-screen-width", `${contentRect.width}`);
    scene.style.setProperty("--phone-screen-height", `${screenHeight}`);
    scene.style.setProperty("--phone-top-height", `${topRect.height}fr`);
    scene.style.setProperty("--phone-content-height", `${contentRect.height}fr`);
    scene.style.setProperty("--phone-bottom-height", `${bottomRect.height}fr`);
    scene.style.setProperty("--phone-source-radius-x", `${(sourceBodyCornerRadius / sourceBodyViewport.width) * 100}%`);
    scene.style.setProperty("--phone-source-radius-y", `${(sourceBodyCornerRadius / sourceBodyViewport.height) * 100}%`);
    applyPixelLimits(state, scene);

    const screen = document.createElement("div");
    screen.className = "phone-screen";

    const scroller = document.createElement("div");
    scroller.className = "phone-scroll-viewport";
    scroller.dataset.testid = "phone-scroll-viewport";
    scroller.dataset.scrollable = String(state.scrollable);
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", state.scrollable ? "Прокручиваемая средняя область смартфона" : "Средняя область смартфона");

    const content = document.createElement("div");
    content.className = "phone-scroll-content";
    content.dataset.testid = "phone-scroll-content";
    content.style.aspectRatio = `${contentDimensions.width} / ${contentDimensions.height}`;
    content.append(createLayerImage(state, contentLayer));
    addCta(state, contentLayer, content);

    scroller.append(content);
    screen.append(
      createStaticLayer(state, topLayer, "phone-system-top"),
      scroller,
      createStaticLayer(state, bottomLayer, "phone-system-bottom"),
    );
    scene.append(screen);
    if (state.scrollable) installDragScrolling(scroller);
    return scene;
  }

  function createEmailScene(state) {
    const scene = document.createElement("section");
    scene.className = "desktop-scene email-scene";
    scene.dataset.testid = "email-stage";
    scene.dataset.stateId = state.id;
    scene.dataset.presentation = "desktop";
    scene.setAttribute("aria-label", state.caption);
    applyPixelLimits(state, scene);
    scene.append(createProtectedImage({
      src: state.asset.src,
      alt: state.caption,
      pixelDimensions: state.asset.pixel_dimensions,
      testId: "state-image",
    }));
    return scene;
  }

  function createDocumentScene(state) {
    const assetDimensions = requiredDimensions(state.asset?.pixel_dimensions, `${state.id}/asset`);
    if (assetDimensions.width !== 3840 || assetDimensions.height !== 6480) {
      throw new Error(`${state.id}: документ должен иметь PNG 3840x6480.`);
    }
    const slideCount = documentSlideCount(state);

    const scene = document.createElement("section");
    scene.className = "desktop-scene document-scene";
    scene.dataset.testid = "document-stage";
    scene.dataset.stateId = state.id;
    scene.dataset.presentation = "desktop";
    scene.setAttribute("aria-label", state.caption);
    applyPixelLimits(state, scene);

    const scroller = document.createElement("div");
    scroller.className = "document-scroll-viewport";
    scroller.dataset.testid = "document-scroll-viewport";
    scroller.dataset.currentSlide = "0";
    scroller.dataset.slideCount = String(slideCount);
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", "Прокручиваемый документ");
    scroller.addEventListener("scroll", () => syncSlideFromScroll(), { passive: true });

    const content = document.createElement("div");
    content.className = "document-scroll-content";
    content.style.height = `calc(${slideCount * 100}% + 1px)`;
    content.style.aspectRatio = `${state.viewport.width} / ${state.viewport.height * slideCount}`;
    content.append(createProtectedImage({
      src: state.asset.src,
      alt: state.caption,
      pixelDimensions: assetDimensions,
      testId: "state-image",
    }));

    scroller.append(content);
    scene.append(scroller);
    installDragScrolling(scroller);
    return scene;
  }

  function createDesktopScene(state) {
    return state.scrollable ? createDocumentScene(state) : createEmailScene(state);
  }

  function render() {
    cancelKinetics();
    const state = data.states[currentIndex];
    if (!states.has(state.id)) throw new Error("Состояние прототипа не найдено.");
    activeDocumentScroller = null;
    currentSlideIndex = 0;
    root.replaceChildren();
    root.dataset.stateId = state.id;
    root.dataset.presentation = state.presentation;
    root.dataset.imageReady = "false";
    root.dataset.pendingImages = state.presentation === "phone" ? "3" : "1";
    caption.textContent = state.caption;
    counter.textContent = `${currentIndex + 1} / ${data.states.length}`;
    previousButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === data.states.length - 1;
    const scene = state.presentation === "desktop" ? createDesktopScene(state) : createPhoneScene(state);
    root.append(scene);
    if (isDocumentState(state)) {
      activeDocumentScroller = scene.querySelector("[data-testid='document-scroll-viewport']");
      syncSlideFromScroll();
    }
    updateSlideControls();
    setAddress(state.id);
    document.body.dataset.prototypeReady = "true";
  }

  function navigateToIndex(nextIndex, message) {
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= data.states.length || nextIndex === currentIndex) return;
    currentIndex = nextIndex;
    render();
    announce(message || `Открыт экран ${currentIndex + 1} из ${data.states.length}.`);
  }

  function navigateToId(stateId, message) {
    navigateToIndex(stateIds.indexOf(stateId), message);
  }

  previousButton.addEventListener("click", () => navigateToIndex(currentIndex - 1));
  nextButton.addEventListener("click", () => navigateToIndex(currentIndex + 1));

  function updateSlideControls() {
    const state = data.states[currentIndex];
    const visible = isDocumentState(state) && activeDocumentScroller;
    slideNavigation.hidden = !visible;
    for (const button of [previousSlideButton, nextSlideButton]) {
      button.hidden = !visible;
      button.tabIndex = visible ? 0 : -1;
    }
    if (!visible) {
      previousSlideButton.disabled = true;
      nextSlideButton.disabled = true;
      return;
    }
    const slideCount = Number(activeDocumentScroller.dataset.slideCount);
    previousSlideButton.disabled = currentSlideIndex <= 0;
    nextSlideButton.disabled = currentSlideIndex >= slideCount - 1;
  }

  function syncSlideFromScroll() {
    if (!activeDocumentScroller) return;
    const slideCount = Number(activeDocumentScroller.dataset.slideCount);
    const viewportHeight = activeDocumentScroller.clientHeight;
    if (!Number.isFinite(slideCount) || slideCount <= 0 || viewportHeight <= 0) return;
    currentSlideIndex = Math.min(slideCount - 1, Math.max(0, Math.round(activeDocumentScroller.scrollTop / viewportHeight)));
    activeDocumentScroller.dataset.currentSlide = String(currentSlideIndex);
    updateSlideControls();
  }

  function moveSlide(delta) {
    if (!activeDocumentScroller) return;
    syncSlideFromScroll();
    const slideCount = Number(activeDocumentScroller.dataset.slideCount);
    const nextSlideIndex = currentSlideIndex + delta;
    if (!Number.isInteger(nextSlideIndex) || nextSlideIndex < 0 || nextSlideIndex >= slideCount) return;
    currentSlideIndex = nextSlideIndex;
    activeDocumentScroller.dataset.currentSlide = String(currentSlideIndex);
    updateSlideControls();
    activeDocumentScroller.scrollTo({
      top: currentSlideIndex * activeDocumentScroller.clientHeight,
      left: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }

  previousSlideButton.addEventListener("click", () => moveSlide(-1));
  nextSlideButton.addEventListener("click", () => moveSlide(1));

  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      navigateToIndex(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      navigateToIndex(currentIndex + 1);
    } else if (event.key === "ArrowUp" && activeDocumentScroller) {
      event.preventDefault();
      moveSlide(-1);
    } else if (event.key === "ArrowDown" && activeDocumentScroller) {
      event.preventDefault();
      moveSlide(1);
    }
  });

  window.addEventListener("resize", () => {
    const scene = root.firstElementChild;
    if (scene) applyPixelLimits(data.states[currentIndex], scene);
    if (activeDocumentScroller) {
      activeDocumentScroller.scrollTo({ top: currentSlideIndex * activeDocumentScroller.clientHeight, left: 0, behavior: "auto" });
      syncSlideFromScroll();
    }
  });

  render();
})();
