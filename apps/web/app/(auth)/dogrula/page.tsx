"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function DogrulaPage() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Email verification API call
    setTimeout(() => {
      setIsLoading(false);
      setIsVerified(true);
    }, 1000);
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
