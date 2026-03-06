import { useEffect } from "react";
import { useRouter } from "next/router";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function getServerSideProps({ req, res }: any) {
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (session.isLoggedIn) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
}

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/login");
  }, [router]);

  return null;
}