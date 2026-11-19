import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignUpForm } from "@/features/auth/sign-up-form";
import { getSession } from "@/server/auth/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Create account",
};

export const instant = false;

export default async function SignUpPage() {
  const session = await getSession();

  if (session) {
    redirect(session.session.activeOrganizationId ? "/dashboard" : "/onboarding");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>
            Start managing restaurant costs for your business.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
}
