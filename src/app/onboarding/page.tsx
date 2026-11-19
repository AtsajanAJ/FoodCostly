import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrganizationForm } from "@/features/organizations/create-organization-form";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/get-locale";
import { requireSession } from "@/server/auth/session";

export const instant = false;

export default async function OnboardingPage() {
  await requireSession();
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle>{dict.onboarding.title}</CardTitle>
          <CardDescription>{dict.onboarding.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
