import Navbar from "@/components/Navbar";
import ArticleDetail from "@/components/ArticleDetail";
import Footer from "@/components/Footer";

// 静态导出需要 generateStaticParams
export function generateStaticParams() {
  return [
    { slug: "react-server-components" },
  ];
}

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <Navbar />
      <ArticleDetail />
      <Footer />
    </div>
  );
}
