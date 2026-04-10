import Navbar from "@/components/Navbar";
import ProjectsShowcase from "@/components/ProjectsShowcase";
import Footer from "@/components/Footer";

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <ProjectsShowcase />
      </main>
      <Footer />
    </div>
  );
}
