import Navbar from "@/components/Navbar";
import MarkdownEditor from "@/components/MarkdownEditor";
import Footer from "@/components/Footer";

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <MarkdownEditor />
      </main>
      <Footer />
    </div>
  );
}
