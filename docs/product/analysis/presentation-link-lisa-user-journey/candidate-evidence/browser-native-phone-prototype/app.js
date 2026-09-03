(() => {
  "use strict";

  const data = window.LISA_BROWSER_NATIVE_PHONE_DATA;
  const root = document.querySelector("#prototype-root");
  const controls = document.querySelector("#review-controls");
  const layout = document.querySelector(".prototype-layout");
  const reviewPanel = document.querySelector("#review-panel");
  const viewerTitle = document.querySelector("#viewer-title");
  const viewerSubtitle = document.querySelector("#viewer-subtitle");
  if (!data || !root || !controls || !layout || !reviewPanel || !viewerTitle || !viewerSubtitle) throw new Error("Не удалось загрузить данные браузерного черновика.");
  const logicalScreenWidth = data.logicalScreen?.width;
  const logicalScreenHeight = data.logicalScreen?.height;
  if (!Number.isFinite(logicalScreenWidth) || logicalScreenWidth <= 0) {
    throw new Error("Не задана логическая ширина источника SVG.");
  }
  if (!Number.isFinite(logicalScreenHeight) || logicalScreenHeight <= 0) {
    throw new Error("Не задана логическая высота источника SVG.");
  }

  const allStates = new Map([
    ...data.states.map((state) => [state.id, state]),
    ...data.externalStates.map((state) => [state.id, state]),
  ]);
  const viewerNavigation = data.viewerNavigation;
  if (!viewerNavigation?.frameSequence || !viewerNavigation?.chatList) throw new Error("Не загружены правила навигации браузерного черновика.");
  const viewerShell = data.viewerShell;
  if (!viewerShell?.documentTitle || !viewerShell?.panelTitle || !viewerShell?.phoneStateCaptions || viewerShell.externalPanelHidden !== true) {
    throw new Error("Не загружены правила оболочки браузерного черновика.");
  }
  const initialUrl = new URL(window.location.href);
  const requestedState = initialUrl.searchParams.get("state");
  let currentStateId = allStates.has(requestedState) ? requestedState : data.initialStateId;
  let currentPage = Number.parseInt(initialUrl.searchParams.get("page") || "0", 10);
  let chatReturnStateId = viewerNavigation.chatList.openFromStateIds.includes(initialUrl.searchParams.get("return_state"))
    ? initialUrl.searchParams.get("return_state")
    : viewerNavigation.chatList.directUrlFallbackStateId;
  let disposeScrollAnchor = () => {};
  const scrollPositions = new Map();
  const svgNamespace = "http://www.w3.org/2000/svg";

  function element(name, className = "") {
    const node = document.createElement(name);
    if (className) node.className = className;
    return node;
  }

  function svgElement(name, attributes = {}) {
    const node = document.createElementNS(svgNamespace, name);
    for (const [attribute, value] of Object.entries(attributes)) node.setAttribute(attribute, String(value));
    return node;
  }

  function appendSvgShape(svg, name, attributes) {
    svg.append(svgElement(name, attributes));
  }

  function makePhoneAssembly(state, label) {
    const geometry = data.phoneGeometry;
    if (!geometry?.viewBox || !Array.isArray(geometry.elements)) throw new Error("Не загружена векторная геометрия телефона.");
    const [, , assemblyWidth, assemblyHeight] = geometry.viewBox.split(/\s+/u).map(Number);
    const active = geometry.elements.find((item) => item.attributes.id === "phone-active-display");
    if (!active) throw new Error("В геометрии отсутствует активная область дисплея.");
    const shell = element("section", "phone-assembly");
    shell.dataset.stateId = state.id;
    shell.dataset.testid = "phone-assembly";
    shell.setAttribute("aria-label", label);
    shell.style.setProperty("--phone-ratio", `${assemblyWidth} / ${assemblyHeight}`);
    const hardware = svgElement("svg", { class: "phone-hardware", viewBox: geometry.viewBox, "aria-hidden": "true", focusable: "false" });
    const overlay = svgElement("svg", { class: "phone-hardware-overlay", viewBox: geometry.viewBox, "aria-hidden": "true", focusable: "false" });
    for (const source of geometry.elements) appendSvgShape(hardware, source.tag, source.attributes);
    const screen = element("div", "phone-active-display phone-screen");
    screen.dataset.testid = "phone-screen";
    screen.style.setProperty("--display-left", `${(Number(active.attributes.x) / assemblyWidth) * 100}%`);
    screen.style.setProperty("--display-top", `${(Number(active.attributes.y) / assemblyHeight) * 100}%`);
    screen.style.setProperty("--display-width", `${(Number(active.attributes.width) / assemblyWidth) * 100}%`);
    screen.style.setProperty("--display-height", `${(Number(active.attributes.height) / assemblyHeight) * 100}%`);
    screen.style.setProperty("--display-radius", `${(Number(active.attributes.rx) / Number(active.attributes.width)) * 100}%`);
    for (const source of geometry.elements.filter((item) => ["phone-notch", "phone-speaker"].includes(item.attributes.id))) appendSvgShape(overlay, source.tag, source.attributes);
    shell.append(hardware, screen, overlay);
    return { shell, screen };
  }

  function phoneIcon(icon) {
    const definitions = {
      signal: { width: 18, height: 12, viewBox: "0 0 18 12" },
      wifi: { width: 16, height: 12, viewBox: "0 0 16 12" },
      battery: { width: 25, height: 12, viewBox: "0 0 25 12" },
      menu: { width: 16, height: 16, viewBox: "0 0 16 16" },
      search: { width: 18, height: 18, viewBox: "0 0 18 18" },
      bell: { width: 20, height: 20, viewBox: "0 0 20 20" },
      send: { width: 24, height: 24, viewBox: "0 0 24 24" },
    };
    const definition = definitions[icon];
    if (!definition) throw new Error(`Неизвестный значок телефона: ${icon}.`);
    const svg = svgElement("svg", {
      class: "phone-icon",
      width: definition.width,
      height: definition.height,
      viewBox: definition.viewBox,
      fill: "none",
      "aria-hidden": "true",
      focusable: "false",
      "data-phone-icon": icon,
    });
    if (icon === "signal") {
      for (const [x, y, height] of [[0, 7, 5], [5, 5, 7], [10, 3, 9], [15, 0, 12]]) {
        appendSvgShape(svg, "rect", { x, y, width: 3, height, rx: .5, fill: "#111" });
      }
    } else if (icon === "wifi") {
      appendSvgShape(svg, "path", { d: "M8 10.5C8.6 10.5 9.1 10.1 9.1 9.5C9.1 8.9 8.6 8.5 8 8.5C7.4 8.5 6.9 8.9 6.9 9.5C6.9 10.1 7.4 10.5 8 10.5Z", fill: "#111" });
      appendSvgShape(svg, "path", { d: "M4.5 7.2C5.5 6.3 6.7 5.8 8 5.8C9.3 5.8 10.5 6.3 11.5 7.2", stroke: "#111", "stroke-width": 1.3, "stroke-linecap": "round" });
      appendSvgShape(svg, "path", { d: "M1.5 4.3C3.3 2.7 5.6 1.8 8 1.8C10.4 1.8 12.7 2.7 14.5 4.3", stroke: "#111", "stroke-width": 1.3, "stroke-linecap": "round" });
    } else if (icon === "battery") {
      appendSvgShape(svg, "rect", { x: .5, y: .5, width: 21, height: 11, rx: 2.5, stroke: "#111" });
      appendSvgShape(svg, "rect", { x: 2, y: 2, width: 18, height: 8, rx: 1.3, fill: "#111" });
      appendSvgShape(svg, "rect", { x: 22.5, y: 4, width: 2, height: 4, rx: 1, fill: "#111" });
    } else if (icon === "menu") {
      appendSvgShape(svg, "path", { d: "M2 5H14", stroke: "#181a2a", "stroke-width": 1.4, "stroke-linecap": "round" });
      appendSvgShape(svg, "path", { d: "M2 10.5H10.5", stroke: "#181a2a", "stroke-width": 1.4, "stroke-linecap": "round" });
    } else if (icon === "search") {
      appendSvgShape(svg, "circle", { cx: 7.3, cy: 7.3, r: 4.6, stroke: "#181a2a", "stroke-width": 1.6 });
      appendSvgShape(svg, "path", { d: "m10.8 10.8 4.2 4.2", stroke: "#181a2a", "stroke-width": 1.6, "stroke-linecap": "round" });
    } else if (icon === "bell") {
      appendSvgShape(svg, "path", { d: "M10 2.5C7.7 2.5 6 4.3 6 6.6V9.3C6 9.9 5.8 10.5 5.4 11L4.5 12.2C4 12.9 4.5 13.9 5.3 13.9H14.7C15.5 13.9 16 12.9 15.5 12.2L14.6 11C14.2 10.5 14 9.9 14 9.3V6.6C14 4.3 12.3 2.5 10 2.5Z", stroke: "#181a2a", "stroke-width": 1.4, "stroke-linejoin": "round" });
      appendSvgShape(svg, "path", { d: "M8.2 16C8.5 16.9 9.2 17.5 10 17.5C10.8 17.5 11.5 16.9 11.8 16", stroke: "#181a2a", "stroke-width": 1.4, "stroke-linecap": "round" });
    } else {
      appendSvgShape(svg, "path", { d: "M12 4V17M12 4L7 9M12 4L17 9", stroke: "white", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" });
    }
    return svg;
  }

  function lisaBrandMark() {
    const svg = svgElement("svg", {
      class: "lisa-brand-mark",
      viewBox: "0 0 32 32",
      "aria-hidden": "true",
      focusable: "false",
    });
    appendSvgShape(svg, "circle", { cx: 16, cy: 16, r: 16, fill: "#ffd33d" });
    appendSvgShape(svg, "path", { d: "M9 12.4 12.7 9l1.2 3.9a8.8 8.8 0 0 1 4.2 0L19.3 9l3.7 3.4v6.2c0 3.7-3.1 6.7-7 6.7s-7-3-7-6.7v-6.2Z", fill: "#fff" });
    appendSvgShape(svg, "circle", { cx: 13.2, cy: 16.2, r: 1, fill: "#f06e43" });
    appendSvgShape(svg, "circle", { cx: 18.8, cy: 16.2, r: 1, fill: "#f06e43" });
    return svg;
  }

  function setSemanticStyle(node, source) {
    const relativeFontSize = (source.style.fontSize / logicalScreenWidth) * 100;
    node.style.setProperty("--semantic-font-size", `${relativeFontSize}cqw`);
    node.style.setProperty("--semantic-font-weight", String(source.style.fontWeight));
    node.style.setProperty("--semantic-fill", source.style.fill);
  }

  function setSemanticLayout(node, source) {
    const layout = source.layout || {};
    node.style.setProperty("--semantic-left", `${(Number(layout.x) / logicalScreenWidth) * 100}%`);
    node.style.setProperty("--semantic-top", `${(Number(layout.y) / logicalScreenHeight) * 100}%`);
    if (Number(layout.width) > 0) node.style.setProperty("--semantic-width", `${(Number(layout.width) / logicalScreenWidth) * 100}%`);
    if (Number(layout.height) > 0) node.style.setProperty("--semantic-height", `${(Number(layout.height) / logicalScreenHeight) * 100}%`);
  }

  function bindSemanticSource(node, source) {
    node.dataset.domId = source.id;
    node.dataset.domRole = source.role;
  }

  function makeButton(label, className, action, disabled = false) {
    const node = element("button", className);
    node.type = "button";
    node.disabled = disabled;
    node.setAttribute("aria-disabled", String(disabled));
    node.textContent = label;
    if (!disabled && action) node.addEventListener("click", action);
    return node;
  }

  function transition(from, event) {
    return data.transitions.find((candidate) => candidate.from === from && candidate.event === event)?.to || null;
  }

  function currentState() {
    return allStates.get(currentStateId);
  }

  function frameIndex(stateId = currentStateId) {
    return viewerNavigation.frameSequence.indexOf(stateId);
  }

  function setState(nextStateId, options = {}) {
    if (!allStates.has(nextStateId)) return;
    currentStateId = nextStateId;
    const nextState = currentState();
    currentPage = nextState?.contentType === "presentation"
      ? Math.min(Math.max(Number.isInteger(options.page) ? options.page : currentPage, 0), nextState.pageCount - 1)
      : 0;
    if (nextStateId === "lisa-presentation-chat-list") {
      chatReturnStateId = viewerNavigation.chatList.openFromStateIds.includes(options.returnStateId)
        ? options.returnStateId
        : viewerNavigation.chatList.directUrlFallbackStateId;
    }
    const url = new URL(window.location.href);
    url.searchParams.set("state", nextStateId);
    if (nextStateId === "lisa-presentation-chat-list") url.searchParams.set("return_state", chatReturnStateId);
    else url.searchParams.delete("return_state");
    if (nextState?.contentType === "presentation") url.searchParams.set("page", String(currentPage));
    else url.searchParams.delete("page");
    window.history.replaceState(null, "", url);
    render();
  }

  function moveFrame(offset) {
    const nextIndex = frameIndex() + offset;
    if (nextIndex < 0 || nextIndex >= viewerNavigation.frameSequence.length) return;
    setState(viewerNavigation.frameSequence[nextIndex], { page: 0 });
  }

  function openChatList(fromStateId, scroller) {
    if (!viewerNavigation.chatList.openFromStateIds.includes(fromStateId)) return;
    if (viewerNavigation.chatList.restoreScrollPosition && scroller) scrollPositions.set(fromStateId, scroller.scrollTop);
    setState("lisa-presentation-chat-list", { returnStateId: fromStateId });
  }

  function returnFromChatList() {
    const nextStateId = viewerNavigation.chatList.returnToOrigin ? chatReturnStateId : viewerNavigation.chatList.directUrlFallbackStateId;
    setState(nextStateId);
  }

  function renderRichText(node, text) {
    // Семантический SVG хранит переносы только как подсказку для источника.
    // В браузере переносы рассчитывает CSS: так сохраняется исходная фраза с
    // пробелами, а текст остаётся адаптивным при любом масштабе телефона.
    node.textContent = text.replaceAll("\n", " ");
  }

  function maintainBottomScroll(scroller, state, restoredPosition = null) {
    const hasRestoredPosition = Number.isFinite(restoredPosition);
    if (state.initialScrollPosition !== "bottom" && !hasRestoredPosition) return () => {};
    let anchored = true;
    let previousMaximum = 0;
    let autoScrolling = false;
    const moveToBottom = () => { if (anchored) { autoScrolling = true; scroller.scrollTop = scroller.scrollHeight; requestAnimationFrame(() => { autoScrolling = false; }); } };
    const updateAnchor = () => { if (!autoScrolling) anchored = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2; };
    scroller.addEventListener("scroll", updateAnchor, { passive: true });
    const afterLayout = () => requestAnimationFrame(() => requestAnimationFrame(moveToBottom));
    const observer = new ResizeObserver(() => {
      if (scroller.scrollTop >= previousMaximum - 2) anchored = true;
      previousMaximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
      afterLayout();
    });
    observer.observe(scroller); if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    const stage = document.querySelector(".prototype-stage"); if (stage) observer.observe(stage);
    const onWindowResize = () => {
      const wasBottom = anchored || scroller.scrollTop >= previousMaximum - 2;
      requestAnimationFrame(() => requestAnimationFrame(() => { if (wasBottom) anchored = true; moveToBottom(); }));
    };
    window.addEventListener("resize", onWindowResize, { passive: true });
    requestAnimationFrame(() => {
      if (hasRestoredPosition) {
        scroller.scrollTop = Math.min(restoredPosition, Math.max(0, scroller.scrollHeight - scroller.clientHeight));
        anchored = scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 2;
      } else {
        moveToBottom();
      }
      previousMaximum = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    });
    return () => { observer.disconnect(); scroller.removeEventListener("scroll", updateAnchor); window.removeEventListener("resize", onWindowResize); };
  }

  function nodeByRole(state, role) {
    return state.nodes.find((node) => node.role === role);
  }

  function renderReferenceContent(state, scroller) {
    const content = element("div", "chat-content");
    const primaryAction = nodeByRole(state, "primary-action");
    const composer = nodeByRole(state, "composer-placeholder");
    const sections = new Map();
    const messages = [];
    for (const source of state.nodes) {
      if (["primary-action", "composer-placeholder", "status-time", "assistant-name"].includes(source.role)) continue;
      if (source.sectionId === "messages") {
        messages.push(source);
        continue;
      }
      if (!sections.has(source.sectionId)) sections.set(source.sectionId, []);
      sections.get(source.sectionId).push(source);
    }

    for (const [sectionId, nodes] of sections) {
      if (sectionId === "reference-header") {
        const title = nodes[0];
        const heading = element("h1", "reference-heading");
        heading.tabIndex = -1;
        heading.dataset.stateHeading = "true";
        bindSemanticSource(heading, title);
        setSemanticStyle(heading, title);
        renderRichText(heading, title.text);
        content.append(heading);
        continue;
      }
      const section = element("section", "reference-section");
      section.dataset.sectionId = sectionId;
      let pendingLabel = null;
      for (const source of nodes) {
        if (source.role === "section-title") {
          const heading = element("h2", "section-heading");
          bindSemanticSource(heading, source);
          setSemanticStyle(heading, source);
          renderRichText(heading, source.text);
          section.append(heading);
        } else if (source.role === "fact-label") {
          pendingLabel = source;
        } else if (source.role === "fact-value") {
          const fact = element("div", "fact-row");
          if (pendingLabel) {
            const label = element("div", "fact-label");
            bindSemanticSource(label, pendingLabel);
            setSemanticStyle(label, pendingLabel);
            renderRichText(label, pendingLabel.text);
            fact.append(label);
            pendingLabel = null;
          }
          const value = element("div", "fact-value");
          bindSemanticSource(value, source);
          setSemanticStyle(value, source);
          renderRichText(value, source.text);
          fact.append(value);
          section.append(fact);
        }
      }
      content.append(section);
    }
    if (primaryAction) {
      const enabled = primaryAction.tone === "enabled";
      const action = enabled ? () => {
        const next = transition(state.id, primaryAction.action);
        if (next) setState(next);
      } : null;
      const button = makeButton(primaryAction.text, "primary-action", action, !enabled);
      bindSemanticSource(button, primaryAction);
      button.dataset.testid = "order-presentation";
      setSemanticStyle(button, primaryAction);
      content.append(button);
    }
    for (const source of messages) {
      const interactive = source.action === "open_delivery_email";
      const message = interactive ? makeButton("", "system-message interactive-message", () => {
        const next = transition(state.id, source.action);
        if (next) setState(next);
      }) : element("article", "system-message");
      bindSemanticSource(message, source);
      message.setAttribute("data-tone", source.role);
      setSemanticStyle(message, source);
      renderRichText(message, source.text);
      if (interactive) message.setAttribute("aria-label", "Открыть письмо с презентацией");
      content.append(message);
    }
    scroller.append(content);
    return composer;
  }

  function renderChatListPhone(state) {
    const timeNode = nodeByRole(state, "status-time");
    const fixedAction = nodeByRole(state, "chat-list-new-action");
    if (!timeNode || !fixedAction) throw new Error("Не найдены SVG-элементы списка чатов.");
    const { shell, screen } = makePhoneAssembly(state, "Экран телефона: список чатов Лисы");
    screen.classList.add("chat-list-screen");

    const status = element("div", "status-bar chat-list-status-bar");
    const time = element("span", "status-time");
    bindSemanticSource(time, timeNode);
    time.dataset.testid = "phone-time";
    time.textContent = timeNode.text;
    const statusDetails = element("span", "status-details");
    statusDetails.setAttribute("aria-hidden", "true");
    statusDetails.append(phoneIcon("signal"), phoneIcon("wifi"), phoneIcon("battery"));
    status.append(time, statusDetails);

    const header = element("header", "chat-list-header");
    header.append(lisaBrandMark());
    const search = element("span", "chat-list-search");
    search.setAttribute("aria-label", "Поиск недоступен в черновике");
    search.append(phoneIcon("search"));
    header.append(search);

    const scroller = element("div", "chat-list-scroll-region");
    scroller.dataset.testid = "phone-scroll-region";
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", "Список чатов");
    const layer = element("div", "chat-list-layer");
    for (const source of state.nodes) {
      if (["status-time", "chat-list-new-action"].includes(source.role)) continue;
      const isCurrent = source.role === "chat-list-current-entry";
      const isEntry = source.role === "chat-list-entry";
      const node = isCurrent ? makeButton("", "chat-list-current-entry", returnFromChatList) : element(isEntry ? "article" : "p", isEntry ? "chat-list-source-entry" : "chat-list-source-label");
      if (isCurrent) node.setAttribute("aria-label", source.text);
      bindSemanticSource(node, source);
      setSemanticStyle(node, source);
      setSemanticLayout(node, source);
      renderRichText(node, source.text);
      layer.append(node);
    }
    scroller.append(layer);

    const newChat = makeButton("", "chat-list-new-action", null, true);
    bindSemanticSource(newChat, fixedAction);
    setSemanticStyle(newChat, fixedAction);
    setSemanticLayout(newChat, fixedAction);
    renderRichText(newChat, fixedAction.text);
    newChat.setAttribute("aria-label", "Новый чат недоступен в черновике");
    const home = element("div", "home-indicator chat-list-home-indicator");
    home.setAttribute("aria-hidden", "true");
    home.append(element("span", "home-indicator-bar"));
    screen.append(status, header, scroller, newChat, home);
    shell.append(screen);
    return shell;
  }

  function renderPhone(state) {
    if (state.id === "lisa-presentation-chat-list") return renderChatListPhone(state);
    const timeNode = nodeByRole(state, "status-time");
    const assistantNameNode = nodeByRole(state, "assistant-name");
    if (!timeNode || !assistantNameNode) throw new Error("Не найдены SVG-подписи телефона.");
    const { shell, screen } = makePhoneAssembly(state, `Экран телефона: ${assistantNameNode.text}`);
    const status = element("div", "status-bar");
    const time = element("span", "status-time");
    bindSemanticSource(time, timeNode);
    time.dataset.testid = "phone-time";
    time.textContent = timeNode.text;
    status.append(time);
    const statusDetails = element("span", "status-details");
    statusDetails.setAttribute("aria-hidden", "true");
    statusDetails.append(phoneIcon("signal"), phoneIcon("wifi"), phoneIcon("battery"));
    status.append(statusDetails);

    const header = element("header", "chat-header");
    const canOpenChats = viewerNavigation.chatList.openFromStateIds.includes(state.id);
    const chats = makeButton("", "header-control header-menu", canOpenChats ? () => openChatList(state.id, scroller) : null, !canOpenChats);
    chats.setAttribute("aria-label", "Открыть список чатов");
    chats.append(phoneIcon("menu"));
    const bell = makeButton("", "header-control header-bell", null, true);
    bell.setAttribute("aria-label", "Уведомления недоступны в черновике");
    bell.append(phoneIcon("bell"));
    header.append(chats, bell);

    const scroller = element("div", "scroll-region");
    scroller.dataset.testid = "phone-scroll-region";
    scroller.tabIndex = 0;
    scroller.setAttribute("aria-label", "Содержимое чата");
    const composerNode = renderReferenceContent(state, scroller);
    const composer = element("div", "composer");
    composer.dataset.testid = "phone-composer";
    const field = element("input", "composer-field");
    if (composerNode) bindSemanticSource(field, composerNode);
    field.readOnly = true;
    field.value = "";
    field.placeholder = composerNode?.text || "";
    field.setAttribute("aria-label", "Поле сообщения");
    const voice = makeButton("", "voice-control", null, true);
    voice.setAttribute("aria-label", "Отправка сообщения недоступна в черновике");
    voice.append(phoneIcon("send"));
    composer.append(field, voice);
    const home = element("div", "home-indicator");
    home.setAttribute("aria-hidden", "true");
    home.append(element("span", "home-indicator-bar"));
    screen.append(status, header, scroller, composer, home);
    shell.append(screen);

    const restoredPosition = scrollPositions.get(state.id);
    disposeScrollAnchor = maintainBottomScroll(scroller, state, restoredPosition);
    if (state.initialScrollPosition !== "bottom" && Number.isFinite(restoredPosition)) {
      requestAnimationFrame(() => { scroller.scrollTop = Math.min(restoredPosition, Math.max(0, scroller.scrollHeight - scroller.clientHeight)); });
    }
    return shell;
  }

  function viewerButton(control, label, action, disabled = false) {
    const button = makeButton(label, "viewer-control", action, disabled);
    button.dataset.testid = control;
    button.setAttribute("aria-label", label);
    return button;
  }

  function frameButtons(container, className) {
    const index = frameIndex();
    const previous = viewerButton("previous-frame", "Предыдущий кадр", () => moveFrame(-1), index === 0);
    previous.classList.add(className, "viewer-control-previous-frame");
    previous.textContent = "←";
    const next = viewerButton("next-frame", "Следующий кадр", () => moveFrame(1), index === viewerNavigation.frameSequence.length - 1);
    next.classList.add(className, "viewer-control-next-frame");
    next.textContent = "→";
    container.append(previous, next);
  }

  function renderViewerShell(state) {
    document.title = viewerShell.documentTitle;
    viewerTitle.textContent = viewerShell.panelTitle;
    viewerSubtitle.textContent = state.kind === "phone" ? viewerShell.phoneStateCaptions[state.id] || "" : "";
  }

  function renderExternal(state) {
    const stage = element("section", "external-stage");
    stage.dataset.stateId = state.id;
    stage.dataset.testid = "external-stage";
    stage.dataset.page = String(currentPage);
    const documentFrame = element("div", `external-document external-document-${state.contentType}`);
    const image = element("img", "external-image");
    image.src = state.assetPaths[currentPage];
    image.alt = "Отдельный внешний экран принятого черновика";
    documentFrame.append(image);

    const overlay = element("nav", "external-overlay");
    overlay.dataset.testid = "external-overlay";
    overlay.setAttribute("aria-label", "Навигация просмотра внешнего кадра");
    frameButtons(overlay, "external-overlay-control");
    if (state.contentType === "presentation") {
      const previousPage = viewerButton("previous-page", "Предыдущая страница презентации", () => setState(state.id, { page: currentPage - 1 }), currentPage === 0);
      previousPage.classList.add("external-overlay-control", "viewer-control-previous-page");
      previousPage.textContent = "↑";
      const nextPage = viewerButton("next-page", "Следующая страница презентации", () => setState(state.id, { page: currentPage + 1 }), currentPage === state.pageCount - 1);
      nextPage.classList.add("external-overlay-control", "viewer-control-next-page");
      nextPage.textContent = "↓";
      overlay.append(previousPage, nextPage);
    }
    stage.append(documentFrame, overlay);
    return stage;
  }

  function renderControls(state) {
    controls.replaceChildren();
    const external = state.kind === "external";
    renderViewerShell(state);
    reviewPanel.hidden = external;
    reviewPanel.inert = external;
    layout.classList.toggle("phone-panel-hidden", external);
    if (external) return;
    const frameControls = element("div", "phone-frame-controls");
    frameControls.setAttribute("aria-label", "Переход между кадрами черновика");
    frameButtons(frameControls, "review-control");
    const counter = element("p", "frame-counter");
    counter.textContent = `Кадр ${frameIndex() + 1} из ${viewerNavigation.frameSequence.length}`;
    frameControls.insertBefore(counter, frameControls.children[1]);
    controls.append(frameControls);
  }

  function render() {
    const state = currentState();
    if (!state) throw new Error("Не найдено состояние браузерного черновика.");
    currentPage = state.contentType === "presentation"
      ? Math.min(Math.max(Number.isInteger(currentPage) ? currentPage : 0, 0), state.pageCount - 1)
      : 0;
    disposeScrollAnchor();
    disposeScrollAnchor = () => {};
    root.replaceChildren(state.kind === "phone" ? renderPhone(state) : renderExternal(state));
    renderControls(state);
  }

  function isEditableTarget(target) {
    return target instanceof Element && Boolean(target.closest("input, textarea, select, [contenteditable]:not([contenteditable=\"false\"])"));
  }

  window.addEventListener("keydown", (event) => {
    const state = currentState();
    if (!state || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isEditableTarget(event.target)) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); moveFrame(-1); return; }
    if (event.key === "ArrowRight") { event.preventDefault(); moveFrame(1); return; }
    if (state.kind !== "external" || state.contentType !== "presentation") return;
    if (event.key === "ArrowUp") { event.preventDefault(); setState(state.id, { page: currentPage - 1 }); }
    if (event.key === "ArrowDown") { event.preventDefault(); setState(state.id, { page: currentPage + 1 }); }
  });

  render();
})();
