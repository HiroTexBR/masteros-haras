import { useOrgs, useCurrentOrgId } from "@/hooks/use-orgs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function OrgSwitcher() {
  const orgs = useOrgs();
  const [currentId, setCurrentId] = useCurrentOrgId();

  const current = orgs.data?.find((o) => o.id === currentId) ?? orgs.data?.[0] ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <span className="truncate">{current?.name ?? "Sem organização"}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {(orgs.data ?? []).map((o) => (
          <DropdownMenuItem key={o.id} onSelect={() => setCurrentId(o.id)}>
            <span className="truncate">{o.name}</span>
            {o.id === current?.id && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/onboarding">
            <Plus className="mr-2 h-4 w-4" /> Nova organização
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
