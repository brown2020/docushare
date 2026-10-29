import { readFileSync } from "node:fs";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { canAffordCredits } from "@/lib/billing/credits";
import { estimateAiCharge } from "@/lib/ai/creditCharge";
import { STARTER_CREDITS } from "@/lib/billing";
import {
  displayedCredits,
  firebaseAuthUid,
  readCreditField,
  settleCreditCharge,
  userProfileDocPath,
} from "@/lib/billing/creditBalance";
import { decideStarterGrant } from "@/lib/billing/starterCredits";
import { isSafeImageKey } from "@/lib/images";
import { isSafeLinkHref } from "@/lib/links";
import {
  classifyUpload,
  clientUploadRejection,
  UNSUPPORTED_UPLOAD_MESSAGE,
} from "@/lib/uploads";

function zip(entries: { name: string; data: Buffer }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const compressed = deflateRawSync(entry.data);
    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    name.copy(local, 30);
    const localBuf = Buffer.concat([local, compressed]);
    locals.push(localBuf);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);
    offset += localBuf.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, eocd]);
}

describe("ai credit gate", () => {
  it("rejects a zero balance and still prices an empty prompt", () => {
    expect(canAffordCredits(0, estimateAiCharge(""))).toBe(false);
    expect(canAffordCredits(0, 1)).toBe(false);
    expect(estimateAiCharge("hello")).toBeGreaterThanOrEqual(1);
    expect(canAffordCredits(estimateAiCharge("hello"), estimateAiCharge("hello"))).toBe(true);
  });

  it("deducts the charge from the balance the profile displays", () => {
    const uid = "firebase-uid";
    const charge = estimateAiCharge("Make this shorter");
    expect(userProfileDocPath(uid)).toBe(`users/${uid}/profile/userData`);
    expect(firebaseAuthUid({ uid: "other", sub: uid, user_id: "also" })).toBe(uid);
    expect(charge).toBeGreaterThan(0);
    expect(charge).toBeLessThan(990);

    const profile = {
      get: (field: string) => (field === "credits" ? "990" : undefined),
      data: () => ({ credits: "990" }),
    };
    const raw = readCreditField(profile);
    expect(displayedCredits(raw)).toBe(990);

    const settled = settleCreditCharge(raw, charge, true);
    expect(settled).toEqual({ ok: true, balance: 990, next: 990 - charge });
    const fromNumber = settleCreditCharge(990, charge, true);
    const fromBigint = settleCreditCharge(BigInt(990), charge, true);
    expect(fromNumber.ok && fromBigint.ok).toBe(true);
    if (fromNumber.ok) expect(fromNumber.next).toBe(990 - charge);
    if (fromBigint.ok) expect(fromBigint.next).toBe(990 - charge);

    expect(settleCreditCharge(0, charge, true)).toEqual({ ok: false, balance: 0 });
    expect(settleCreditCharge("0", charge, true).ok).toBe(false);
    expect(canAffordCredits(0, charge)).toBe(false);

    const route = readFileSync(
      path.resolve(__dirname, "../../app/api/ai/route.ts"),
      "utf8"
    );
    const missingKey = route.slice(route.indexOf("process.env.OPENAI_API_KEY"));
    const keyReturn = missingKey.slice(0, missingKey.indexOf("modelName ="));
    expect(keyReturn).toContain("AI_KEY_MISSING_MESSAGE");
    expect(keyReturn).toContain("status: 400");
    expect(keyReturn).not.toContain("outOfCredits");
    expect(route).toContain("status: 402");
  });
});

describe("starter credits", () => {
  it("grants 1000 once to an account with no balance and no purchase", () => {
    expect(
      decideStarterGrant({ alreadyGranted: false, credits: 0, hasPayment: false })
    ).toEqual({ grant: STARTER_CREDITS, markGranted: true });
    expect(STARTER_CREDITS).toBe(1000);
  });

  it("does not refill after the grant, a balance, or a purchase", () => {
    expect(
      decideStarterGrant({ alreadyGranted: true, credits: 0, hasPayment: false }).grant
    ).toBe(0);
    expect(
      decideStarterGrant({ alreadyGranted: false, credits: 25, hasPayment: false }).grant
    ).toBe(0);
    expect(
      decideStarterGrant({ alreadyGranted: false, credits: 0, hasPayment: true }).grant
    ).toBe(0);
  });
});

describe("uploads", () => {
  it("explains an unsupported type instead of accepting it", () => {
    expect(clientUploadRejection({ name: "notes.exe", size: 10 })).toBe(
      UNSUPPORTED_UPLOAD_MESSAGE
    );
    const result = classifyUpload(new Uint8Array([0, 1, 2, 3, 4]), "notes.exe");
    expect(result.ok).toBe(false);
  });

  it("accepts a PDF and extracts its text", () => {
    const body = Buffer.from("BT (Hello from PDF) Tj ET");
    const compressed = deflateRawSync(body);
    const pdf = Buffer.concat([
      Buffer.from(
        `%PDF-1.4\n1 0 obj\n<< /Filter /FlateDecode /Length ${compressed.length} >>\nstream\n`
      ),
      compressed,
      Buffer.from("\nendstream\nendobj\n"),
    ]);
    const result = classifyUpload(pdf, "memo.pdf");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.file.kind).toBe("document");
      expect(result.file.contentType).toBe("application/pdf");
      expect(result.file.text).toContain("Hello from PDF");
    }
  });

  it("accepts text and docx files the editor can place in front of AI", () => {
    const text = classifyUpload(Buffer.from("Agenda item one"), "agenda.md");
    expect(text.ok).toBe(true);
    if (text.ok) expect(text.file.text).toContain("Agenda item one");

    const docx = zip([
      {
        name: "word/document.xml",
        data: Buffer.from(
          "<w:document><w:p><w:r><w:t>Quarterly report</w:t></w:r></w:p></w:document>"
        ),
      },
    ]);
    const word = classifyUpload(docx, "report.docx");
    expect(word.ok).toBe(true);
    if (word.ok) expect(word.file.text).toContain("Quarterly report");
  });

  it("allows stored file links and document keys", () => {
    expect(
      isSafeLinkHref("/api/image?image_key=user_1%2F11111111-1111-1111-1111-111111111111.pdf")
    ).toBe(true);
    expect(isSafeLinkHref("javascript:alert(1)")).toBe(false);
    expect(
      isSafeImageKey("user_1/11111111-1111-1111-1111-111111111111.pdf")
    ).toBe(true);
    expect(
      isSafeImageKey("user_1/11111111-1111-1111-1111-111111111111.docx")
    ).toBe(true);
  });
});
