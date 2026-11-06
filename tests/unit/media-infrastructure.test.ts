import { describe, expect, it } from "vitest";
import {
  MAX_SOURCE_BYTES,
  mediaService,
  validateUploadRequest,
} from "../../src/lib/media-infrastructure";
describe("future media boundary", () => {
  it("accepts declared supported source metadata up to the documented limit", () =>
    expect(
      validateUploadRequest({
        filename: "Lecture 01.mp4",
        contentType: "video/mp4",
        sizeBytes: MAX_SOURCE_BYTES,
      }).sizeBytes,
    ).toBe(MAX_SOURCE_BYTES));
  it.each([
    { filename: "../lecture.mp4", contentType: "video/mp4", sizeBytes: 2 },
    { filename: "lecture.html", contentType: "video/mp4", sizeBytes: 2 },
    { filename: "lecture.mp4", contentType: "text/html", sizeBytes: 2 },
    {
      filename: "lecture.mp4",
      contentType: "video/mp4",
      sizeBytes: MAX_SOURCE_BYTES + 1,
    },
    { filename: "lecture.mp4", contentType: "video/mp4", sizeBytes: 0 },
  ])("rejects unsafe declared media request %#", (input) =>
    expect(() => validateUploadRequest(input)).toThrow(),
  );
  it("cannot issue fake upload or playback URLs while integration is unavailable", async () => {
    expect(mediaService.available).toBe(false);
    await expect(
      mediaService.createUpload("creator", {
        filename: "lecture.mp4",
        contentType: "video/mp4",
        sizeBytes: 100,
      }),
    ).rejects.toThrow("not configured");
    await expect(mediaService.playback("asset", null)).rejects.toThrow(
      "not configured",
    );
  });
});
