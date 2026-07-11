import { hashJsonDocument } from "./cascade-evidence-utils.mjs";
import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

const productChangeClasses = new Set([
  "acceptance_meaning",
  "business_model",
  "business_requirement",
  "capacity",
  "change_order",
  "hypothesis",
  "mixed_or_ambiguous",
  "non_functional_requirement",
  "priority_change",
  "product_goal",
  "product_meaning",
  "roadmap_meaning",
  "row_add_remove",
  "scope_change",
  "source_identity",
  "story_text_change",
]);

const nonGovernedChangeClasses = new Set([
  "documentation",
  "estimate_change",
  "formatting_change",
  "formatting_only",
  "formula_cache_only",
  "no_change",
  "provenance_only",
]);

export function requiredOwnerRoles(changeClasses) {
  const roles = [];
  if (changeClasses.some((value) => productChangeClasses.has(value))) roles.push("Product Owner");
  if (changeClasses.includes("capacity")) roles.push("Команда реализации");
  if (roles.length === 0) roles.push("Process Owner");
  return [...new Set(roles)].sort();
}

export function validateOwnerAcceptanceSet({
  sourceRun,
  resolutionInput,
  packet,
  authority,
  authorityHash,
  acceptanceByPath,
}) {
  if (packet.packet_sha256 !== hashJsonDocument({ ...packet, packet_sha256: null })) {
    throw new Error("owner question packet self-hash mismatch");
  }
  if (sourceRun.acceptance_authority_path !== packet.authority_manifest_path) {
    throw new Error("owner question packet authority path mismatch");
  }
  if (packet.authority_manifest_sha256 !== authorityHash) {
    throw new Error("owner question packet authority hash mismatch");
  }
  if (resolutionInput.decision_resolutions.length !== packet.required_owner_roles.length) {
    throw new Error("owner-gated vNext run requires one acceptance for every required owner role");
  }

  const requiredRoles = new Set(packet.required_owner_roles);
  const acceptedRoles = new Set();
  const acceptedClasses = new Set();
  const acceptancePaths = [];
  for (const resolution of resolutionInput.decision_resolutions) {
    const acceptancePath = normalizeRepoPath(resolution.acceptance_record_path);
    const acceptance = acceptanceByPath.get(acceptancePath);
    if (!acceptance) throw new Error("acceptance record is missing: " + acceptancePath);
    if (acceptance.acceptance_id !== resolution.acceptance_record_id) {
      throw new Error("acceptance record id mismatch");
    }
    if (!requiredRoles.has(acceptance.owner_role) || acceptedRoles.has(acceptance.owner_role)) {
      throw new Error("acceptance owner role is missing, duplicated, or not required: " + acceptance.owner_role);
    }
    acceptedRoles.add(acceptance.owner_role);
    if (acceptance.authority_manifest_path !== packet.authority_manifest_path
      || acceptance.authority_manifest_sha256 !== authorityHash) {
      throw new Error("acceptance authority binding mismatch");
    }
    const binding = authority.bindings.find((candidate) => candidate.binding_id === acceptance.authority_binding_id);
    if (!binding || binding.owner_role !== acceptance.owner_role) {
      throw new Error("acceptance authority role is not active");
    }
    if (!binding.confirmation_channels.includes(acceptance.confirmation_channel)) {
      throw new Error("acceptance confirmation channel is not allowed for the owner role");
    }
    for (const changeClass of acceptance.accepted_change_classes) {
      if (!packet.change_classes.includes(changeClass) || !binding.allowed_change_classes.includes(changeClass)) {
        throw new Error("acceptance contains an unauthorized change class: " + changeClass);
      }
      acceptedClasses.add(changeClass);
    }
    if (acceptance.question_packet_path !== sourceRun.owner_question_packet_path
      || acceptance.question_packet_sha256 !== packet.packet_sha256) {
      throw new Error("acceptance question packet binding mismatch");
    }
    if (acceptance.run_id !== sourceRun.run_id || acceptance.run_path !== resolutionInput.source_run_path) {
      throw new Error("acceptance run binding mismatch");
    }
    if (acceptance.change_request_id !== sourceRun.change_request_id) {
      throw new Error("acceptance change request binding mismatch");
    }
    if (acceptance.decision_id !== packet.decision_id
      || acceptance.decision_id !== resolution.decision_id
      || acceptance.selected_option_id !== resolution.selected_option_id) {
      throw new Error("acceptance decision binding mismatch");
    }
    const option = packet.options.find((candidate) => candidate.option_id === acceptance.selected_option_id);
    if (!option) throw new Error("selected option is absent from the owner question packet");
    if (option.effect !== "authorize_apply") {
      throw new Error("selected owner option does not authorize cascade finalization");
    }
    acceptancePaths.push(acceptancePath);
  }
  if (acceptedRoles.size !== requiredRoles.size) {
    throw new Error("not all required owner roles accepted the packet");
  }
  const missingClasses = packet.change_classes
    .filter((value) => !nonGovernedChangeClasses.has(value) && !acceptedClasses.has(value));
  if (missingClasses.length > 0) {
    throw new Error("owner acceptance does not cover governed change classes: " + missingClasses.join(","));
  }
  return acceptancePaths.sort();
}
