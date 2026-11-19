import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateOrganizationForm } from "@/features/organizations/create-organization-form";
import { requireSession } from "@/server/auth/session";

export const metadata = {
  title: "Create organization",
};

export const instant = false;

export default async function OnboardingPage() {
  await requireSession();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Create your organization</CardTitle>
          <CardDescription>
            In MVP, one organization is one restaurant location. You can create
            more later and switch between them.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  );
}
