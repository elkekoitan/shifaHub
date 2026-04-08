"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/use-api";

export default function DogrulaPage() {
  const [otp, setOtp] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const { mutate, loading: isLoading, error } = useApiMutation();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mutate("/api/email/verify", { token: otp });
    if (result) {
      setIsVerified(true);
    }
  }

  if (isVerified) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-green-600">Email Dogrulandi</CardTitle>
          <CardDescription>
            E-posta adresiniz basariyla dogrulandi. Artik ShifaHub&apos;i kullanmaya baslayabilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <a href="/danisan">Panele Git</a>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">Email Dogrulama</CardTitle>
        <CardDescription>
          E-posta adresinize gonderilen 6 haneli kodu girin
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Dogrulama Kodu</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-widest"
              required
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}
          <Button type="button" variant="ghost" className="w-full text-sm" disabled={isLoading}>
            Kodu tekrar gonder
          </Button>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
            {isLoading ? "Dogrulaniyor..." : "Dogrula"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
