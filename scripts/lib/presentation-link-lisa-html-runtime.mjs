export function renderLisaDemoStyles() {
  return `@font-face {
  font-family: "Noto Sans";
  src: url("assets/fonts/NotoSans[wdth,wght].ttf") format("truetype");
  font-style: normal;
  font-weight: 100 900;
  font-display: block;
}

:root {
  color-scheme: light;
  font-family: "Noto Sans", system-ui, sans-serif;
  background: #f2f1f7;
  color: #1b1b23;
}

* { box-sizing: border-box; }

html,
body {
  min-width: 0;
  min-height: 100%;
  margin: 0;
}

body { min-height: 100vh; overflow-x: hidden; }

button,
input,
select { font: inherit; }

button { cursor: pointer; }
button:disabled { cursor: default; }

:focus-visible {
  outline: .1875rem solid #135fb8;
  outline-offset: .125rem;
}

.demo-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  height: 100vh;
  min-height: 0;
  overflow: hidden;
}

.scene-stage {
  display: grid;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  justify-items: center;
  align-content: start;
  padding: .5rem;
  background: #fff;
}

#prototype-root {
  display: grid;
  width: 100%;
  min-width: 0;
  justify-items: center;
}

.prototype-scene {
  position: relative;
  width: min(100%, var(--scene-natural-width));
  max-width: 100%;
  line-height: 0;
}

.scene-base {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

.scene-overlay {
  position: absolute;
  inset: 0;
}

.scene-slot {
  position: absolute;
  display: block;
  margin: 0;
  padding: 0;
}

.scene-transparent-control {
  border: 0;
  background: transparent;
  color: transparent;
  caret-color: #1b1b23;
  appearance: none;
}

input.scene-transparent-control {
  min-width: 0;
  min-height: 0;
}

.scene-visible-patch {
  overflow: hidden;
  border: 0;
  background: transparent;
}

.scene-visible-patch img {
  display: block;
  width: 100%;
  height: 100%;
}

.scene-status-copy,
.scene-accessible-status {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 67.5rem) {
  .scene-stage { height: 100vh; }
}

@media (max-width: 24rem) {
  .scene-stage { padding: .25rem; }
}
`;
}

export function renderLisaDemoApp() {
  return String.raw`(() => {
  "use strict";

  const data = window.LISA_PROTOTYPE_DATA;
  if (!data || !Array.isArray(data.states) || !Array.isArray(data.actions)) {
    throw new Error("Данные MVP-прототипа не загружены.");
  }

  const root = document.getElementById("prototype-root");
  const selector = document.getElementById("state-select");
  const liveRegion = document.getElementById("prototype-live-region");
  const states = new Map(data.states.map((state) => [state.id, state]));
  const actions = new Map(data.actions.map((action) => [action.id, action]));
  let currentStateId = stateFromLocation();
  let selectedClientRelationship = "my";
  let searchOutcome = "initial";
  let orderStarted = false;
  let orderPhase = "idle";
  let timers = [];

  function element(tag, options = {}) {
    const node = document.createElement(tag);
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    for (const [name, value] of Object.entries(options.attributes || {})) {
      if (value !== undefined && value !== null && value !== false) {
        node.setAttribute(name, value === true ? "" : String(value));
      }
    }
    return node;
  }

  function stateFromLocation() {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      return data.initial_state_id;
    }
    const values = params.getAll("state");
    return values.length === 1 && states.has(values[0]) ? values[0] : data.initial_state_id;
  }

  function clearTimers() {
    for (const timer of timers) window.clearTimeout(timer);
    timers = [];
  }

  function setLocation(stateId) {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("state", stateId);
    window.history.replaceState({ stateId }, "", url);
  }

  function announce(message) {
    if (liveRegion && message) liveRegion.textContent = message;
  }

  function navigate(stateId, message) {
    if (!states.has(stateId)) return;
    clearTimers();
    currentStateId = stateId;
    orderStarted = false;
    orderPhase = "idle";
    setLocation(stateId);
    render();
    announce(message);
  }

  function safeSourcePath(value) {
    if (typeof value !== "string" || !/^assets\/(?:bases|patches)\/[a-z0-9-]+\.png$/u.test(value)) {
      throw new Error("Договор прототипа содержит небезопасный путь PNG.");
    }
    return value;
  }

  function actionFor(id) {
    return actions.get(id) || null;
  }

  function slotStyle(node, state, rect) {
    const width = state.base.natural_dimensions.width;
    const height = state.base.natural_dimensions.height;
    node.style.left = String((rect.x / width) * 100) + "%";
    node.style.top = String((rect.y / height) * 100) + "%";
    node.style.width = String((rect.width / width) * 100) + "%";
    node.style.height = String((rect.height / height) * 100) + "%";
  }

  function slotAttributes(slot, action) {
    const attributes = {
      "data-slot-id": slot.id,
      "data-semantic-control-id": slot.semantic_control_id,
    };
    if (action) {
      attributes["data-action-id"] = action.id;
      attributes["aria-label"] = action.accessible_label || action.label || action.id;
    } else {
      attributes["aria-label"] = slot.semantic_control_id;
    }
    return attributes;
  }

  function imageFor(sourcePath) {
    return element("img", {
      className: "scene-patch-image",
      attributes: {
        src: safeSourcePath(sourcePath),
        alt: "",
        "aria-hidden": "true",
      },
    });
  }

  function suggestionIsAvailable() {
    return selectedClientRelationship === "my" && searchOutcome !== "no-result";
  }

  function statusTextFor(state) {
    if (state.id === "lisa-presentation-generating") return data.copy.generation_started;
    if (state.id === "lisa-presentation-sent") return data.copy.presentation_sent;
    return "";
  }

  function executeSearch(query) {
    const searchCase = (data.search.cases || []).find((entry) => entry.query === query.trim());
    if (!searchCase) {
      selectedClientRelationship = null;
      searchOutcome = "no-result";
      navigate(data.initial_state_id, data.copy.search_no_results);
      return;
    }
    if (searchCase.id === "multiple-clients") {
      selectedClientRelationship = null;
      searchOutcome = "multiple";
      navigate(searchCase.target_state_id, data.copy.selection_prompt);
      return;
    }
    if (searchCase.id === "single-client") {
      selectedClientRelationship = "my";
      searchOutcome = "single";
      navigate(searchCase.target_state_id, data.copy.selection_prompt);
      return;
    }
    selectedClientRelationship = null;
    searchOutcome = "no-result";
    navigate(searchCase.target_state_id, data.copy.search_no_results);
  }

  function beginOrder() {
    if (orderStarted) return;
    orderStarted = true;
    orderPhase = "waiting";
    render();
    timers.push(window.setTimeout(() => {
      currentStateId = "lisa-presentation-generating";
      orderPhase = "active";
      setLocation(currentStateId);
      render();
      announce(data.copy.generation_started);
    }, data.timeline.generation_started_at_ms));
    timers.push(window.setTimeout(() => {
      if (currentStateId !== "lisa-presentation-generating") return;
      orderPhase = "complete";
      render();
    }, data.timeline.clock_animation_ends_at_ms));
    timers.push(window.setTimeout(() => {
      currentStateId = "lisa-presentation-sent";
      orderPhase = "idle";
      setLocation(currentStateId);
      render();
      announce(data.copy.presentation_sent);
    }, data.timeline.ready_at_ms));
  }

  function executeAction(action, context = {}) {
    if (!action) return;
    if (action.id === "search-client") {
      executeSearch(context.query || "");
      return;
    }
    if (action.id === "select-client") {
      selectedClientRelationship = context.candidate && context.candidate.relationship;
      searchOutcome = "selected";
      navigate(action.target_state_id, data.copy.selection_prompt);
      return;
    }
    if (action.id === "show-preparation-reference") {
      if (selectedClientRelationship !== "my") return;
      navigate(action.target_state_id, action.label);
      return;
    }
    if (action.id === "order-presentation") {
      beginOrder();
      return;
    }
    if (action.target_state_id) navigate(action.target_state_id, action.label);
  }

  function createTransparentControl(state, slot, action) {
    if (slot.semantic_role === "input") {
      const input = element("input", {
        className: "scene-slot scene-transparent-control",
        attributes: {
          ...slotAttributes(slot, action),
          type: "search",
          autocomplete: "off",
          placeholder: data.copy.search_placeholder,
          "aria-label": data.copy.search_placeholder,
        },
      });
      slotStyle(input, state, slot.rect);
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        executeAction(action, { query: input.value });
      });
      return input;
    }
    const control = element("button", {
      className: "scene-slot scene-transparent-control",
      attributes: {
        ...slotAttributes(slot, action),
        type: "button",
        disabled: !action,
      },
    });
    slotStyle(control, state, slot.rect);
    if (action) control.addEventListener("click", () => executeAction(action));
    return control;
  }

  function createCandidateControls(state, slot, action) {
    const candidates = data.search.candidates || [];
    return candidates.map((candidate, index) => {
      const control = element("button", {
        className: "scene-slot scene-transparent-control",
        attributes: {
          ...slotAttributes(slot, action),
          type: "button",
          "data-client-id": candidate.id,
          "data-client-relationship": candidate.relationship,
          "aria-label": (action.accessible_label || action.label || action.id) + ": " + candidate.display_name,
        },
      });
      const candidateRect = {
        x: slot.rect.x,
        y: slot.rect.y + (slot.rect.height * index) / candidates.length,
        width: slot.rect.width,
        height: slot.rect.height / candidates.length,
      };
      slotStyle(control, state, candidateRect);
      control.append(element("span", { className: "scene-status-copy", text: candidate.display_name }));
      control.addEventListener("click", () => executeAction(action, { candidate }));
      return control;
    });
  }

  function createVisiblePatch(state, slot, action) {
    const isStatus = !action && Boolean(statusTextFor(state));
    const tag = action ? "button" : "div";
    const patch = element(tag, {
      className: "scene-slot scene-visible-patch",
      attributes: {
        ...slotAttributes(slot, action),
        ...(action ? { type: "button" } : {}),
        ...(isStatus ? { role: "status", "data-chat-status": state.id === "lisa-presentation-sent" ? "presentation_sent" : "generation_started" } : {}),
      },
    });
    slotStyle(patch, state, slot.rect);
    patch.append(imageFor(slot.visible_patch.src));
    if (isStatus) patch.append(element("span", { className: "scene-status-copy", text: statusTextFor(state) }));
    if (action) patch.addEventListener("click", () => executeAction(action));
    return patch;
  }

  function renderSlot(scene, overlay, state, slot) {
    const action = actionFor(slot.action_id);
    if (slot.visible_patch) {
      if (slot.id === "visible-patch-suggestion" && !suggestionIsAvailable()) return;
      overlay.append(createVisiblePatch(state, slot, action));
      return;
    }
    if (
      action &&
      action.id === "select-client" &&
      state.id === "lisa-client-selection-list" &&
      searchOutcome === "multiple"
    ) {
      for (const control of createCandidateControls(state, slot, action)) overlay.append(control);
      return;
    }
    overlay.append(createTransparentControl(state, slot, action));
  }

  function render() {
    const state = states.get(currentStateId) || states.get(data.initial_state_id);
    root.replaceChildren();
    const scene = element("main", {
      className: "prototype-scene",
      attributes: {
        "data-prototype-scene": "",
        "data-state-id": state.id,
        "data-projection-sha256": state.projection_sha256,
        "data-clock-phase": orderPhase,
      },
    });
    scene.style.setProperty("--scene-natural-width", String(state.base.natural_dimensions.width) + "px");
    scene.append(
      element("img", {
        className: "scene-base",
        attributes: {
          src: safeSourcePath(state.base.src),
          alt: "",
          "aria-hidden": "true",
          "data-source-base-id": state.base.id,
          width: state.base.natural_dimensions.width,
          height: state.base.natural_dimensions.height,
        },
      }),
    );
    const overlay = element("div", { className: "scene-overlay" });
    for (const slot of state.slots) renderSlot(scene, overlay, state, slot);
    if (searchOutcome === "no-result" && state.id === data.initial_state_id) {
      overlay.append(element("p", { className: "scene-accessible-status", text: data.copy.search_no_results, attributes: { role: "status" } }));
    }
    scene.append(overlay);
    root.append(scene);
    if (selector) selector.value = state.id;
  }

  selector?.addEventListener("change", () => {
    selectedClientRelationship = "my";
    searchOutcome = "initial";
    navigate(selector.value, "Показано выбранное состояние прототипа.");
  });

  render();
})();
`;
}
