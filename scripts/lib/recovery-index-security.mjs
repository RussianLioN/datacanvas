const uriPattern = /[A-Za-z][A-Za-z0-9+.-]*:\/\/\S+/u;
const networkSharePathPattern = /\/\/[^/\s"'<>]+\/[^\s"'<>]+/u;
const posixAbsolutePathPattern = /(?:^|[^A-Za-z0-9._/-])\/(?!\/)[^\s"'<>]+/u;
const windowsAbsolutePathPattern = /[A-Za-z]:\/[^\s"'<>]+/u;
const opmlMarkupPattern = /(?:<|&lt;|&#0*60;|&#x0*3c;)\s*(?:\?xml\b|!doctype\s+opml\b|\/?\s*(?:opml|outline|head|body)\b)/iu;
const externalFingerprintPattern = /(?:внешн\p{L}*[^.]{0,160}отпечат\p{L}*|external[^.]{0,160}fingerprint)/iu;
const notLocallyVerifiedPattern = /(?:не\s+(?:подтвержд|провер)\p{L}*[^.]{0,160}(?:локальн|чтени)\p{L}*|локальн\p{L}*\s+не\s+(?:подтвержд|провер)\p{L}*|not\s+(?:locally\s+)?verified)/iu;

function assertSafeString(value, location) {
  if (
    value.includes("/Users/")
    || value.includes("\\")
    || uriPattern.test(value)
    || networkSharePathPattern.test(value)
    || posixAbsolutePathPattern.test(value)
    || windowsAbsolutePathPattern.test(value)
    || opmlMarkupPattern.test(value)
  ) {
    throw new Error(`forbidden recovery index content at ${location}`);
  }
}

export function assertNoSensitiveRecoveryContent(value, location = "recovery-index") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveRecoveryContent(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    if (
      value.path === null
      && typeof value.sha256 === "string"
      && (
        typeof value.notes !== "string"
        || !externalFingerprintPattern.test(value.notes)
        || !notLocallyVerifiedPattern.test(value.notes)
      )
    ) {
      throw new Error(
        `pathless SHA-256 must be described as an external fingerprint that is not locally verified at ${location}`,
      );
    }
    for (const [key, child] of Object.entries(value)) {
      assertSafeString(key, `${location} key`);
      assertNoSensitiveRecoveryContent(child, `${location}.${key}`);
    }
    return;
  }
  if (typeof value === "string") {
    assertSafeString(value, location);
  }
}
