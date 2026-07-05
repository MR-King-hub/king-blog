import Navbar from "@/components/Navbar";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";
import { fetchSiteProfile } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const profile = await fetchSiteProfile();

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <AboutMe profile={profile} />
      </main>
      <Footer />
    </div>
  );
}
