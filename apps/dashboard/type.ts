export interface UserSession {
  user: { id: string; name?: string; email?: string; image?: string };
}

export interface AppRouter {
  push: (url: string) => void;
}

export interface GrantFormDataResource {
  title: string;
  url: string;
  description: string;
}
export interface GrantFormDataScreening {
  question: string;
  type: "text" | "url" | "file";
  optional: boolean;
}

export interface GrantFormData {
  // Step 1
  title: string;
  description: string;
  summary: string;
  instructions: string;
  logoUrl: string;
  bannerUrl: string;
  skills: string[];

  // Step 2
  minAmount: string;
  maxAmount: string;
  totalFunds: string;
  token: string;

  // Step 3
  applicationUrl: string;
  resources: GrantFormDataResource[];
  screening: GrantFormDataScreening[];

  // Step 4
  visibility: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  source: "NATIVE" | "EXTERNAL";
  status: "OPEN" | "PAUSED" | "CLOSED";
}

export interface GrantEditHookReturn {
  formData: GrantFormData;
  setFormData: React.Dispatch<React.SetStateAction<GrantFormData>>;
  loading: boolean;
  error: string | null;
  submitting: boolean;
  setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  handleSubmit: (opts: {
    setSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
    router: AppRouter;
    toast: typeof import("sonner").toast;
  }) => Promise<void>;
  addSkill: (skill: string[]) => void;
  removeSkill: (skill: string) => void;
  addResource: () => void;
  removeResource: (index: number) => void;
  updateResource: (
    i: number,
    field: keyof GrantFormData["resources"][0],
    v: string
  ) => void;
  addScreeningQuestion: () => void;
  removeScreeningQuestion: (index: number) => void;
  updateScreeningQuestion: (
    i: number,
    f: keyof GrantFormData["screening"][0],
    v: string
  ) => void;
}
