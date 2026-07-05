"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import MarkdownEditor from "@/components/MarkdownEditor";
import Footer from "@/components/Footer";

export default function EditArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <main>
        <MarkdownEditor slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
