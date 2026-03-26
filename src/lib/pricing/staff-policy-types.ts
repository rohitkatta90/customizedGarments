export type AuthorityCaseId =
  | "within_tier_band"
  | "outside_adjustment_band"
  | "published_config_change";

export type AuthorityRoleId = "any_quoted_staff" | "owner_or_lead" | "owner_only";

export type RecordingRowId =
  | "whatsapp_written_quote"
  | "admin_ledger_agrees"
  | "exception_internal_note";

export type RecordingChannelId = "whatsapp" | "admin_order" | "order_notes";

export type RecordingWhenId =
  | "always_before_payment"
  | "always"
  | "override_escalation_or_unusual_scope";

export type StaffPricingPolicy = {
  version: number;
  currency: "INR";
  trainingReviewCadenceMonths: number;
  rangeAnchorFiles: {
    stitchingAlterationsExtras: string;
    effortModel: string;
    rushPeak: string;
    marginFloor: string;
  };
  authority: { caseId: AuthorityCaseId; roleId: AuthorityRoleId }[];
  recording: {
    id: RecordingRowId;
    channelId: RecordingChannelId;
    whenId: RecordingWhenId;
  }[];
};
