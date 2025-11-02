import { VercelToolbar } from "@vercel/toolbar/next";
import { keys } from "../keys";

const isRunningOnVercel = Boolean(process.env.VERCEL);

export const Toolbar = () =>
  !isRunningOnVercel && keys().FLAGS_SECRET ? <VercelToolbar /> : null;
