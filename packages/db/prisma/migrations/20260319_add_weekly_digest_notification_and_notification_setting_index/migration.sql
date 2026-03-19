ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'WEEKLY_DIGEST';

INSERT INTO "notification_setting" ("id", "userId", "channel", "type", "isEnabled")
SELECT
  'weekly_digest_' || md5(ns."userId" || ':' || ns."channel"::text),
  ns."userId",
  ns."channel",
  'WEEKLY_DIGEST'::"NotificationType",
  ns."isEnabled"
FROM "notification_setting" ns
WHERE ns."channel" = 'EMAIL'::"NotificationChannel"
  AND ns."type" = 'NEW_BOUNTY_MATCHING_SKILLS'::"NotificationType"
ON CONFLICT ("userId", "channel", "type") DO NOTHING;

CREATE INDEX IF NOT EXISTS "notification_setting_type_channel_isEnabled_idx"
ON "notification_setting" ("type", "channel", "isEnabled");
