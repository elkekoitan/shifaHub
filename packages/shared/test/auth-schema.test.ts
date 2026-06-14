import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, refreshSchema } from "../src/schemas/auth";

const validRegister = {
  email: "demo@shifahub.app",
  password: "guclusifre1",
  firstName: "Ayse",
  lastName: "Yilmaz",
  role: "danisan" as const,
};

describe("registerSchema", () => {
  it("gecerli girdiyi kabul eder", () => {
    expect(registerSchema.safeParse(validRegister).success).toBe(true);
  });

  it("opsiyonel telefon kabul edilir (gecerli formatta)", () => {
    expect(registerSchema.safeParse({ ...validRegister, phone: "+90 555 123 45 67" }).success).toBe(
      true,
    );
  });

  it("gecersiz e-posta reddedilir", () => {
    expect(registerSchema.safeParse({ ...validRegister, email: "gecersiz" }).success).toBe(false);
  });

  it("kisa sifre (<8) reddedilir", () => {
    expect(registerSchema.safeParse({ ...validRegister, password: "kisa" }).success).toBe(false);
  });

  it("bos ad/soyad reddedilir", () => {
    expect(registerSchema.safeParse({ ...validRegister, firstName: "" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...validRegister, lastName: "" }).success).toBe(false);
  });

  it("gecersiz telefon formati reddedilir", () => {
    expect(registerSchema.safeParse({ ...validRegister, phone: "abc" }).success).toBe(false);
  });

  it("izinsiz rol (admin) reddedilir", () => {
    expect(registerSchema.safeParse({ ...validRegister, role: "admin" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("gecerli girdiyi kabul eder", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
  });
  it("bos sifre reddedilir", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("refreshSchema", () => {
  it("bos token reddedilir", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
  });
  it("dolu token kabul edilir", () => {
    expect(refreshSchema.safeParse({ refreshToken: "abc.def.ghi" }).success).toBe(true);
  });
});
