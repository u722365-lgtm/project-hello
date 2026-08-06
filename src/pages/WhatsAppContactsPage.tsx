import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Upload,
  Search,
  MessageCircle,
  Trash2,
  Plus,
  Tag,
  Users,
  Sparkles,
  Send,
  Phone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { backend } from "@/integrations/local/client";
import { parseVCard } from "@/lib/whatsapp/vcardParser";
import { useNavigate } from "react-router-dom";
import { canUseCloudAI } from "@/lib/privacy/deviceOnlyPledge";
import { runLocalChat } from "@/lib/offline/localChat";
import type { RouterMessage } from "@/lib/offline/hybridRouter";

interface Contact {
  id: string;
  name: string;
  phone: string;
  tags: string[];
  group_name: string | null;
  notes: string | null;
  last_messaged_at: string | null;
  source: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
};

const openWhatsApp = (phone: string, text?: string) => {
  const clean = phone.replace(/[^\d]/g, "");
  const url = `https://wa.me/${clean}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
  window.open(url, "_blank", "noopener");
};

export default function WhatsAppContactsPage() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Contact | null>(null);
  const [adding, setAdding] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const [draftMsg, setDraftMsg] = useState("");
  const [draftTarget, setDraftTarget] = useState<Contact | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data: session } = await backend.auth.getSession();
    if (!session.session) {
      navigate("/auth");
      return;
    }
    const { data, error } = await backend
      .from("whatsapp_contacts")
      .select("*")
      .order("name", { ascending: true });
    if (error) toast.error(error.message);
    else setContacts((data as Contact[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [contacts]);

  const allGroups = useMemo(() => {
    const s = new Set<string>();
    contacts.forEach((c) => c.group_name && s.add(c.group_name));
    return Array.from(s).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (activeTag && !c.tags?.includes(activeTag)) return false;
      if (activeGroup && c.group_name !== activeGroup) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.notes?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, search, activeTag, activeGroup]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const parsed = parseVCard(text);
    if (!parsed.length) {
      toast.error("No contacts found in this file. Make sure it's a .vcf export.");
      return;
    }
    const { data: session } = await backend.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return;
    const rows = parsed.map((p) => ({
      user_id: uid,
      name: p.name.slice(0, 200),
      phone: p.phone.slice(0, 32),
      source: "vcard",
    }));
    const { error, count } = await backend
      .from("whatsapp_contacts")
      .upsert(rows, { onConflict: "user_id,phone", count: "exact" });
    if (error) toast.error(error.message);
    else toast.success(`Imported ${count ?? rows.length} contacts`);
    load();
  };

  const saveContact = async (c: Partial<Contact> & { name: string; phone: string }) => {
    const { data: session } = await backend.auth.getSession();
    const uid = session.session?.user.id;
    if (!uid) return;
    const payload = {
      user_id: uid,
      name: c.name.trim(),
      phone: c.phone.trim(),
      tags: c.tags ?? [],
      group_name: c.group_name?.trim() || null,
      notes: c.notes?.trim() || null,
      source: c.source ?? "manual",
    };
    if ((c as Contact).id) {
      const { error } = await backend
        .from("whatsapp_contacts")
        .update(payload)
        .eq("id", (c as Contact).id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await backend.from("whatsapp_contacts").upsert(payload, {
        onConflict: "user_id,phone",
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    setEditing(null);
    setAdding(false);
    load();
  };

  const deleteContacts = async (ids: string[]) => {
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} contact${ids.length > 1 ? "s" : ""}?`)) return;
    const { error } = await backend.from("whatsapp_contacts").delete().in("id", ids);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      setSelected(new Set());
      load();
    }
  };

  const aiDraft = async () => {
    if (!aiPrompt.trim() || !draftTarget) return;
    setAiBusy(true);
    try {
      const messages: RouterMessage[] = [
        {
          role: "system",
          content:
            "You draft short, friendly, professional WhatsApp messages. Output ONLY the message body, no preamble, no quotes. Keep under 350 chars unless asked.",
        },
        {
          role: "user",
          content: `Recipient: ${draftTarget.name}${draftTarget.notes ? ` (notes: ${draftTarget.notes})` : ""}\n\nDraft a WhatsApp message: ${aiPrompt}`,
        },
      ];

      let txt = "";
      if (canUseCloudAI()) {
        const { data, error } = await backend.functions.invoke("chat", {
          body: { messages, personality: "professional" },
        });
        if (error) throw error;
        txt =
          typeof data === "string"
            ? data
            : (data as { content?: string; message?: string; text?: string; choices?: Array<{ message?: { content?: string } }> })
                ?.content ??
              (data as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
                ?.content ??
              (data as { message?: string })?.message ??
              (data as { text?: string })?.text ??
              "";
      } else {
        const { content } = await runLocalChat(messages);
        txt = content;
      }

      if (txt) setDraftMsg(String(txt).trim());
      else toast.error("AI returned empty draft");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "AI draft failed");
    } finally {
      setAiBusy(false);
    }
  };

  const sendBroadcast = () => {
    const targets = contacts.filter((c) => selected.has(c.id));
    if (!targets.length) return toast.error("Select contacts first");
    if (!broadcastMsg.trim()) return toast.error("Write a message");
    // Open first 5 immediately; copy rest to clipboard as links
    const first = targets.slice(0, 5);
    const rest = targets.slice(5);
    first.forEach((t) => openWhatsApp(t.phone, broadcastMsg));
    if (rest.length) {
      const links = rest
        .map(
          (t) =>
            `${t.name}: https://wa.me/${t.phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(
              broadcastMsg,
            )}`,
        )
        .join("\n");
      navigator.clipboard?.writeText(links);
      toast.success(
        `Opened first 5. Remaining ${rest.length} links copied to clipboard.`,
      );
    } else {
      toast.success(`Opened ${first.length} chats`);
    }
    // Mark last_messaged_at
    backend
      .from("whatsapp_contacts")
      .update({ last_messaged_at: new Date().toISOString() })
      .in(
        "id",
        targets.map((t) => t.id),
      )
      .then(() => load());
    setBroadcastOpen(false);
    setBroadcastMsg("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>WhatsApp Contacts | ShadowTalk</title>
        <meta
          name="description"
          content="Import, organize, and message your WhatsApp contacts with AI-assisted drafts and broadcast — no API, no QR pairing."
        />
        <link rel="canonical" href="https://shadowtalk-ai.com/whatsapp" />
      </Helmet>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <motion.div {...fadeUp} className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <MessageCircle className="w-8 h-8 text-primary" />
                WhatsApp Contacts
              </h1>
              <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
                Import a .vcf export from your phone, tag and group your contacts, and
                draft messages with AI. Sending opens WhatsApp directly — no API
                required.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <input
                ref={fileRef}
                type="file"
                accept=".vcf,text/vcard,text/x-vcard"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import .vcf
              </Button>
              <Button onClick={() => setAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add contact
              </Button>
            </div>
          </div>
        </motion.div>

        <Card className="p-4 mb-4 backdrop-blur-xl bg-card/60 border-border/50">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, phone, tag, note…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {selected.size > 0 && (
              <>
                <Badge variant="secondary">{selected.size} selected</Badge>
                <Button size="sm" onClick={() => setBroadcastOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Broadcast
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deleteContacts(Array.from(selected))}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </>
            )}
          </div>

          {(allTags.length > 0 || allGroups.length > 0) && (
            <div className="flex gap-2 flex-wrap mt-3">
              {allGroups.length > 0 && (
                <div className="flex gap-1 items-center flex-wrap">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  {allGroups.map((g) => (
                    <Badge
                      key={g}
                      variant={activeGroup === g ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setActiveGroup(activeGroup === g ? null : g)}
                    >
                      {g}
                    </Badge>
                  ))}
                </div>
              )}
              {allTags.length > 0 && (
                <div className="flex gap-1 items-center flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                  {allTags.map((t) => (
                    <Badge
                      key={t}
                      variant={activeTag === t ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => setActiveTag(activeTag === t ? null : t)}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
              {(activeTag || activeGroup) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActiveTag(null);
                    setActiveGroup(null);
                  }}
                >
                  <X className="w-3 h-3 mr-1" /> Clear filters
                </Button>
              )}
            </div>
          )}
        </Card>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading…</div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center backdrop-blur-xl bg-card/60">
            <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">
              {contacts.length === 0
                ? "No contacts yet. Import a .vcf or add manually."
                : "No contacts match your filters."}
            </p>
            {contacts.length === 0 && (
              <Button onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import .vcf
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <Card className="p-3 backdrop-blur-xl bg-card/40 border-border/50 hover:bg-card/70 transition flex items-center gap-3">
                  <Checkbox
                    checked={selected.has(c.id)}
                    onCheckedChange={(v) => {
                      const next = new Set(selected);
                      if (v) next.add(c.id);
                      else next.delete(c.id);
                      setSelected(next);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                      {c.group_name && (
                        <Badge variant="outline" className="text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {c.group_name}
                        </Badge>
                      )}
                      {c.tags?.map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                    {c.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {c.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDraftTarget(c);
                        setDraftMsg("");
                        setAiPrompt("");
                        setDraftOpen(true);
                      }}
                      title="Draft & send"
                    >
                      <Sparkles className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openWhatsApp(c.phone)}
                      title="Open WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(c)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit dialog */}
      <Dialog
        open={adding || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setAdding(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit contact" : "Add contact"}</DialogTitle>
          </DialogHeader>
          <ContactForm
            initial={editing ?? undefined}
            onCancel={() => {
              setEditing(null);
              setAdding(false);
            }}
            onSave={saveContact}
          />
        </DialogContent>
      </Dialog>

      {/* Draft & send dialog */}
      <Dialog open={draftOpen} onOpenChange={setDraftOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Message {draftTarget?.name}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="ai">
            <TabsList>
              <TabsTrigger value="ai">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> AI draft
              </TabsTrigger>
              <TabsTrigger value="write">Write</TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="space-y-2">
              <Input
                placeholder="What should the message say? e.g. 'follow up on the proposal'"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
              <Button size="sm" onClick={aiDraft} disabled={aiBusy || !aiPrompt.trim()}>
                {aiBusy ? "Drafting…" : "Generate"}
              </Button>
              <Textarea
                rows={5}
                value={draftMsg}
                onChange={(e) => setDraftMsg(e.target.value)}
                placeholder="AI draft appears here — edit before sending."
              />
            </TabsContent>
            <TabsContent value="write">
              <Textarea
                rows={6}
                value={draftMsg}
                onChange={(e) => setDraftMsg(e.target.value)}
                placeholder="Type your message…"
              />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDraftOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!draftTarget) return;
                openWhatsApp(draftTarget.phone, draftMsg);
                backend
                  .from("whatsapp_contacts")
                  .update({ last_messaged_at: new Date().toISOString() })
                  .eq("id", draftTarget.id)
                  .then(() => load());
                setDraftOpen(false);
              }}
            >
              <Send className="w-4 h-4 mr-2" />
              Send via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broadcast dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Broadcast to {selected.size} contacts</DialogTitle>
          </DialogHeader>
          <Textarea
            rows={6}
            placeholder="Message to send to all selected contacts…"
            value={broadcastMsg}
            onChange={(e) => setBroadcastMsg(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            First 5 WhatsApp chats open in new tabs; remaining links are copied to your
            clipboard.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBroadcastOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendBroadcast}>
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Contact;
  onSave: (c: Partial<Contact> & { name: string; phone: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [tags, setTags] = useState((initial?.tags ?? []).join(", "));
  const [group, setGroup] = useState(initial?.group_name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground">Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} />
      </div>
      <div>
        <label className="text-xs text-muted-foreground">
          Phone (with country code, e.g. +14155551234)
        </label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={32}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">Tags (comma-separated)</label>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Group</label>
          <Input value={group} onChange={(e) => setGroup(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Notes</label>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!name.trim() || !phone.trim()) {
              toast.error("Name and phone are required");
              return;
            }
            onSave({
              ...(initial ?? {}),
              name,
              phone,
              tags: tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
              group_name: group,
              notes,
            });
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
