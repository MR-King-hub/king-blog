"use client";

import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ArticleDetail from "@/components/ArticleDetail";
import Footer from "@/components/Footer";

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <ArticleDetail slug={slug} />
      <Footer />
    </div>
  );
}
