import assert from "node:assert/strict";
import { test } from "node:test";
import { canOptimizeAvatarUrl, getAvatarRequestSize } from "@/lib/avatar";

test("canOptimizeAvatarUrl allows whitelisted remote hosts and local raster paths", () => {
  assert.equal(
    canOptimizeAvatarUrl(
      "https://dfeokmrfwgrufruieunh.supabase.co/storage/v1/object/public/public_images/artikel/123.jpg"
    ),
    true
  );
  assert.equal(
    canOptimizeAvatarUrl(
      "https://lh3.googleusercontent.com/a/ACg8ocL6wJmBp0z0=s96-c"
    ),
    true
  );
  assert.equal(canOptimizeAvatarUrl("/images/logo2.webp"), true);
});

test("canOptimizeAvatarUrl rejects unknown hosts, SVGs, data/blob URLs, and empty values", () => {
  assert.equal(canOptimizeAvatarUrl(""), false);
  assert.equal(canOptimizeAvatarUrl(null), false);
  assert.equal(canOptimizeAvatarUrl(undefined), false);
  assert.equal(canOptimizeAvatarUrl("data:image/png;base64,AAA"), false);
  assert.equal(canOptimizeAvatarUrl("blob:https://example.com/123"), false);
  assert.equal(canOptimizeAvatarUrl("/posters/default-event.svg"), false);
  assert.equal(canOptimizeAvatarUrl("https://drive.google.com/uc?export=view&id=123"), false);
  assert.equal(canOptimizeAvatarUrl("http://dfeokmrfwgrufruieunh.supabase.co/a.jpg"), false);
});

test("getAvatarRequestSize picks ~2x supersampled targets for crisp small avatars", () => {
  assert.equal(getAvatarRequestSize(24), 96);
  assert.equal(getAvatarRequestSize(32), 96);
  assert.equal(getAvatarRequestSize(44), 96);
  assert.equal(getAvatarRequestSize(56), 128);
  assert.equal(getAvatarRequestSize(64), 128);
  assert.equal(getAvatarRequestSize(96), 256);
});
