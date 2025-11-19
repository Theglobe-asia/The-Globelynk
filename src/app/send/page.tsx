"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import BackToDashboard from "@/components/back-to-dashboard";

type Member = {
  id: string;
  name: string;
  email: string;
  tier: "BASIC" | "SILVER" | "GOLD";
};

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type AttachmentPayload = {
  filename: string;
  content: string;
  mimeType: string;
};

export default function SendPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<"individual" | "bulk">("individual");
  const [tier, setTier] = useState<"all" | "basic" | "silver" | "gold">("all");
  const [selected, setSelected] = useState<string>("");

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then(setMembers)
      .catch(() => setMembers([]));

    fetch("/api/templates")
      .then((r) => (r.ok ? r.json() : []))
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, []);

  const filtered =
    tier === "all"
      ? members
      : members.filter((m) => m.tier === tier.toUpperCase());

  async function filesToAttachmentPayload(
    files: File[]
  ): Promise<AttachmentPayload[]> {
    if (!files.length) return [];
    return Promise.all(
      files.map(
        (file) =>
          new Promise<AttachmentPayload>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(",")[1] ?? "";
              resolve({
                filename: file.name,
                content: base64,
                mimeType: file.type || "application/octet-stream",
              });
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          })
      )
    );
  }

  async function send() {
    try {
      setStatus("Sending...");

      const attachmentPayload = await filesToAttachmentPayload(attachments);

      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: mode,
          tier,
          to: selected,
          subject,
          body,
          attachments: attachmentPayload,
        }),
      });

      const j = await res.json();

      if (res.ok) {
        setStatus(`Sent: ${j.count} email(s)`);

        // RESET FIELDS AFTER SUCCESSFUL SEND
        setSubject("");
        setBody("");
        setSelected("");
        setAttachments([]);
        setSelectedTemplateId("none");
      } else {
        setStatus(`Error: ${j.error || "unknown"}`);
      }
    } catch (err: any) {
      setStatus(`Error: ${err?.message || "unknown"}`);
    }
  }

  async function saveTemplate() {
    if (!newTemplateName.trim() || !subject.trim() || !body.trim()) {
      setStatus("Template needs name, subject, and body");
      return;
    }

    try {
      setIsSavingTemplate(true);

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          subject,
          body,
        }),
      });

      const t = await res.json();

      if (!res.ok) {
        setStatus(`Error saving template: ${t.error || "unknown"}`);
        return;
      }

      setTemplates((prev) => [t, ...prev]);
      setNewTemplateName("");
      setSelectedTemplateId(t.id);
      setStatus("Template saved");
    } catch (err: any) {
      setStatus(`Error saving template: ${err?.message || "unknown"}`);
    } finally {
      setIsSavingTemplate(false);
    }
  }

  function buildPreview() {
    const escaped = body
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const withBreaks = escaped.replace(/\n/g, "<br>");

    const html = withBreaks.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#b8860b; font-weight:bold;">$1</a>'
    );

    const signature = `
<div style="font-family: Arial, Helvetica, sans-serif; color:#333;">
  <p style="margin:0; font-size:18px; font-weight:bold;">The Globe</p>
  <p style="margin:4px 0; font-size:14px; color:#666;">
    The Globe’s Heritage by Chef Alex • The Globe Hotel
  </p>
  <p style="margin:10px 0 0 0; font-size:13px; color:#777;">
    The Globe’s Hidden Gem<br>
    Pattaya, Thailand
  </p>
  <p style="margin:10px 0 0 0; font-size:13px;">
    <a href="mailto:info@theglobeasia.com" style="color:#b8860b; text-decoration:none;">
      info@theglobeasia.com
    </a>
  </p>
  <p style="margin:5px 0 0 0; font-size:12px;">
    <a href="https://theglobeasia.com" style="color:#000; font-weight:bold; text-decoration:none;">
      www.theglobeasia.com
    </a>
  </p>
</div>
`;

    const wrapper = `
<div style="max-width:600px;margin:0 auto;background:#ffffff;padding:24px;border-radius:12px;box-shadow:0 4px 14px rgba(0,0,0,0.08);font-family:Arial,Helvetica,sans-serif;">
  <div style="font-size:15px;line-height:1.6;color:#333333;">
    ${html}
  </div>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eeeeee;" />
  ${signature}
</div>
`;

    setPreviewHtml(wrapper);
    setShowPreview(true);
  }

  const filteredCount =
    mode === "individual"
      ? selected
        ? 1
        : 0
      : filtered.length;

  return (
    <div className="p-6 space-y-6">
      <BackToDashboard />

      <h2 className="text-2xl font-semibold">Send Email</h2>

      {/* Send Mode + Tier */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Send Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">individual</SelectItem>
              <SelectItem value="bulk">bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm">Tier</label>
          <Select value={tier} onValueChange={(v) => setTier(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">all</SelectItem>
              <SelectItem value="basic">basic</SelectItem>
              <SelectItem value="silver">silver</SelectItem>
              <SelectItem value="gold">gold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Individual Member Selector */}
      {mode === "individual" && (
        <div>
          <label className="text-sm">Member</label>
          <Select value={selected || undefined} onValueChange={(v) => setSelected(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select member" />
            </SelectTrigger>
            <SelectContent>
              {filtered.map((m) => (
                <SelectItem key={m.id} value={m.email}>
                  {m.name} &lt;{m.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Current Recipient Count */}
      <Input
        readOnly
        value={
          mode === "individual"
            ? selected || "No recipient selected"
            : `${filteredCount} recipient(s)`
        }
      />

      {/* Templates */}
      <div className="space-y-2">
        <label className="text-sm">Template</label>

        <div className="flex gap-2">
          <Select
            value={selectedTemplateId}
            onValueChange={(id) => {
              setSelectedTemplateId(id);

              if (id === "none") return;

              const t = templates.find((t) => t.id === id);
              if (t) {
                setSubject(t.subject);
                setBody(t.body);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="No template" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="none">No template</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Template name (for saving current email)"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
          />

          <Button
            variant="outline"
            type="button"
            onClick={saveTemplate}
            disabled={isSavingTemplate}
          >
            Save template
          </Button>
        </div>
      </div>

      {/* Subject */}
      <Input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      {/* Body */}
      <Textarea
        rows={8}
        placeholder="Write your message (links will be clickable)..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      {/* Attachments */}
      <div>
        <label className="text-sm">Attachments</label>
        <Input
          type="file"
          multiple
          onChange={(e) => setAttachments(Array.from(e.target.files || []))}
        />

        {attachments.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {attachments.length} file(s) selected
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" type="button" onClick={buildPreview}>
          Preview
        </Button>

        <Button className="btn-gold" type="button" onClick={send}>
          Send Email
        </Button>
      </div>

      {status && <p className="text-sm">{status}</p>}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-xl w-full max-h-[80vh] overflow-auto rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Email Preview</h3>

            <p className="text-sm text-muted-foreground">
              This is how your email will roughly look to the recipient.
            </p>

            <div className="border rounded-md p-4 bg-neutral-50">
              <div
                className="text-sm"
                dangerouslySetInnerHTML={{ __html: previewHtml || "" }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setShowPreview(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
