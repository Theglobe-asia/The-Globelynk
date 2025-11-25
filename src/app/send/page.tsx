"use client";

import { useEffect, useMemo, useState } from "react";
import { buildCampaignEmail, type CampaignTemplateKey } from "@/lib/campaign-email";

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

  templateKey?: CampaignTemplateKey;
  bannerUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  leftImageUrl?: string;
  leftImageLabel?: string;
  rightImageUrl?: string;
  rightImageLabel?: string;
};

type AttachmentPayload = {
  filename: string;
  content: string;
  mimeType: string;
};

export default function SendPage() {
  const { toast } = useToast();

  // recipients
  const [members, setMembers] = useState<Member[]>([]);
  const [mode, setMode] = useState<"individual" | "bulk">("individual");
  const [tier, setTier] = useState<"all" | "basic" | "silver" | "gold">("all");
  const [selected, setSelected] = useState<string>("");

  // message
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  // campaign fields
  const [templateKey, setTemplateKey] = useState<CampaignTemplateKey>("classic");
  const [bannerUrl, setBannerUrl] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [leftImageUrl, setLeftImageUrl] = useState("");
  const [leftImageLabel, setLeftImageLabel] = useState("");
  const [rightImageUrl, setRightImageUrl] = useState("");
  const [rightImageLabel, setRightImageLabel] = useState("");

  // templates
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("none");
  const [newTemplateName, setNewTemplateName] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);

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

  const filtered = useMemo(() => {
    return tier === "all" ? members : members.filter((m) => m.tier === tier.toUpperCase());
  }, [members, tier]);

  const filteredCount =
    mode === "individual" ? (selected ? 1 : 0) : filtered.length;

  async function filesToAttachmentPayload(files: File[]): Promise<AttachmentPayload[]> {
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

          templateKey,
          bannerUrl,
          ctaText,
          ctaUrl,
          leftImageUrl,
          leftImageLabel,
          rightImageUrl,
          rightImageLabel,

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

          templateKey,
          bannerUrl,
          ctaText,
          ctaUrl,
          leftImageUrl,
          leftImageLabel,
          rightImageUrl,
          rightImageLabel,
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
    const html = buildCampaignEmail({
      templateKey,
      subject: subject || "No Subject",
      body: body || "",
      bannerUrl: bannerUrl || undefined,
      ctaText: ctaText || undefined,
      ctaUrl: ctaUrl || undefined,
      leftImageUrl: leftImageUrl || undefined,
      leftImageLabel: leftImageLabel || undefined,
      rightImageUrl: rightImageUrl || undefined,
      rightImageLabel: rightImageLabel || undefined,
    });

    setPreviewHtml(html);
    setShowPreview(true);
  }

  function applyTemplate(t: Template) {
    setSubject(t.subject || "");
    setBody(t.body || "");

    setTemplateKey(t.templateKey || "classic");
    setBannerUrl(t.bannerUrl || "");
    setCtaText(t.ctaText || "");
    setCtaUrl(t.ctaUrl || "");
    setLeftImageUrl(t.leftImageUrl || "");
    setLeftImageLabel(t.leftImageLabel || "");
    setRightImageUrl(t.rightImageUrl || "");
    setRightImageLabel(t.rightImageLabel || "");
  }

  return (
    <div className="p-6 space-y-6">
      <BackToDashboard />
      <h2 className="text-2xl font-semibold">Send Email</h2>

      {/* recipient selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm">Send Mode</label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="individual">individual</SelectItem>
              <SelectItem value="bulk">bulk</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm">Tier</label>
          <Select value={tier} onValueChange={(v) => setTier(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <Select value={selected || undefined} onValueChange={setSelected}>
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

      {/* templates */}
      <div className="space-y-2">
        <label className="text-sm">Template</label>

        <Select
          value={selectedTemplateId}
          onValueChange={(id) => {
            setSelectedTemplateId(id);
            if (id === "none") return;
            const t = templates.find((x) => x.id === id);
            if (t) applyTemplate(t);
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

      {/* campaign layout selector */}
      <div className="space-y-2">
        <label className="text-sm">Campaign Layout</label>
        <Select value={templateKey} onValueChange={(v) => setTemplateKey(v as CampaignTemplateKey)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select layout" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classic">Classic (Mailchimp style)</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="spotlight">Spotlight</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* banner */}
      <div className="space-y-2">
        <label className="text-sm">Banner Image URL</label>
        <Input
          placeholder="https://..."
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
        />
      </div>

      {/* subject/body */}
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

      {/* CTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm">CTA Text</label>
          <Input
            placeholder="Explore Now"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm">CTA URL</label>
          <Input
            placeholder="https://..."
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
          />
        </div>
      </div>

      {/* 2-column images */}
      <div className="space-y-2">
        <label className="text-sm">Two-Column Images</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Input
              placeholder="Left image URL"
              value={leftImageUrl}
              onChange={(e) => setLeftImageUrl(e.target.value)}
            />
            <Input
              placeholder="Left label"
              value={leftImageLabel}
              onChange={(e) => setLeftImageLabel(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Input
              placeholder="Right image URL"
              value={rightImageUrl}
              onChange={(e) => setRightImageUrl(e.target.value)}
            />
            <Input
              placeholder="Right label"
              value={rightImageLabel}
              onChange={(e) => setRightImageLabel(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* attachments (unchanged UI) */}
      <div>
        <label className="text-sm">Attachments</label>

        <Input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);

            const MAX_FILE_SIZE = 5 * 1024 * 1024;
            const MAX_TOTAL_SIZE = 10 * 1024 * 1024;

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
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attachments.map((file, i) => {
              const isImage = file.type.startsWith("image/");
              const isPdf = file.type === "application/pdf";
              const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

              return (
                <div
                  key={i}
                  className="border rounded-lg p-3 bg-neutral-50 flex flex-col gap-2 h-full justify-between"
                >
                  <div className="flex flex-col gap-2">
                    {isImage ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-24 rounded object-cover border"
                      />
                    ) : isPdf ? (
                      <div className="w-full h-24 flex items-center justify-center bg-red-100 text-red-600 font-semibold rounded">
                        PDF
                      </div>
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-neutral-200 text-neutral-600 rounded">
                        FILE
                      </div>
                    )}

                    <div className="flex flex-col">
                      <span className="text-sm font-medium line-clamp-2">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sizeMB} MB
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-1 self-start"
                    onClick={() =>
                      setAttachments((prev) =>
                        prev.filter((_, idx) => idx !== i)
                      )
                    }
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* actions */}
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

      {/* preview modal */}
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
