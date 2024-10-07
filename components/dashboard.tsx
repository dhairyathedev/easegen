"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<{
    email: string;
    created_at: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email!,
          created_at: new Date(user.created_at).toLocaleString(),
        });
      } else {
        router.push("/auth/login");
      }
    }
    getUser();
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>Welcome to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Email:</strong> {user.email}
        </p>
        <p>
          <strong>Account Created:</strong> {user.created_at}
        </p>
      </CardContent>
      <CardFooter>
        <Link href="/upload">
          <Button>Go to application</Button>
        </Link>
        <Button onClick={handleSignOut} variant="secondary" className="mx-4">
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
