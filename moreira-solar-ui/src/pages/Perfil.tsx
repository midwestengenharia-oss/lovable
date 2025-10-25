import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Cropper from "react-easy-crop";
import { toast } from "sonner";

export default function Perfil() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  // Cropper state
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Usuário não autenticado");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      toast.error("Erro ao carregar perfil");
      console.error(error);
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nome: profile.nome,
        email: profile.email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (error) {
      toast.error("Erro ao salvar alterações");
      console.error(error);
    } else {
      toast.success("Perfil atualizado com sucesso!");
      fetchProfile();
    }
  }

  // 📤 Quando o usuário escolhe a imagem
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // 📏 Guarda a área de recorte
  const onCropComplete = useCallback((_, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // ✂️ Converte a imagem recortada em blob
  const getCroppedImg = useCallback(async () => {
    if (!imageSrc || !croppedAreaPixels) return null;

    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const { width, height, x, y } = croppedAreaPixels;

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
      }, "image/jpeg");
    });
  }, [imageSrc, croppedAreaPixels]);

  // 📦 Upload da imagem recortada para o Supabase
  const handleUploadCropped = async () => {
    try {
      setUploading(true);
      const blob = await getCroppedImg();
      if (!blob) return;

      const fileExt = "jpg";
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar: data.publicUrl })
        .eq("id", profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar: data.publicUrl });
      toast.success("Foto de perfil atualizada!");
      setCropModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar imagem recortada");
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p>Nenhum perfil encontrado.</p>
      </div>
    );
  }

  const initials = profile.nome
    ? profile.nome
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">Meu Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar || undefined} alt={profile.nome} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Alterar foto"
              />
            </div>
            <Button variant="outline" disabled={uploading}>
              {uploading ? "Processando..." : "Alterar Foto"}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={profile.nome || ""}
              onChange={(e) => setProfile({ ...profile, nome: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input
              type="email"
              value={profile.email || ""}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Perfil</Label>
              <Badge variant="outline" className="mt-1">
                {profile.perfil?.toUpperCase() || "N/A"}
              </Badge>
            </div>
            <div>
              <Label>Status</Label>
              <Badge variant={profile.ativo ? "default" : "destructive"} className="mt-1">
                {profile.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
            <p>
              <strong>Data de Cadastro:</strong>{" "}
              {profile.data_cadastro
                ? new Date(profile.data_cadastro).toLocaleDateString("pt-BR")
                : "-"}
            </p>
            <p>
              <strong>Último Acesso:</strong>{" "}
              {profile.ultimo_acesso
                ? new Date(profile.ultimo_acesso).toLocaleString("pt-BR")
                : "Nunca"}
            </p>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </CardContent>
      </Card>

      {/* 🖼️ Modal de recorte */}
      <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recortar imagem</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[300px] bg-black">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCropModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUploadCropped} disabled={uploading}>
              {uploading ? "Enviando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 🔧 Util para converter imagem base64 em elemento HTMLImage */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // Para não dar erro de CORS
    image.src = url;
  });
}
