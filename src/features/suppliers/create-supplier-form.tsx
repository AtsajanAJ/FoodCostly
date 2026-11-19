"use client";

import { useState } from "react";
import { createSupplierAction } from "@/features/suppliers/actions";
import { useDictionary } from "@/features/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateSupplierForm() {
  const dict = useDictionary();
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await createSupplierAction({
      name,
      contactName: contactName || null,
      email: email || null,
      phone: phone || null,
      notes: notes || null,
    });

    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setNotes("");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-sm font-medium">{dict.suppliers.add}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="supplier-name">{dict.common.name}</Label>
          <Input
            id="supplier-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="contact-name">{dict.suppliers.contactName}</Label>
          <Input
            id="contact-name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email">{dict.common.email}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phone">{dict.suppliers.phone}</Label>
          <Input
            id="phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">{dict.common.notes}</Label>
        <Input
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? dict.common.saving : dict.suppliers.createSupplier}
      </Button>
    </form>
  );
}