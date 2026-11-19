import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function SignInPage() {
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
          <CardTitle>{dict.auth.signInTitle}</CardTitle>
          <CardDescription>{dict.auth.signInDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
