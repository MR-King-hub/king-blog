import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import { fetchSiteProfile } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const profile = await fetchSiteProfile();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <Hero profile={profile} />
      </main>
      <Footer />
    </div>
  );
}
