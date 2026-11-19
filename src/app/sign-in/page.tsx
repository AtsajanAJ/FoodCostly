import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign in",
};

export const instant = false;

export default async function SignInPage() {
  const session = await getSession();

  if (session) {
    redirect(session.session.activeOrganizationId ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Access your FoodCostly organizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
