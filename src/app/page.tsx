import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WeeklyPicks from "@/components/WeeklyPicks";
import ScoreMethod from "@/components/ScoreMethod";
import SourcesWall from "@/components/SourcesWall";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <Hero />
        <WeeklyPicks />
        <ScoreMethod />
        <SourcesWall />
      </main>
      <Footer />
    </div>
  );
}
