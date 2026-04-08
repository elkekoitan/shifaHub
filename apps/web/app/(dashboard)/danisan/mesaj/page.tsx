"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DanisanMesajPage() {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mesajlar</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Konusmalar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Henuz mesajiniz yok
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Mesaj</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[300px] border rounded-lg p-4 bg-muted/30">
              <p className="text-sm text-muted-foreground text-center pt-32">
                Bir konusma secin veya yeni mesaj gonderin
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajinizi yazin..."
                className="flex-1"
              />
              <Button disabled={!message.trim()}>Gonder</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
