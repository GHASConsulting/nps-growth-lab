import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pencil, KeyRound } from "lucide-react";

interface Usuario {
  id: string;
  full_name: string;
  email: string;
  role: 'admin' | 'user';
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSuccess: () => void;
}

export function EditUserDialog({ open, onOpenChange, usuario, onSuccess }: EditUserDialogProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (usuario) {
      setFullName(usuario.full_name);
      setEmail(usuario.email);
      setRole(usuario.role);
      setNewPassword("");
    }
  }, [usuario]);

  const handleUpdate = async () => {
    if (!usuario) return;

    if (!fullName.trim() || !email.trim()) {
      toast({
        title: "Erro",
        description: "Nome e email são obrigatórios!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Atualizar informações básicas
      const { data, error } = await supabase.functions.invoke('update-user', {
        body: {
          user_id: usuario.id,
          full_name: fullName,
          email: email,
          role: role
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Usuário atualizado com sucesso!",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!usuario) return;

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres!",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          user_id: usuario.id,
          new_password: newPassword
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Sucesso",
        description: "Senha resetada! O usuário deverá trocá-la no próximo login.",
      });

      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-5 h-5" />
            Editar Usuário
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do usuário ou redefina a senha.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Informações Básicas</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <Input
                placeholder="Nome do usuário"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <Input
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Permissão</label>
              <Select value={role} onValueChange={(value: 'admin' | 'user') => setRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={loading} className="w-full">
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Resetar Senha
            </h3>
            <p className="text-xs text-muted-foreground">
              O usuário será obrigado a trocar a senha no próximo login.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">Nova Senha Temporária</label>
              <Input
                type="password"
                placeholder="Digite a senha temporária"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button
              onClick={handleResetPassword}
              disabled={loading || !newPassword}
              variant="secondary"
              className="w-full"
            >
              {loading ? "Resetando..." : "Resetar Senha"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}