(() => {
  "use strict";

  const data = window.LISA_PROTOTYPE_DATA;
  if (!data) throw new Error("Данные прототипа не загружены.");
  const captureMode = window.__DATACANVAS_LISA_CAPTURE__ === true;

  const root = document.getElementById("phone-root");
  const selector = document.getElementById("state-select");
  const reviewStatus = document.getElementById("prototype-review-status");
  const materialsDialog = document.getElementById("materials-dialog");
  const globalLiveRegion = document.getElementById("prototype-live-region");
  const knownStates = new Map(data.states.map((state) => [state.id, state]));
  const material = knownStates.get(data.initial_state_id).content;
  const agendaGroupLabels = Object.freeze({
    mandatory: "Обязательно",
    optional: "Дополнительно",
  });
  const agendaTagLabels = Object.freeze({
    insight: "Наблюдение",
    agreement: "Договорённость",
    news: "Новость",
  });
  const activatedButtons = new WeakSet();
  let activeSequence = null;
  let notificationReturnContext = null;
  let pendingSequenceHistoryTransition = null;
  let viewerController = null;
  let currentStateId = null;
  let sequenceSerial = 0;

  function element(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    for (const [name, value] of Object.entries(options.attributes || {})) {
      if (value === undefined || value === null || value === false) continue;
      node.setAttribute(name, value === true ? "" : String(value));
    }
    return node;
  }

  function agendaLabel(labels, value) {
    const label = labels[value];
    if (!label) throw new Error("Неизвестная метка повестки: " + value);
    return label;
  }

  function parseLocation() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return { ok: false, reason: "Адрес состояния повреждён." };
    }
    const values = params.getAll("state");
    if (values.length === 0) return { ok: true, stateId: data.initial_state_id };
    if (values.length !== 1) {
      return { ok: false, reason: "В адресе должно быть ровно одно состояние." };
    }
    const value = values[0];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)) {
      return { ok: false, reason: "Идентификатор состояния имеет недопустимый формат." };
    }
    if (!knownStates.has(value)) {
      return { ok: false, reason: "Такое состояние прототипа не зарегистрировано." };
    }
    return { ok: true, stateId: value };
  }

  function stateUrl(stateId) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("state", stateId);
    return url;
  }

  function cancelSequence() {
    pendingSequenceHistoryTransition = null;
    if (!activeSequence) return;
    for (const timer of activeSequence.timers) window.clearTimeout(timer);
    if (activeSequence.animationFrame) {
      window.cancelAnimationFrame(activeSequence.animationFrame);
    }
    activeSequence.cancelled = true;
    activeSequence = null;
  }

  function resolveBinding(binding) {
    let current = material;
    for (const segment of binding.split(".")) {
      if (["__proto__", "prototype", "constructor"].includes(segment)) return undefined;
      if (Array.isArray(current)) {
        current = current.find((item) => item && item.id === segment);
      } else if (
        current &&
        typeof current === "object" &&
        Object.prototype.hasOwnProperty.call(current, segment)
      ) {
        current = current[segment];
      } else {
        return undefined;
      }
    }
    return current;
  }

  function isReadyTime(stateId) {
    return ![
      "lisa-materials-ready",
      "lisa-materials-email-sent",
      "lisa-presentation-order-submitting",
      "lisa-presentation-order-failed",
      "lisa-presentation-generating",
    ].includes(stateId);
  }

  function buildStatus(stateId, viewer = false) {
    const status = element("div", {
      className: "phone-status",
      attributes: { "aria-hidden": "true" },
    });
    status.append(
      element("span", {
        className: "time",
        text: isReadyTime(stateId) ? "13:44" : "13:24",
      }),
      element("span", { text: "▮▮▮  ◉  ▰" }),
      element("span", { className: "dynamic-island" }),
    );
    if (viewer) status.dataset.surface = "viewer";
    return status;
  }

  function buildBell(state) {
    const unread = state.notification_unread === true;
    const button = element("button", {
      className: "icon-button",
      attributes: {
        type: "button",
        "aria-label": unread ? "Уведомления, одно новое" : "Уведомления",
        "data-action-id": "open-notifications",
      },
    });
    button.append(
      element("img", {
        className: "bell-shape",
        attributes: {
          src: "../source/components/lisa-notification-bell.svg",
          alt: "",
          "aria-hidden": "true",
        },
      }),
    );
    if (unread) {
      button.append(
        element("span", {
          className: "notification-dot",
          attributes: { "aria-hidden": "true" },
        }),
      );
    }
    button.addEventListener("click", () => {
      if (!state.kind.startsWith("notification")) {
        const content = root.querySelector(".phone-content");
        notificationReturnContext = {
          stateId: state.id,
          scrollTop: content ? content.scrollTop : 0,
          focusActionId: "open-notifications",
        };
      }
      const targetStateId = unread
        ? "lisa-notifications-list-unread"
        : state.result_ref
          ? "lisa-notifications-list-read"
          : "lisa-notifications-list-empty";
      navigate(targetStateId, {
        preserveSequence: Boolean(activeSequence),
        focusHeading: true,
      });
    });
    return button;
  }

  function surfaceTitle(state) {
    if (state.kind.startsWith("notification")) return "Уведомления";
    return "Лиса · Подготовка к встрече";
  }

  function buildComposer() {
    const composer = element("footer", { className: "phone-composer" });
    composer.append(
      element("div", {
        className: "composer-field",
        text: "Задайте любой вопрос…",
        attributes: { "aria-label": "Поле сообщения недоступно в прототипе" },
      }),
      element("button", {
        className: "send-button",
        text: "↑",
        attributes: {
          type: "button",
          disabled: true,
          "aria-label": "Отправить сообщение",
        },
      }),
    );
    return composer;
  }

  function buildMaterialBlock(block) {
    const wrapper = element("div", {
      className: "material-block material-block-" + block.type,
      attributes: {
        "data-material-block-id": block.id,
        "data-material-block-type": block.type,
      },
    });
    if (block.label) {
      wrapper.append(element("p", { className: "material-block-label", text: block.label }));
    }

    if (block.type === "participants") {
      const list = element("ul", { className: "material-list" });
      for (const item of block.items) {
        const row = element("li", { className: "participant-item" });
        row.append(
          element("span", { className: "participant-name", text: item.name }),
          element("span", { className: "participant-role", text: item.role }),
        );
        list.append(row);
      }
      wrapper.append(list);
      return wrapper;
    }

    if (block.type === "agenda") {
      const list = element("ol", { className: "agenda-list" });
      for (const item of block.items) {
        const row = element("li", { className: "agenda-item" });
        row.append(
          element("span", { className: "agenda-title", text: item.title }),
          element("p", { className: "agenda-description", text: item.description }),
        );
        const tags = element("span", { className: "agenda-tags" });
        tags.append(
          element("span", {
            className: "material-tag",
            text: agendaLabel(agendaGroupLabels, item.group),
          }),
          element("span", {
            className: "material-tag",
            text: agendaLabel(agendaTagLabels, item.tag),
          }),
        );
        if (item.source_label) {
          tags.append(element("span", { className: "source-label", text: item.source_label }));
        }
        row.append(tags);
        list.append(row);
      }
      wrapper.append(list);
      return wrapper;
    }

    if (block.type === "paragraph") {
      wrapper.append(element("p", { className: "material-paragraph", text: block.text }));
      return wrapper;
    }

    if (block.type === "bullet-list") {
      const list = element("ul", { className: "material-list" });
      for (const item of block.items) list.append(element("li", { text: item.text }));
      wrapper.append(list);
      return wrapper;
    }

    if (block.type === "metrics") {
      const list = element("ul", { className: "metric-grid" });
      for (const item of block.items) {
        const row = element("li", { className: "metric-item" });
        row.append(
          element("span", { className: "metric-label", text: item.label }),
          element("span", { className: "metric-value", text: item.value }),
        );
        list.append(row);
      }
      wrapper.append(list);
      return wrapper;
    }

    if (block.type === "offers") {
      const list = element("ul", { className: "offer-list" });
      for (const item of block.items) {
        const row = element("li", { className: "offer-item" });
        row.append(
          element("span", { className: "offer-title", text: item.title }),
          element("span", { className: "offer-amount", text: item.amount }),
          element("p", {
            className: "offer-meta",
            text: "Максимальный срок: " + item.maximum_term,
          }),
        );
        if (item.warning) {
          row.append(element("span", { className: "offer-warning", text: item.warning }));
        }
        list.append(row);
      }
      wrapper.append(list);
      return wrapper;
    }

    if (block.type === "callout") {
      wrapper.append(element("p", { className: "material-callout", text: block.text }));
      return wrapper;
    }

    if (block.type === "sourced-list") {
      const list = element("ul", { className: "source-list" });
      for (const item of block.items) {
        const row = element("li", { className: "source-item" });
        row.append(
          element("p", { className: "source-text", text: item.text }),
          element("span", { className: "source-label", text: item.source_label }),
        );
        list.append(row);
      }
      wrapper.append(list);
      return wrapper;
    }

    wrapper.append(
      element("p", {
        className: "material-callout",
        text: "Блок не поддерживается этим прототипом.",
      }),
    );
    return wrapper;
  }

  function buildMaterialCard(state, historical) {
    const content = state.content;
    if (historical) {
      const summary = element("article", {
        className: "message-card historical-material",
        attributes: { "data-content-type": content.type },
      });
      summary.append(
        element("h2", { text: content.header.title }),
        element("p", {
          text: content.header.holding + " · " + content.header.company,
        }),
      );
      return summary;
    }

    const card = element("article", {
      className: "message-card material-card",
      attributes: {
        "data-return-anchor": "message-card",
        "data-content-type": content.type,
      },
    });
    const header = element("header", {
      className: "material-header",
      attributes: { id: content.initial_scroll_anchor },
    });
    header.append(
      element("h2", {
        text: content.header.title,
        attributes: {
          id: "screen-title",
          tabindex: "-1",
          "data-screen-focus": "true",
        },
      }),
      element("p", { className: "material-holding", text: content.header.holding }),
      element("p", { className: "material-company", text: content.header.company }),
      element("p", { className: "material-meta", text: content.header.meta }),
    );
    const sections = element("div", { className: "material-sections" });
    for (const section of content.sections) {
      const sectionNode = element("section", {
        className: "material-section",
        attributes: { "data-material-section-id": section.id },
      });
      sectionNode.append(element("h3", { text: section.title }));
      for (const block of section.blocks) sectionNode.append(buildMaterialBlock(block));
      sections.append(sectionNode);
    }
    card.append(header, sections);
    return card;
  }

  function buildActions(state, excludedActionIds = new Set()) {
    const container = element("div", {
      className: state.id === "lisa-materials-ready" ? "actions actions-materials" : "actions",
      attributes: state.content ? { id: state.content.action_anchor } : {},
    });
    for (const action of state.actions) {
      if (excludedActionIds.has(action.id)) continue;
      const button = element("button", {
        className:
          "button " + (action.variant === "primary" ? "button-primary" : "button-secondary"),
        text: action.label,
        attributes: {
          type: "button",
          "data-action-id": action.id,
          ...(action.accessible_label ? { "aria-label": action.accessible_label } : {}),
        },
      });
      button.addEventListener("click", () => activateAction(state, action, button));
      container.append(button);
    }
    return container;
  }

  function buildMessage(state, options = {}) {
    const historical = options.historical === true;
    const wrapper = element("section", {
      className: "chat-entry",
      attributes: { "data-entry-state-id": state.id },
    });
    if (state.content) {
      wrapper.append(buildMaterialCard(state, historical));
      if (!historical) {
        const actions = buildActions(state);
        if (actions.childElementCount) wrapper.append(actions);
      }
      return wrapper;
    }

    const openAction = historical
      ? null
      : state.actions.find((action) => action.id === "open-result-from-chat");
    const card = element(openAction ? "button" : "article", {
      className: "message-card" + (openAction ? " message-card-action" : ""),
      attributes: {
        ...(openAction
          ? {
              type: "button",
              "aria-label": "Презентация готова. Открыть презентацию",
              "data-action-id": openAction.id,
              "data-screen-focus": "true",
            }
          : {}),
        "data-return-anchor":
          state.id === "lisa-presentation-ready-unread" || state.id === "lisa-returned-to-chat"
            ? "presentation-ready-card"
            : "message-card",
      },
    });
    if (openAction) {
      card.append(
        element("span", { className: "message-eyebrow", text: state.eyebrow }),
        element("span", {
          className: "message-title",
          text: state.title,
          attributes: { id: "screen-title" },
        }),
        element("span", { className: "message-body", text: state.body }),
      );
      if (state.detail_lines.length) {
        const details = element("span", { className: "message-detail-lines" });
        for (const line of state.detail_lines) {
          details.append(element("span", { className: "message-detail", text: line }));
        }
        card.append(details);
      }
      card.addEventListener("click", () => activateAction(state, openAction, card));
    } else {
      card.append(
        element("p", { className: "message-eyebrow", text: state.eyebrow }),
        element("h2", {
          text: state.title,
          attributes: historical
            ? {}
            : {
                id: "screen-title",
                tabindex: "-1",
                "data-screen-focus": "true",
              },
        }),
        element("p", { className: "message-body", text: state.body }),
      );
      if (state.detail_lines.length) {
        const list = element("ul", { className: "detail-list" });
        for (const line of state.detail_lines) list.append(element("li", { text: line }));
        card.append(list);
      }
    }
    wrapper.append(card);
    if (!historical) {
      const actions = buildActions(state, new Set(openAction ? [openAction.id] : []));
      if (actions.childElementCount) wrapper.append(actions);
    }
    return wrapper;
  }

  function buildNotificationState(state) {
    const wrapper = element("section", {
      className: "chat-entry notification-surface",
    });
    const isList = state.id.startsWith("lisa-notifications-list-");
    wrapper.append(
      element("h2", {
        text: isList ? state.title : "Уведомление",
        attributes: {
          id: "screen-title",
          tabindex: "-1",
          "data-screen-focus": "true",
        },
      }),
    );
    const listActionId = state.notification_unread
      ? "open-notification-unread"
      : "open-notification-read";
    if (isList) {
      if (state.id === "lisa-notifications-list-empty") {
        wrapper.append(
          element("p", {
            className: "notification-empty",
            text: state.body,
          }),
        );
      } else {
        const list = element("ul", {
          className: "notification-list",
          attributes: { "aria-label": "Уведомления" },
        });
        const item = element("li", {
          className: "notification-list-item",
          attributes: {
            "data-notification-id": "presentation-ready",
            "data-return-anchor": "notification-item",
          },
        });
        const card = element("button", {
          className: "notification-card",
          attributes: {
            type: "button",
            "aria-label": "Презентация готова, сегодня в 13:44",
            "data-action-id": listActionId,
          },
        });
        card.append(
          element("span", { className: "notification-eyebrow", text: state.eyebrow }),
          element("span", { className: "notification-title", text: "Презентация готова" }),
          element("span", { className: "notification-body", text: state.body }),
          element("time", {
            className: "notification-meta",
            text: "Сегодня, 13:44",
            attributes: { datetime: "2026-07-16T13:44:00+03:00" },
          }),
        );
        card.addEventListener("click", () => {
          navigate(
            state.notification_unread
              ? "lisa-notification-detail-unread"
              : "lisa-notification-detail-read",
          );
        });
        item.append(card);
        list.append(item);
        wrapper.append(list);
      }
    } else {
      const card = element("article", {
        className: "notification-card",
        attributes: {
          "data-return-anchor": "notification-item",
          "data-notification-id": "presentation-ready",
        },
      });
      card.append(
        element("p", { className: "message-eyebrow", text: state.eyebrow }),
        element("h3", { className: "notification-title", text: state.title }),
        element("p", { className: "notification-body", text: state.body }),
        element("time", {
          className: "notification-meta",
          text: "Сегодня, 13:44",
          attributes: { datetime: "2026-07-16T13:44:00+03:00" },
        }),
      );
      wrapper.append(card);
    }
    const actions = buildActions(state, new Set(isList ? [listActionId] : []));
    if (actions.childElementCount) wrapper.append(actions);
    return wrapper;
  }

  function slideHeading(slide) {
    const content = element("div", { className: "slide-content" });
    content.append(
      element("p", { className: "slide-kicker", text: "Подготовка к встрече" }),
      element("h2", { className: "slide-title", text: slide.title }),
    );
    return content;
  }

  function buildHeroMetricsSlide(slide) {
    const content = slideHeading(slide);
    const values = slide.data_bindings.map(resolveBinding);
    const hero = element("div", { className: "slide-hero" });
    const main = element("div", { className: "slide-hero-main" });
    main.append(
      element("span", { className: "slide-hero-value", text: values[0] }),
      element("p", { className: "slide-note", text: values[1].text }),
    );
    const metrics = element("div", { className: "slide-metric-grid" });
    for (const [label, value] of [
      ["Пассивы", values[2]],
      ["НКД", values[3]],
      ["ФОТ", values[4]],
      ["Экосистема", values[5]],
    ]) {
      const metric = element("div", { className: "slide-metric" });
      metric.append(
        element("p", { className: "slide-metric-label", text: label }),
        element("p", { className: "slide-metric-value", text: value }),
      );
      metrics.append(metric);
    }
    hero.append(main, metrics);
    content.append(hero);
    return content;
  }

  function buildOffersSlide(slide) {
    const content = slideHeading(slide);
    const values = slide.data_bindings.map(resolveBinding);
    const offers = element("div", { className: "slide-offers" });
    for (const offer of values.slice(0, 3)) {
      const card = element("div", { className: "slide-offer" });
      card.append(
        element("p", { className: "slide-offer-title", text: offer.title }),
        element("p", { className: "slide-offer-amount", text: offer.amount }),
        element("p", {
          className: "slide-note",
          text: offer.maximum_term + (offer.warning ? " · " + offer.warning : ""),
        }),
      );
      offers.append(card);
    }
    const pressure = element("div", { className: "slide-pressure" });
    for (const agenda of values.slice(3)) {
      const pressureText =
        agenda.id === "a1"
          ? agenda.title +
            ": конкурент " +
            agenda.numeric_facts.competitor_rate_percent +
            "%; Сбер " +
            agenda.numeric_facts.sber_rate_percent_min +
            "–" +
            agenda.numeric_facts.sber_rate_percent_max +
            "%"
          : agenda.title +
            ": конкурентное предложение " +
            agenda.numeric_facts.subscription_rub_per_month.toLocaleString("ru-RU") +
            " ₽/мес.";
      pressure.append(
        element("div", {
          className: "slide-pressure-item",
          text: pressureText,
        }),
      );
    }
    content.append(offers, pressure);
    return content;
  }

  function buildDecisionsSlide(slide) {
    const content = slideHeading(slide);
    const decisions = element("div", { className: "slide-decisions" });
    for (const summary of slide.card_summaries) {
      const agenda = resolveBinding(summary.binding);
      const card = element("div", { className: "slide-decision" });
      card.append(
        element("p", { className: "slide-decision-title", text: agenda.title }),
        element("p", { className: "slide-decision-text", text: summary.text }),
      );
      decisions.append(card);
    }
    content.append(decisions);
    return content;
  }

  function buildPresentationSlide(slide, index) {
    const node = element("article", {
      className: "presentation-slide slide-layout-" + slide.layout,
      attributes: {
        "data-slide-id": slide.id,
        "aria-label": "Слайд " + (index + 1) + ": " + slide.short_title,
        hidden: index !== 0,
      },
    });
    if (slide.layout === "hero-metrics") node.append(buildHeroMetricsSlide(slide));
    else if (slide.layout === "offers-and-comparison") node.append(buildOffersSlide(slide));
    else node.append(buildDecisionsSlide(slide));
    return node;
  }

  function buildViewer(state) {
    const surface = element("section", {
      className: "viewer-surface",
      attributes: {
        "data-region-id": "viewer-surface",
        "aria-labelledby": "screen-title",
      },
    });
    const heading = element("h1", {
      className: "sr-only",
      text: state.title,
      attributes: { id: "screen-title" },
    });
    const closeAction = state.actions.find((action) => action.id === "close-result");
    const emailAction = state.actions.find((action) => action.id === "email-presentation");
    const toolbar = element("div", {
      className: "viewer-toolbar",
      attributes: { "data-region-id": "viewer-toolbar" },
    });
    const close = element("button", {
      className: "viewer-tool",
      text: "←",
      attributes: {
        type: "button",
        "aria-label": closeAction.label,
        "data-action-id": closeAction.id,
        "data-screen-focus": "true",
      },
    });
    const previous = element("button", {
      className: "viewer-tool",
      text: "‹",
      attributes: { type: "button", "aria-label": "Предыдущий слайд" },
    });
    const next = element("button", {
      className: "viewer-tool",
      text: "›",
      attributes: { type: "button", "aria-label": "Следующий слайд" },
    });
    const zoomOut = element("button", {
      className: "viewer-tool",
      text: "−",
      attributes: { type: "button", "aria-label": "Уменьшить" },
    });
    const scaleButton = element("button", {
      className: "viewer-tool viewer-scale",
      text: "100 %",
      attributes: { type: "button", "aria-label": "Масштаб 100 %" },
    });
    const zoomIn = element("button", {
      className: "viewer-tool",
      text: "+",
      attributes: { type: "button", "aria-label": "Увеличить" },
    });
    toolbar.append(close, previous, next, zoomOut, scaleButton, zoomIn);

    const stage = element("div", {
      className: "viewer-stage",
      attributes: {
        tabindex: "0",
        "data-region-id": "viewer-stage",
        "aria-label": "Слайды презентации. Используйте стрелки для перехода.",
      },
    });
    const counter = element("span", { className: "viewer-counter", text: "1 из 3" });
    const format = element("span", {
      className: "viewer-format",
      text: state.eyebrow,
    });
    const slides = data.presentation.slides.map(buildPresentationSlide);
    stage.append(format, counter, ...slides);

    const actions = element("div", {
      className: "viewer-actions",
      attributes: { "data-region-id": "viewer-actions" },
    });
    const email = element("button", {
      className: "button button-primary",
      text: emailAction.label,
      attributes: {
        type: "button",
        "data-action-id": emailAction.id,
      },
    });
    actions.append(email);
    surface.append(heading, toolbar, stage, actions);

    const viewerState = {
      index: 0,
      scale: 1,
      x: 0,
      y: 0,
      pointers: new Map(),
      gestureStart: null,
      pinchStart: null,
      lastTouchTap: null,
      lastTouchToggleAt: -Infinity,
    };

    function clampPan() {
      const activeSlide = slides[viewerState.index];
      const maxX = Math.max(0, ((viewerState.scale - 1) * activeSlide.offsetWidth) / 2);
      const maxY = Math.max(0, ((viewerState.scale - 1) * activeSlide.offsetHeight) / 2);
      viewerState.x = Math.max(-maxX, Math.min(maxX, viewerState.x));
      viewerState.y = Math.max(-maxY, Math.min(maxY, viewerState.y));
    }

    function update() {
      slides.forEach((slide, index) => {
        if (index === viewerState.index) slide.removeAttribute("hidden");
        else slide.setAttribute("hidden", "");
        slide.style.setProperty("--viewer-scale", String(viewerState.scale));
        slide.style.setProperty("--viewer-x", viewerState.x + "px");
        slide.style.setProperty("--viewer-y", viewerState.y + "px");
      });
      const percent = Math.round(viewerState.scale * 100);
      counter.textContent = viewerState.index + 1 + " из " + slides.length;
      scaleButton.textContent = percent + " %";
      scaleButton.setAttribute("aria-label", "Масштаб " + percent + " %");
      previous.disabled = viewerState.index === 0;
      next.disabled = viewerState.index === slides.length - 1;
      zoomOut.disabled = viewerState.scale <= data.viewer.minimum_scale;
      zoomIn.disabled = viewerState.scale >= data.viewer.maximum_scale;
    }

    function resetTransform() {
      viewerState.scale = 1;
      viewerState.x = 0;
      viewerState.y = 0;
    }

    function clearLastTouchTap() {
      viewerState.lastTouchTap = null;
    }

    function selectSlide(index) {
      const bounded = Math.max(0, Math.min(slides.length - 1, index));
      if (bounded === viewerState.index) return;
      viewerState.index = bounded;
      clearLastTouchTap();
      resetTransform();
      update();
      globalLiveRegion.textContent =
        "Слайд " +
        (bounded + 1) +
        " из " +
        slides.length +
        ": " +
        data.presentation.slides[bounded].short_title;
    }

    function setScale(nextScale) {
      viewerState.scale = Math.max(
        data.viewer.minimum_scale,
        Math.min(data.viewer.maximum_scale, nextScale),
      );
      if (viewerState.scale === 1) {
        viewerState.x = 0;
        viewerState.y = 0;
      }
      clampPan();
      update();
      globalLiveRegion.textContent =
        "Масштаб " + Math.round(viewerState.scale * 100) + " %";
    }

    close.addEventListener("click", () => activateAction(state, closeAction, close));
    email.addEventListener("click", () => activateAction(state, emailAction, email));
    previous.addEventListener("click", () => selectSlide(viewerState.index - 1));
    next.addEventListener("click", () => selectSlide(viewerState.index + 1));
    zoomOut.addEventListener("click", () => setScale(viewerState.scale - 0.25));
    zoomIn.addEventListener("click", () => setScale(viewerState.scale + 0.25));
    scaleButton.addEventListener("click", () => setScale(1));
    stage.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        setScale(viewerState.scale + (event.deltaY < 0 ? 0.25 : -0.25));
      },
      { passive: false },
    );
    stage.addEventListener("dblclick", () => {
      if (performance.now() - viewerState.lastTouchToggleAt < 500) return;
      setScale(viewerState.scale === 1 ? data.viewer.double_tap_scale : 1);
    });
    stage.addEventListener("pointerdown", (event) => {
      viewerState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      try {
        stage.setPointerCapture?.(event.pointerId);
      } catch {
        // Синтетический проверочный жест не всегда регистрирует указатель в браузере.
      }
      if (viewerState.pointers.size === 1) {
        viewerState.gestureStart = {
          x: event.clientX,
          y: event.clientY,
          panX: viewerState.x,
          panY: viewerState.y,
        };
      }
      if (viewerState.pointers.size === 2) {
        clearLastTouchTap();
        const points = [...viewerState.pointers.values()];
        viewerState.pinchStart = {
          distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
          scale: viewerState.scale,
        };
      }
    });
    stage.addEventListener("pointermove", (event) => {
      if (!viewerState.pointers.has(event.pointerId)) return;
      viewerState.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (viewerState.pointers.size === 2 && viewerState.pinchStart) {
        clearLastTouchTap();
        const points = [...viewerState.pointers.values()];
        const distance = Math.hypot(
          points[0].x - points[1].x,
          points[0].y - points[1].y,
        );
        setScale(viewerState.pinchStart.scale * (distance / viewerState.pinchStart.distance));
        return;
      }
      if (viewerState.scale > 1 && viewerState.gestureStart) {
        viewerState.x =
          viewerState.gestureStart.panX + event.clientX - viewerState.gestureStart.x;
        viewerState.y =
          viewerState.gestureStart.panY + event.clientY - viewerState.gestureStart.y;
        clampPan();
        update();
      }
    });

    function endPointer(event) {
      const start = viewerState.gestureStart;
      const travel = start
        ? Math.hypot(event.clientX - start.x, event.clientY - start.y)
        : Infinity;
      const wasPinching = Boolean(viewerState.pinchStart);
      if (travel >= 16 || wasPinching) clearLastTouchTap();
      if (
        event.pointerType === "touch" &&
        viewerState.pointers.size === 1 &&
        travel < 16 &&
        !wasPinching
      ) {
        const now = performance.now();
        const previousTap = viewerState.lastTouchTap;
        if (
          previousTap &&
          now - previousTap.at <= 350 &&
          Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) <= 36
        ) {
          setScale(viewerState.scale === 1 ? data.viewer.double_tap_scale : 1);
          viewerState.lastTouchTap = null;
          viewerState.lastTouchToggleAt = now;
        } else {
          viewerState.lastTouchTap = {
            at: now,
            x: event.clientX,
            y: event.clientY,
          };
        }
      }
      if (
        viewerState.scale === 1 &&
        viewerState.pointers.size === 1 &&
        start &&
        Math.abs(event.clientX - start.x) > 42 &&
        Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)
      ) {
        selectSlide(viewerState.index + (event.clientX < start.x ? 1 : -1));
      }
      viewerState.pointers.delete(event.pointerId);
      if (viewerState.pointers.size === 0) {
        viewerState.gestureStart = null;
        viewerState.pinchStart = null;
      }
    }

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", (event) => {
      clearLastTouchTap();
      viewerState.pointers.delete(event.pointerId);
      if (viewerState.pointers.size === 0) {
        viewerState.gestureStart = null;
        viewerState.pinchStart = null;
      }
    });

    viewerController = {
      close: () => activateAction(state, closeAction, close),
      previous: () => selectSlide(viewerState.index - 1),
      next: () => selectSlide(viewerState.index + 1),
      zoomIn: () => setScale(viewerState.scale + 0.25),
      zoomOut: () => setScale(viewerState.scale - 0.25),
      pan(dx, dy) {
        if (viewerState.scale <= 1) return;
        viewerState.x += dx;
        viewerState.y += dy;
        clampPan();
        update();
      },
    };
    update();
    return surface;
  }

  function buildClockOverlay(active) {
    const overlay = element("div", {
      className: "time-lapse-overlay",
      attributes: {
        "data-region-id": "time-lapse-overlay",
        "data-clock-mode": active ? "active" : "static",
        "aria-hidden": "true",
      },
    });
    const panel = element("div", { className: "clock-panel" });
    const face = element("div", { className: "clock-face" });
    face.append(
      element("span", { className: "clock-hand clock-hand-hour" }),
      element("span", { className: "clock-hand clock-hand-minute" }),
    );
    panel.append(
      face,
      element("strong", { text: "Проходит 20 минут" }),
      element("span", { text: "13:24 → 13:44" }),
    );
    overlay.append(panel);
    return overlay;
  }

  function buildPhone(state) {
    if (state.kind === "viewer") {
      const phone = element("article", {
        className: "phone phone-viewer state-viewer",
        attributes: {
          "data-state-id": state.id,
          "data-projection-sha256": state.projection_sha256,
          "aria-labelledby": "screen-title",
        },
      });
      phone.append(buildStatus(state.id, true), buildViewer(state));
      return phone;
    }

    const standalone = state.kind.startsWith("notification");
    const phone = element("article", {
      className:
        "phone state-" + state.kind + (standalone ? " phone-standalone" : ""),
      attributes: {
        "data-state-id": state.id,
        "data-projection-sha256": state.projection_sha256,
        "aria-labelledby": "screen-title",
      },
    });
    const header = element("header", { className: "phone-header" });
    header.append(
      element("span", { className: "phone-context", text: surfaceTitle(state) }),
      buildBell(state),
    );
    const content = element("div", {
      className: "phone-content",
      attributes: {
        tabindex: "0",
        "data-scroll-region": standalone ? "notifications-list" : "chat",
      },
    });
    const stack = element("div", { className: "chat-stack" });
    if (standalone) {
      stack.append(buildNotificationState(state));
    } else {
      for (const historyStateId of state.history_state_ids || []) {
        const historyState = knownStates.get(historyStateId);
        if (historyState) stack.append(buildMessage(historyState, { historical: true }));
      }
      stack.append(buildMessage(state));
    }
    content.append(stack);
    phone.append(buildStatus(state.id), header, content);
    if (!standalone) phone.append(buildComposer());
    if (state.id === "lisa-presentation-generating") {
      phone.append(
        buildClockOverlay(Boolean(activeSequence && !activeSequence.cancelled)),
      );
    }
    return phone;
  }

  function navigate(stateId, options = {}) {
    if (!options.sequenceStep && !options.preserveSequence) cancelSequence();
    if (!knownStates.has(stateId)) return;
    const method = options.replace ? "replaceState" : "pushState";
    window.history[method]({ stateId }, "", stateUrl(stateId));
    renderFromLocation({
      focusHeading: options.focusHeading !== false,
      sequenceStep: options.sequenceStep === true,
    });
  }

  function scheduleSequence(action) {
    const sequence = {
      id: ++sequenceSerial,
      actionId: action.id,
      startedAt: performance.now(),
      timers: [],
      animationFrame: 0,
      cancelled: false,
    };
    activeSequence = sequence;
    action.prototype_sequence.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        if (!activeSequence || activeSequence.id !== sequence.id || sequence.cancelled) return;
        const finalStep = index === action.prototype_sequence.length - 1;
        if (finalStep) activeSequence = null;
        const currentState = knownStates.get(currentStateId);
        if (currentState?.kind.startsWith("notification")) {
          pendingSequenceHistoryTransition = {
            stateId: step.state_id,
            finalStep,
          };
          notificationReturnContext = null;
          window.history.back();
          return;
        }
        navigate(step.state_id, {
          sequenceStep: true,
          replace: true,
          focusHeading: true,
        });
      }, step.at_ms);
      sequence.timers.push(timer);
    });
  }

  function activateAction(state, action, button) {
    if (activatedButtons.has(button)) return;
    activatedButtons.add(button);
    button.disabled = true;
    if (action.behavior === "open-materials-dialog") {
      button.disabled = false;
      activatedButtons.delete(button);
      materialsDialog.showModal();
      return;
    }

    let targetStateId = action.target_state_id;
    if (action.id.startsWith("close-notifications-") && notificationReturnContext) {
      const context = notificationReturnContext;
      notificationReturnContext = null;
      navigate(context.stateId, {
        preserveSequence: Boolean(activeSequence),
        focusHeading: false,
      });
      const content = root.querySelector(".phone-content");
      if (content) content.scrollTop = context.scrollTop;
      root
        .querySelector('[data-action-id="' + context.focusActionId + '"]')
        ?.focus({ preventScroll: true });
      return;
    }
    if (
      action.id === "open-result-from-notification" &&
      notificationReturnContext?.stateId === "lisa-presentation-ready-unread"
    ) {
      notificationReturnContext = {
        ...notificationReturnContext,
        stateId: "lisa-returned-to-chat",
      };
    }
    if (!targetStateId) return;

    if (action.prototype_sequence && action.prototype_sequence.length) {
      cancelSequence();
      scheduleSequence(action);
      navigate(targetStateId, {
        preserveSequence: true,
        focusHeading: true,
      });
      return;
    }
    navigate(targetStateId, {
      focusHeading: true,
    });
  }

  function animateClock() {
    if (
      !activeSequence ||
      currentStateId !== "lisa-presentation-generating" ||
      activeSequence.cancelled
    ) {
      return;
    }
    const overlay = root.querySelector('[data-region-id="time-lapse-overlay"]');
    if (!overlay) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const elapsed = performance.now() - activeSequence.startedAt;
    const startsAt = data.motion.clock_overlay.starts_at_ms;
    const endsAt = data.motion.clock_overlay.ends_at_ms;
    const readyAt = data.motion.clock_overlay.ready_at_ms;
    const progress = Math.max(0, Math.min(1, (elapsed - startsAt) / (endsAt - startsAt)));
    if (!reduced) {
      const minute = overlay.querySelector(".clock-hand-minute");
      const hour = overlay.querySelector(".clock-hand-hour");
      minute.style.transform = "rotate(" + (144 + progress * 1920) + "deg)";
      hour.style.transform = "rotate(" + (42 + progress * 10) + "deg)";
    }
    const opacity =
      elapsed <= endsAt ? 1 : Math.max(0, Math.min(1, (readyAt - elapsed) / (readyAt - endsAt)));
    overlay.style.setProperty("--clock-opacity", String(opacity));
    activeSequence.animationFrame = window.requestAnimationFrame(animateClock);
  }

  function renderSafeError(reason) {
    currentStateId = null;
    viewerController = null;
    root.replaceChildren();
    const phone = element("article", { className: "phone safe-phone state-error" });
    const error = element("section", {
      className: "safe-error",
      attributes: { role: "alert" },
    });
    error.append(
      element("h2", {
        text: "Не удалось открыть состояние",
        attributes: { id: "screen-title", tabindex: "-1" },
      }),
      element("p", { text: reason }),
    );
    const button = element("button", {
      className: "button button-primary",
      text: "Открыть начало",
      attributes: { type: "button" },
    });
    button.addEventListener("click", () => navigate(data.initial_state_id));
    error.append(button);
    phone.append(error);
    root.append(phone);
    document.getElementById("screen-title").focus();
  }

  function renderFromLocation(options = {}) {
    const parsed = parseLocation();
    if (!parsed.ok) {
      renderSafeError(parsed.reason);
      return;
    }
    const state = knownStates.get(parsed.stateId);
    currentStateId = state.id;
    viewerController = null;
    root.replaceChildren(buildPhone(state));
    selector.value = state.id;
    const content = root.querySelector(".phone-content");
    const scrollToEnd =
      content &&
      (state.id === data.initial_state_id ||
        state.history_state_ids?.length ||
        options.focusHeading);
    if (scrollToEnd) {
      content.dataset.captureScrollAnchor = "end";
      content.scrollTop = content.scrollHeight;
    }
    if (globalLiveRegion) {
      globalLiveRegion.textContent = options.sequenceStep
        ? state.id === "lisa-presentation-generating"
          ? "Презентация готовится. Ожидаемое время — 20 минут."
          : state.id === "lisa-presentation-ready-unread"
            ? "Презентация готова"
            : state.id === "lisa-presentation-email-sent"
              ? "Презентация отправлена"
              : state.title
        : "";
    }
    if (options.focusHeading) {
      const focusTarget =
        root.querySelector("[data-screen-focus]") || document.getElementById("screen-title");
      focusTarget?.focus({ preventScroll: true });
    }
    if (state.id === "lisa-presentation-generating" && activeSequence) {
      activeSequence.animationFrame = window.requestAnimationFrame(animateClock);
    }
    if (!captureMode && state.id === "lisa-returned-to-chat") {
      const target =
        root.querySelector('[data-action-id="open-result-from-chat"]') ||
        root.querySelector('[data-action-id="email-presentation"]');
      target?.focus({ preventScroll: true });
    }
    if (!captureMode && state.id === "lisa-notification-detail-read") {
      root
        .querySelector('[data-action-id="open-result-from-notification"]')
        ?.focus({ preventScroll: true });
    }
  }

  function handleViewerKeydown(event) {
    if (!viewerController) return;
    if (event.key === "Escape") {
      event.preventDefault();
      viewerController.close();
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      viewerController.zoomIn();
      return;
    }
    if (event.key === "-") {
      event.preventDefault();
      viewerController.zoomOut();
      return;
    }
    if (event.shiftKey && event.key.startsWith("Arrow")) {
      event.preventDefault();
      const amount = 18;
      viewerController.pan(
        event.key === "ArrowLeft" ? -amount : event.key === "ArrowRight" ? amount : 0,
        event.key === "ArrowUp" ? -amount : event.key === "ArrowDown" ? amount : 0,
      );
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      viewerController.previous();
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      viewerController.next();
    }
  }

  for (const state of data.states) {
    selector.append(
      element("option", {
        text: state.display_name + " — " + state.id,
        attributes: { value: state.id },
      }),
    );
  }
  reviewStatus.dataset.status = data.status;
  reviewStatus.textContent =
    data.status === "owner-review-pending"
      ? "HTML-прототип ожидает подтверждения качества и корректности владельцем"
      : "HTML-прототип подтверждён владельцем";
  selector.addEventListener("change", () => {
    cancelSequence();
    navigate(selector.value);
  });
  window.addEventListener("popstate", () => {
    if (pendingSequenceHistoryTransition) {
      const transition = pendingSequenceHistoryTransition;
      pendingSequenceHistoryTransition = null;
      window.history.replaceState(
        { stateId: transition.stateId },
        "",
        stateUrl(transition.stateId),
      );
      renderFromLocation({
        focusHeading: true,
        sequenceStep: true,
      });
      return;
    }
    const parsed = parseLocation();
    const returnContext =
      parsed.ok && notificationReturnContext?.stateId === parsed.stateId
        ? notificationReturnContext
        : null;
    if (returnContext) {
      notificationReturnContext = null;
    } else {
      cancelSequence();
    }
    renderFromLocation({ focusHeading: !returnContext });
    if (returnContext) {
      const content = root.querySelector(".phone-content");
      if (content) content.scrollTop = returnContext.scrollTop;
      root
        .querySelector('[data-action-id="' + returnContext.focusActionId + '"]')
        ?.focus({ preventScroll: true });
    }
  });
  window.addEventListener("pagehide", cancelSequence);
  window.addEventListener("keydown", handleViewerKeydown);
  materialsDialog.addEventListener("close", () => {
    root.querySelector('[data-action-id="edit-materials"]')?.focus();
  });

  renderFromLocation();
})();
