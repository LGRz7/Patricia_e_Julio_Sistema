"use client"

import { NovaAcmWizard } from "@/components/painel/acm/NovaAcmWizard"

/**
 * Wizard de criação de ACM.
 * Toda lógica vive em NovaAcmWizard — esta rota é só o mount point.
 */
export default function NovaAcmPage() {
  return <NovaAcmWizard />
}
