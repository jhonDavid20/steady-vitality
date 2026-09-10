"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Peer { id: string; firstName: string; lastName: string }
interface Message { id: string; senderId: string; body: string; kind: "message" | "check_in"; createdAt: string }

export function CoachingChat({ userId, isCoach, locale }: { userId: string; isCoach: boolean; locale: string }) {
  const t = useTranslations("Messages");
  const [peers, setPeers] = useState<Peer[]>([]);
  const [peerId, setPeerId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => { void fetch("/api/daily/messages").then(async (response) => { if (!response.ok) return; const data = (await response.json()).data as Peer[]; setPeers(data); setPeerId((current) => current || data[0]?.id || ""); }); }, []);
  useEffect(() => { if (peerId) void fetch(`/api/daily/messages/${peerId}`).then(async (response) => { if (response.ok) setMessages((await response.json()).data.items); }); }, [peerId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/daily/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: peerId, clientRequestId: crypto.randomUUID(), kind: isCoach && form.get("checkIn") ? "check_in" : "message", body: form.get("body") }) });
    if (response.ok) { setMessages([...messages, (await response.json()).data]); event.currentTarget.reset(); }
  }

  if (!peers.length) return <div className="space-y-3 rounded-xl border p-5"><p className="text-muted-foreground">{t("noConversation")}</p><Link className="text-sm font-medium underline" href={`/${locale}/${isCoach ? "clients" : "coach"}`}>{t(isCoach ? "viewClients" : "findCoach")}</Link></div>;
  return <div className="grid gap-5 md:grid-cols-[220px_1fr]"><aside className="space-y-2">{peers.map((peer) => <Button className="w-full justify-start" variant={peer.id === peerId ? "secondary" : "ghost"} key={peer.id} onClick={() => setPeerId(peer.id)}>{peer.firstName} {peer.lastName}</Button>)}</aside><section className="space-y-4"><div className="min-h-72 space-y-3 rounded-xl border p-4">{messages.map((message) => <article className={`max-w-[85%] rounded-lg p-3 ${message.senderId === userId ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`} key={message.id}>{message.kind === "check_in" && <p className="mb-1 text-xs font-semibold uppercase">{t("checkIn")}</p>}<p>{message.body}</p></article>)}</div><form className="flex flex-wrap gap-2" onSubmit={(event) => void send(event)}><Input className="min-w-64 flex-1" name="body" required maxLength={4000} placeholder={t("writeMessage")} />{isCoach && <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="checkIn" />{t("checkIn")}</label>}<Button>{t("send")}</Button></form></section></div>;
}
