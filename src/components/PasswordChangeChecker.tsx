import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function PasswordChangeChecker() {
  const { user } = useAuth();
  const [mustChangePassword, setMustChangePassword] = useState(false);

  useEffect(() => {
    const checkPasswordChange = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("must_change_password")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erro ao verificar troca de senha:", error);
        return;
      }

      setMustChangePassword(data?.must_change_password || false);
    };

    checkPasswordChange();
  }, [user]);

  if (!user || !mustChangePassword) return null;

  return (
    <ChangePasswordDialog
      open={mustChangePassword}
      onOpenChange={() => {}} // Não permite fechar
      userId={user.id}
    />
  );
}