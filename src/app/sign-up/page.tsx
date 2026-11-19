import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function SignUpPage() {
  const session = await getSession();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  if (session) {
    redirect(session.session.activeOrganizationId ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle>{dict.auth.signUpTitle}</CardTitle>
          <CardDescription>{dict.auth.signUpDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
