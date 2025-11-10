"use client";

import { Button } from "@packages/base/components/ui/button";
import { Checkbox } from "@packages/base/components/ui/checkbox";
import { Input } from "@packages/base/components/ui/input";
import { Label } from "@packages/base/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@packages/base/components/ui/select";
import { Textarea } from "@packages/base/components/ui/textarea";
import type { Dictionary } from "@packages/i18n";
import { Check, Headphones, MoveRight, Users, Zap } from "lucide-react";
import { useState } from "react";

type ContactFormProps = {
  dictionary: Dictionary;
};

type FormData = {
  organizationName: string;
  contactName: string;
  email: string;
  organizationType: string;
  inquiryType: string;
  message: string;
  acceptsMarketing: boolean;
};

type FormErrors = {
  [key in keyof FormData]?: string;
};

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export const ContactForm = ({ dictionary }: ContactFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    organizationName: "",
    contactName: "",
    email: "",
    organizationType: "",
    inquiryType: "",
    message: "",
    acceptsMarketing: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>("idle");

  // Icons for each benefit card
  const benefitIcons = [Users, Zap, Headphones];

  const organizationTypes = [
    { value: "dao", label: "DAO" },
    { value: "protocol", label: "Protocol" },
    { value: "parachain", label: "Parachain" },
    { value: "foundation", label: "Foundation" },
    { value: "ecosystem", label: "Ecosystem Project" },
    { value: "other", label: "Other" },
  ];

  const inquiryTypes = [
    { value: "list-opportunity", label: "List an Opportunity" },
    { value: "partnership", label: "Partnership Inquiry" },
    { value: "feature-request", label: "Feature Request" },
    { value: "other", label: "Other" },
  ];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = "Your name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.organizationType) {
      newErrors.organizationType = "Please select an organization type";
    }

    if (!formData.inquiryType) {
      newErrors.inquiryType = "Please select what you need help with";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please tell us about your project";
    } else if (formData.message.trim().length < 50) {
      newErrors.message = "Please provide at least 50 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setFormData({
        organizationName: "",
        contactName: "",
        email: "",
        organizationType: "",
        inquiryType: "",
        message: "",
        acceptsMarketing: false,
      });
    } catch (error) {
      console.error("Contact form error:", error);
      setStatus("error");
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (status === "success") {
    return (
      <div className="w-full py-20 lg:py-40">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-3xl tracking-tight">
                {dictionary.web.contact.hero.form.success}
              </h2>
              <p className="text-muted-foreground">
                {dictionary.web.contact.hero.form.responseTime}
              </p>
            </div>
            <Button onClick={() => setStatus("idle")} variant="outline">
              Send Another Message
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Hero Section */}
        <div className="mb-12 text-center lg:mb-16">
          <h1 className="mb-4 font-bold text-3xl tracking-tight md:text-5xl lg:text-6xl">
            {dictionary.web.contact.meta.title}
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            {dictionary.web.contact.meta.description}
          </p>
        </div>

        {/* Two Column Layout: Cards Left, Form Right */}
        <div className="mb-16 grid gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Left Column: Benefits Cards */}
          <div className="flex h-full flex-col justify-between gap-4 lg:gap-6">
            {dictionary.web.contact.hero.benefits.map((benefit, index) => {
              const Icon = benefitIcons[index];
              return (
                <div
                  className="flex flex-1 flex-col rounded-lg border bg-white/5 p-4 sm:p-6"
                  key={index}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-base lg:text-lg">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Contact Form */}
          <div className="flex h-full flex-col">
            <form
              className="flex h-full w-full flex-col gap-4 rounded-lg border bg-white/5 p-4 sm:p-6 lg:p-8"
              onSubmit={handleSubmit}
            >
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="organizationName">
                  {dictionary.web.contact.hero.form.organizationName}
                </Label>
                <Input
                  className={
                    errors.organizationName ? "border-destructive" : ""
                  }
                  id="organizationName"
                  onChange={(e) =>
                    handleInputChange("organizationName", e.target.value)
                  }
                  type="text"
                  value={formData.organizationName}
                />
                {errors.organizationName && (
                  <p className="text-destructive text-sm">
                    {errors.organizationName}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="contactName">
                  {dictionary.web.contact.hero.form.contactName}
                </Label>
                <Input
                  className={errors.contactName ? "border-destructive" : ""}
                  id="contactName"
                  onChange={(e) =>
                    handleInputChange("contactName", e.target.value)
                  }
                  type="text"
                  value={formData.contactName}
                />
                {errors.contactName && (
                  <p className="text-destructive text-sm">
                    {errors.contactName}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="email">
                  {dictionary.web.contact.hero.form.email}
                </Label>
                <Input
                  className={errors.email ? "border-destructive" : ""}
                  id="email"
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  type="email"
                  value={formData.email}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">{errors.email}</p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="organizationType">
                  {dictionary.web.contact.hero.form.organizationType}
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("organizationType", value)
                  }
                  value={formData.organizationType}
                >
                  <SelectTrigger
                    className={
                      errors.organizationType ? "border-destructive" : ""
                    }
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.organizationType && (
                  <p className="text-destructive text-sm">
                    {errors.organizationType}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="inquiryType">
                  {dictionary.web.contact.hero.form.inquiryType}
                </Label>
                <Select
                  onValueChange={(value) =>
                    handleInputChange("inquiryType", value)
                  }
                  value={formData.inquiryType}
                >
                  <SelectTrigger
                    className={errors.inquiryType ? "border-destructive" : ""}
                  >
                    <SelectValue placeholder="Select inquiry type" />
                  </SelectTrigger>
                  <SelectContent>
                    {inquiryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.inquiryType && (
                  <p className="text-destructive text-sm">
                    {errors.inquiryType}
                  </p>
                )}
              </div>

              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="message">
                  {dictionary.web.contact.hero.form.message}
                </Label>
                <Textarea
                  className={errors.message ? "border-destructive" : ""}
                  id="message"
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Tell us about your project, timeline, and how we can help..."
                  rows={4}
                  value={formData.message}
                />
                <p className="text-muted-foreground text-xs">
                  {formData.message.length}/50 minimum
                </p>
                {errors.message && (
                  <p className="text-destructive text-sm">{errors.message}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.acceptsMarketing}
                  id="acceptsMarketing"
                  onCheckedChange={(checked) =>
                    handleInputChange("acceptsMarketing", checked === true)
                  }
                />
                <label
                  className="cursor-pointer text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  htmlFor="acceptsMarketing"
                >
                  {dictionary.web.contact.hero.form.acceptsMarketing}
                </label>
              </div>

              <p className="text-muted-foreground text-xs">
                By submitting this form, you agree to our{" "}
                <a className="underline" href="/legal/privacy-policy">
                  Privacy Policy
                </a>
                .
              </p>

              {status === "error" && (
                <p className="text-destructive text-sm">
                  {dictionary.web.contact.hero.form.error}
                </p>
              )}

              <Button
                className="w-full gap-4"
                disabled={status === "submitting"}
                type="submit"
              >
                {status === "submitting"
                  ? dictionary.web.contact.hero.form.submitting
                  : dictionary.web.contact.hero.form.cta}{" "}
                <MoveRight className="h-4 w-4" />
              </Button>

              <p className="text-center text-muted-foreground text-xs">
                {dictionary.web.contact.hero.form.responseTime}
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
