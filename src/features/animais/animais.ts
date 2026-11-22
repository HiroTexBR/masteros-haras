import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/db/client";
import { useCurrentOrg } from "@/hooks/use-orgs";

export type AnimalEspecie =
  | "equino" | "bovino" | "muar" | "asinino"
  | "caprino" | "ovino" | "suino" | "outro";

export type AnimalSexo = "macho" | "femea";
export type AnimalStatus = "ativo" | "vendido" | "morto" | "emprestado" | "inativo";

export const ESPECIE_LABEL: Record<AnimalEspecie, string> = {
  equino: "Equino (cavalo/égua)",
  bovino: "Bovino (gado)",
  muar: "Muar (mula/burro)",
  asinino: "Asinino (jumento)",
  caprino: "Caprino (cabra)",
  ovino: "Ovino (ovelha)",
  suino: "Suíno (porco)",
  outro: "Outro",
};

export const STATUS_LABEL: Record<AnimalStatus, string> = {
  ativo: "Ativo",
  vendido: "Vendido",
  morto: "Morto",
  emprestado: "Emprestado",
  inativo: "Inativo",
};

// categorias sugeridas por espécie (não obrigatórias — é text)
export const CATEGORIAS_POR_ESPECIE: Record<AnimalEspecie, string[]> = {
  equino: ["garanhao", "egua", "potro", "potra", "castrado", "cavalo"],
  bovino: ["touro", "vaca", "novilha", "novilho", "bezerro", "bezerra", "boi", "garrote"],
  muar: ["mula", "burro"],
  asinino: ["jumento", "jumenta"],
  caprino: ["bode", "cabra", "cabrito"],
  ovino: ["carneiro", "ovelha", "cordeiro"],
  suino: ["cachaço", "porca", "leitao"],
  outro: [],
};

export const CATEGORIA_LABEL: Record<string, string> = {
  garanhao: "Garanhão", egua: "Égua", potro: "Potro", potra: "Potra",
  castrado: "Castrado", cavalo: "Cavalo",
  touro: "Touro", vaca: "Vaca", novilha: "Novilha", novilho: "Novilho",
  bezerro: "Bezerro", bezerra: "Bezerra", boi: "Boi", garrote: "Garrote",
  mula: "Mula", burro: "Burro",
  jumento: "Jumento", jumenta: "Jumenta",
  bode: "Bode", cabra: "Cabra", cabrito: "Cabrito",
  carneiro: "Carneiro", ovelha: "Ovelha", cordeiro: "Cordeiro",
  cachaço: "Cachaço", porca: "Porca", leitao: "Leitão",
};

export type Animal = {
  id: string;
  org_id: string;
  especie: AnimalEspecie;
  categoria: string | null;
  sexo: AnimalSexo | null;
  nome: string;
  apelido: string | null;
  raca: string | null;
  pelagem: string | null;
  data_nascimento: string | null;
  peso_kg: number | null;
  registro: string | null;
  chip_id: string | null;
  marca: string | null;
  proprietario: string | null;
  pai_id: string | null;
  mae_id: string | null;
  foto_url: string | null;
  status: AnimalStatus;
  observacoes: string | null;
  custom: Record<string, unknown>;
  proprietario_id: string | null;
  valor_diaria: number | null;
  created_at: string;
  updated_at: string;
};

export type AnimalInput = Partial<Omit<Animal, "id" | "org_id" | "created_at" | "updated_at">> & {
  nome: string;
  especie: AnimalEspecie;
};

export type AnimalDocTipo =
  | "registro" | "exame" | "vacina" | "vermifugo" | "gta"
  | "nota_fiscal" | "contrato" | "foto" | "outro";

export const DOC_TIPO_LABEL: Record<AnimalDocTipo, string> = {
  registro: "Registro", exame: "Exame", vacina: "Vacina",
  vermifugo: "Vermífugo", gta: "GTA", nota_fiscal: "Nota Fiscal",
  contrato: "Contrato", foto: "Foto", outro: "Outro",
};

export type AnimalDoc = {
  id: string;
  org_id: string;
  animal_id: string;
  tipo: AnimalDocTipo;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_path: string | null;
  arquivo_mime: string | null;
  arquivo_tamanho: number | null;
  data_documento: string | null;
  validade: string | null;
  created_at: string;
  updated_at: string;
};

export type AnimalDocInput = Partial<Omit<AnimalDoc, "id" | "org_id" | "animal_id" | "created_at" | "updated_at">> & {
  titulo: string;
  tipo: AnimalDocTipo;
};

// -------------------- Queries --------------------

export function useAnimais(params?: { search?: string; especie?: AnimalEspecie | "todas"; status?: AnimalStatus | "todos" }) {
  const { currentId } = useCurrentOrg();
  const search = params?.search?.trim() ?? "";
  const especie = params?.especie ?? "todas";
  const status = params?.status ?? "todos";

  return useQuery({
    queryKey: ["animais", currentId, search, especie, status],
    enabled: !!currentId,
    queryFn: async (): Promise<Animal[]> => {
      let q = supabase
        .from("animais")
        .select("*")
        .eq("org_id", currentId!)
        .order("nome", { ascending: true });
      if (especie !== "todas") q = q.eq("especie", especie);
      if (status !== "todos") q = q.eq("status", status);
      if (search) q = q.ilike("nome", `%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Animal[];
    },
  });
}

export function useAnimal(id: string | undefined) {
  return useQuery({
    queryKey: ["animal", id],
    enabled: !!id,
    queryFn: async (): Promise<Animal | null> => {
      const { data, error } = await supabase.from("animais").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return (data as Animal) ?? null;
    },
  });
}

export function useCreateAnimal() {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: AnimalInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("animais")
        .insert({ ...input, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as Animal;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animais"] }),
  });
}

export function useUpdateAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: Partial<AnimalInput> }) => {
      const { data, error } = await supabase
        .from("animais")
        .update(input)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as Animal;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["animais"] });
      qc.invalidateQueries({ queryKey: ["animal", v.id] });
    },
  });
}

export function useDeleteAnimal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("animais")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animais"] }),
  });
}

// -------------------- Documentos --------------------

export function useAnimalDocs(animalId: string | undefined) {
  return useQuery({
    queryKey: ["animal-docs", animalId],
    enabled: !!animalId,
    queryFn: async (): Promise<AnimalDoc[]> => {
      const { data, error } = await supabase
        .from("animais_documentos")
        .select("*")
        .eq("animal_id", animalId!)
        .order("data_documento", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AnimalDoc[];
    },
  });
}

export function useCreateAnimalDoc(animalId: string) {
  const qc = useQueryClient();
  const { currentId } = useCurrentOrg();
  return useMutation({
    mutationFn: async (input: AnimalDocInput) => {
      if (!currentId) throw new Error("sem organização");
      const { data, error } = await supabase
        .from("animais_documentos")
        .insert({ ...input, animal_id: animalId, org_id: currentId })
        .select("*")
        .single();
      if (error) throw error;
      return data as AnimalDoc;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animal-docs", animalId] }),
  });
}

export function useDeleteAnimalDoc(animalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("animais_documentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["animal-docs", animalId] }),
  });
}
