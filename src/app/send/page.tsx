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
import { useToast } from "@/hooks/use-toast";

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

  const [isSending, setIsSending] = useState(false);

  const { toast } = useToast();

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

  const filteredCount =
    mode === "individual"
      ? selected
        ? 1
        : 0
      : filtered.length;

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
      if (mode === "individual" && !selected) {
        toast({
          title: "No recipient selected",
          description: "Please choose a member to send the email to.",
          variant: "destructive",
        });
        setStatus("No recipient selected");
        return;
      }

      if (mode === "bulk" && filteredCount === 0) {
        toast({
          title: "No recipients in this tier",
          description: "There are no members in the selected tier.",
          variant: "destructive",
        });
        setStatus("No recipients in this tier");
        return;
      }

      if (!subject.trim() || !body.trim()) {
        toast({
          title: "Subject and body required",
          description: "Please enter both a subject and a message body.",
          variant: "destructive",
        });
        setStatus("Subject and body are required");
        return;
      }

      setIsSending(true);
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

        toast({
          title: "Email sent",
          description: `Successfully sent ${j.count} email(s).`,
        });

        setSubject("");
        setBody("");
        setSelected("");
        setAttachments([]);
        setSelectedTemplateId("none");
      } else {
        const msg = j.error || "unknown";
        setStatus(`Error: ${msg}`);
        toast({
          title: "Send failed",
          description: msg,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      const msg = err?.message || "unknown";
      setStatus(`Error: ${msg}`);
      toast({
        title: "Unexpected error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  }

  async function saveTemplate() {
    if (!newTemplateName.trim() || !subject.trim() || !body.trim()) {
      setStatus("Template needs name, subject, and body");
      toast({
        title: "Cannot save template",
        description: "Template requires a name, subject, and body.",
        variant: "destructive",
      });
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
        const msg = t.error || "unknown";
        setStatus(`Error saving template: ${msg}`);
        toast({
          title: "Error saving template",
          description: msg,
          variant: "destructive",
        });
        return;
      }
      setTemplates((prev) => [t, ...prev]);
      setNewTemplateName("");
      setSelectedTemplateId(t.id);
      setStatus("Template saved");
      toast({
        title: "Template saved",
        description: `Template "${t.name}" is now available.`,
      });
    } catch (err: any) {
      const msg = err?.message || "unknown";
      setStatus(`Error saving template: ${msg}`);
      toast({
        title: "Error saving template",
        description: msg,
        variant: "destructive",
      });
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

  return (
    <div className="p-6 space-y-6">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Send Email</h2>

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

      {mode === "individual" && (
        <div>
          <label className="text-sm">Member</label>
          <Select
            value={selected || undefined}
            onValueChange={(v) => setSelected(v)}
          >
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

      <Input
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
      />

      <Textarea
        rows={8}
        placeholder="Write your message (links will be clickable)..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />

      <div>
        <label className="text-sm">Attachments</label>

        {/* ✅ UPDATED BLOCK — FILE SIZE LIMIT ADDED */}
        <Input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);

            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
            const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10MB total

            let total = 0;
            const valid: File[] = [];

            for (const f of files) {
              if (f.size > MAX_FILE_SIZE) {
                toast({
                  title: "Attachment too large",
                  description: `${f.name} exceeds 5MB.`,
                  variant: "destructive",
                });
                continue;
              }

              total += f.size;
              valid.push(f);
            }

            if (total > MAX_TOTAL_SIZE) {
              toast({
                title: "Attachments too large",
                description: "Combined attachments must be under 10MB.",
                variant: "destructive",
              });
              return;
            }

            setAttachments(valid);
          }}
        />

        {attachments.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {attachments.length} file(s) selected
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={buildPreview}
          disabled={isSending}
        >
          Preview
        </Button>
        <Button
          className="btn-gold"
          type="button"
          onClick={send}
          disabled={isSending}
        >
          {isSending ? "Sending..." : "Send Email"}
        </Button>
      </div>

      {status && <p className="text-sm">{status}</p>}

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
