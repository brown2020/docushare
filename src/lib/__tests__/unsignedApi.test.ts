import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { GET as listDocs, POST as createDoc } from "@/app/api/docs/route";
import { GET as docStats } from "@/app/api/docs/stats/route";
import { GET as shareLookup } from "@/app/api/share/route";
import { POST as aiWrite } from "@/app/api/ai/route";
import { POST as uploadFile } from "@/app/api/image/route";

describe("unsigned main user flow", () => {
  it("refuses to list, create, or summarize documents", async () => {
    const list = await listDocs();
    const created = await createDoc(
      new NextRequest("http://localhost/api/docs", {
        method: "POST",
        body: JSON.stringify({ name: "Untitled Document" }),
        headers: { "content-type": "application/json" },
      })
    );
    const stats = await docStats();

    expect(list.status).toBe(401);
    expect(created.status).toBe(401);
    expect(stats.status).toBe(401);
    expect(await list.text()).toMatch(/not signed in/i);
    expect(await created.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("refuses sharing and uploads without a session", async () => {
    const share = await shareLookup(
      new NextRequest("http://localhost/api/share?documentId=doc_1")
    );
    const upload = await uploadFile(
      new NextRequest("http://localhost/api/image", { method: "POST" })
    );

    expect(share.status).toBe(401);
    expect([401, 503]).toContain(upload.status);
  });

  it("does not call a model when nobody is signed in", async () => {
    const response = await aiWrite(
      new NextRequest("http://localhost/api/ai", {
        method: "POST",
        body: JSON.stringify({ option: "improve", prompt: "Hello", command: "improve" }),
        headers: { "content-type": "application/json" },
      })
    );

    expect([401, 503]).toContain(response.status);
  });

  it("keeps the bold control on the editor toolbar", () => {
    const menu = readFileSync(
      path.resolve(__dirname, "../../components/menus/TextMenu/TextMenu.tsx"),
      "utf8"
    );
    expect(menu).toContain('tooltip="Bold"');
    expect(menu).toContain('name="LetterB"');
    expect(menu).toContain("onBold");
  });
});
