import type {
  AuthorityCaseId,
  AuthorityRoleId,
  RecordingChannelId,
  RecordingRowId,
  RecordingWhenId,
  StaffPricingPolicy,
} from "./staff-policy-types";

const CASE_IDS: AuthorityCaseId[] = [
  "within_tier_band",
  "outside_adjustment_band",
  "published_config_change",
];
const ROLE_IDS: AuthorityRoleId[] = ["any_quoted_staff", "owner_or_lead", "owner_only"];
const REC_IDS: RecordingRowId[] = [
  "whatsapp_written_quote",
  "admin_ledger_agrees",
  "exception_internal_note",
];
const CH_IDS: RecordingChannelId[] = ["whatsapp", "admin_order", "order_notes"];
const WHEN_IDS: RecordingWhenId[] = [
  "always_before_payment",
  "always",
  "override_escalation_or_unusual_scope",
];

function isCaseId(v: unknown): v is AuthorityCaseId {
  return typeof v === "string" && (CASE_IDS as readonly string[]).includes(v);
}

function isRoleId(v: unknown): v is AuthorityRoleId {
  return typeof v === "string" && (ROLE_IDS as readonly string[]).includes(v);
}

function isRecId(v: unknown): v is RecordingRowId {
  return typeof v === "string" && (REC_IDS as readonly string[]).includes(v);
}

function isChId(v: unknown): v is RecordingChannelId {
  return typeof v === "string" && (CH_IDS as readonly string[]).includes(v);
}

function isWhenId(v: unknown): v is RecordingWhenId {
  return typeof v === "string" && (WHEN_IDS as readonly string[]).includes(v);
}

export function parseStaffPricingPolicy(raw: unknown): StaffPricingPolicy {
  if (!raw || typeof raw !== "object") {
    throw new Error("staff-pricing-policy: invalid root");
  }
  const o = raw as Record<string, unknown>;

  if (o.currency !== "INR") {
    throw new Error("staff-pricing-policy: currency must be INR");
  }
  if (typeof o.version !== "number") {
    throw new Error("staff-pricing-policy: version required");
  }

  const months = o.trainingReviewCadenceMonths;
  if (typeof months !== "number" || !Number.isFinite(months) || months < 1 || months > 24) {
    throw new Error("staff-pricing-policy: trainingReviewCadenceMonths invalid (1–24)");
  }

  const raf = o.rangeAnchorFiles;
  if (!raf || typeof raf !== "object") {
    throw new Error("staff-pricing-policy: rangeAnchorFiles missing");
  }
  const ra = raf as Record<string, unknown>;
  const paths = [
    "stitchingAlterationsExtras",
    "effortModel",
    "rushPeak",
    "marginFloor",
  ] as const;
  const rangeAnchorFiles = {} as StaffPricingPolicy["rangeAnchorFiles"];
  for (const k of paths) {
    if (typeof ra[k] !== "string" || !(ra[k] as string).trim()) {
      throw new Error(`staff-pricing-policy: rangeAnchorFiles.${k} invalid`);
    }
    rangeAnchorFiles[k] = ra[k] as string;
  }

  const auth = o.authority;
  if (!Array.isArray(auth) || auth.length === 0) {
    throw new Error("staff-pricing-policy: authority required");
  }
  const authority: StaffPricingPolicy["authority"] = [];
  for (const row of auth) {
    if (!row || typeof row !== "object") {
      throw new Error("staff-pricing-policy: authority row invalid");
    }
    const ar = row as Record<string, unknown>;
    if (!isCaseId(ar.caseId) || !isRoleId(ar.roleId)) {
      throw new Error("staff-pricing-policy: authority.caseId or roleId invalid");
    }
    authority.push({ caseId: ar.caseId, roleId: ar.roleId });
  }

  const rec = o.recording;
  if (!Array.isArray(rec) || rec.length === 0) {
    throw new Error("staff-pricing-policy: recording required");
  }
  const recording: StaffPricingPolicy["recording"] = [];
  for (const row of rec) {
    if (!row || typeof row !== "object") {
      throw new Error("staff-pricing-policy: recording row invalid");
    }
    const rr = row as Record<string, unknown>;
    if (!isRecId(rr.id) || !isChId(rr.channelId) || !isWhenId(rr.whenId)) {
      throw new Error("staff-pricing-policy: recording id/channelId/whenId invalid");
    }
    recording.push({
      id: rr.id,
      channelId: rr.channelId,
      whenId: rr.whenId,
    });
  }

  return {
    version: o.version,
    currency: "INR",
    trainingReviewCadenceMonths: Math.round(months),
    rangeAnchorFiles,
    authority,
    recording,
  };
}
