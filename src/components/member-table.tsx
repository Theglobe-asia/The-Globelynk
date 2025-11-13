"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Member = { id: string; name: string; email: string; notes?: string; tier: "BASIC"|"SILVER"|"GOLD"; joinedAt: string };

export default function MemberTable() {
  const [rows, setRows] = useState<Member[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const res = await fetch("/api/members");
    setRows(await res.json());
  }
  useEffect(()=>{ load(); }, []);

  async function save(m: Member) {
    await fetch(`/api/members/${m.id}`, { method: "PUT", body: JSON.stringify(m) });
  }
  async function del(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    setRows(rows.filter(r=>r.id!==id));
  }

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(q.toLowerCase()) ||
    r.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-3">
      <Input placeholder="Search name or email" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Name</th>
              <th>Email</th>
              <th>Tier</th>
              <th>Notes</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m)=>(
              <tr key={m.id} className="border-b">
                <td contentEditable suppressContentEditableWarning
                    onBlur={e=>{ m.name=e.currentTarget.textContent||""; save(m);} }
                    className="py-2">{m.name}</td>
                <td contentEditable suppressContentEditableWarning
                    onBlur={e=>{ m.email=e.currentTarget.textContent||""; save(m);} }>{m.email}</td>
                <td>
                  <select defaultValue={m.tier} onChange={e=>{ m.tier=e.target.value as any; save(m);} }
                          className="border rounded px-2 py-1">
                    <option>BASIC</option><option>SILVER</option><option>GOLD</option>
                  </select>
                </td>
                <td contentEditable suppressContentEditableWarning
                    onBlur={e=>{ m.notes=e.currentTarget.textContent||""; save(m);} }>{m.notes}</td>
                <td>{new Date(m.joinedAt).toLocaleDateString()}</td>
                <td><Button variant="destructive" onClick={()=>del(m.id)}>Delete</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
