/**
 * Covia Verification Helpers — verification display and status utilities.
 */

/** Get a label for a verification submission status. */
export function getVerificationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    under_review: "Under Review",
    needs_info: "Additional Info Needed",
  };
  return labels[status] ?? status;
}

/** Get a color key for a verification status. */
export function getVerificationStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "destructive",
    under_review: "primary",
    needs_info: "warning",
  };
  return colors[status] ?? "mutedForeground";
}

/** Get a label for a verification document type. */
export function getDocumentTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    national_id: "National ID",
    drivers_license: "Driver's License",
    international_passport: "International Passport",
    voters_card: "Voter's Card",
    nin_slip: "NIN Slip",
    other: "Other Document",
  };
  return labels[type] ?? type;
}

/** Check if a verification submission can be re-submitted. */
export function canResubmit(status: string): boolean {
  return ["rejected", "needs_info"].includes(status);
}

/** Check if a verification submission is still pending. */
export function isPending(status: string): boolean {
  return ["pending", "under_review"].includes(status);
}

/** Get a helper message for a verification status. */
export function getVerificationHelperMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Your verification is being reviewed. This usually takes 1-2 business days.",
    approved: "Your identity has been verified. You now have a verified badge.",
    rejected: "Your verification was not approved. Please review the feedback and resubmit.",
    under_review: "A reviewer is currently examining your documents.",
    needs_info: "We need additional information to complete your verification.",
  };
  return messages[status] ?? "";
}
