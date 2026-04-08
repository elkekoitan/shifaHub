"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";

export default function MfaPage() {
  const [code, setCode] = useState("");
  const [userId, setUserId] = useState("");
  const { mutate, loading: isLoading, error } = useApiMutation();
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("mfa_user_id");
    if (stored) setUserId(stored);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate("/api/mfa/validate", { userId, code });
    if (result) {
      localStorage.removeItem("mfa_user_id");
      router.push("/danisan");
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Iki Faktorlu Dogrulama</CardTitle>
        <CardDescription>
          Authenticator uygulamanizdan 6 haneli kodu girin
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Dogrulama Kodu</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
            {isLoading ? "Dogrulaniyor..." : "Dogrula"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
