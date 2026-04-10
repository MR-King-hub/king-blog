import Navbar from "@/components/Navbar";
import BlogList from "@/components/BlogList";
import Footer from "@/components/Footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <BlogList />
      </main>
      <Footer />
    </div>
  );
}
