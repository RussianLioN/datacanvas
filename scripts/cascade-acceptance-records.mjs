import { normalizeRepoPath } from "./documentation-impact-graph.mjs";

export function trustedAcceptanceRecordPaths(registry) {
  if (!Array.isArray(registry?.artifacts)) {
    throw new Error("artifact registry does not contain an artifacts array");
  }
  return new Set(
    registry.artifacts
      .filter((artifact) => artifact.type === "acceptance-records" && artifact.status === "active")
      .map((artifact) => normalizeRepoPath(artifact.path)),
  );
}

export function acceptedOwnerDecisionRecord(
  ledger,
  acceptanceRecordId,
  decisionId,
  selectedOptionId,
  context,
) {
  if (ledger.status !== "active") {
    throw new Error("acceptance record ledger is not active");
  }
  const matchingRecords = ledger.records.filter((record) => record.acceptance_record_id === acceptanceRecordId);
  if (matchingRecords.length !== 1) {
    throw new Error(`acceptance record must exist exactly once: ${acceptanceRecordId}`);
  }
  const acceptanceRecord = matchingRecords[0];
  if (acceptanceRecord.acceptance_type !== "owner_decision_acceptance") {
    throw new Error(`acceptance record has wrong type for owner decision: ${acceptanceRecordId}`);
  }
  if (acceptanceRecord.status !== "accepted") {
    throw new Error(`acceptance record is not accepted: ${acceptanceRecordId}`);
  }
  if (!acceptanceRecord.linked_decision_ids.includes(decisionId)) {
    throw new Error(`acceptance record does not link decision: ${decisionId}`);
  }
  if (acceptanceRecord.selected_option_id !== selectedOptionId) {
    throw new Error(`acceptance record does not confirm selected option: ${selectedOptionId}`);
  }
  if (acceptanceRecord.owner_role !== context.owner_role) {
    throw new Error(`acceptance record owner role does not match decision: ${decisionId}`);
  }
  if (!acceptanceRecord.linked_run_ids?.includes(context.run_id)) {
    throw new Error(`acceptance record does not link cascade run: ${context.run_id}`);
  }
  if (!acceptanceRecord.linked_run_paths?.includes(context.run_path)) {
    throw new Error(`acceptance record does not link cascade run path: ${context.run_path}`);
  }
  if (!acceptanceRecord.linked_change_request_ids?.includes(context.change_request_id)) {
    throw new Error(`acceptance record does not link change request: ${context.change_request_id}`);
  }
  return acceptanceRecord;
}
