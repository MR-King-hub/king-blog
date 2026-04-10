import Navbar from "@/components/Navbar";
import AboutMe from "@/components/AboutMe";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <AboutMe />
      </main>
      <Footer />
    </div>
  );
}
