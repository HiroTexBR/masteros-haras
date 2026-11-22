import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useModules } from "@/hooks/use-modules";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

interface ModuleGateProps {
  code: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children only if the module `code` is enabled for the current org.
 * Wraps any protected page or feature. Use fallback for inline surfaces.
 */
export function ModuleGate({ code, children, fallback }: ModuleGateProps) {
  const { isEnabled } = useModules();
  if (isEnabled(code)) return <>{children}</>;
  if (fallback !== undefined) return <>{fallback}</>;
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Módulo não habilitado</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Este módulo não está ativo na sua organização. Ative em Configurações → Módulos.
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/configuracoes/modulos">Gerenciar módulos</Link>
        </Button>
      </div>
    </div>
  );
}
