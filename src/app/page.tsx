import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Gallery from "@/components/Gallery";
import FunFacts from "@/components/FunFacts";
import Favourites from "@/components/Favourites";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <Gallery />
        <FunFacts />
        <Favourites />
      </main>
      <Footer />
    </>
  );
}
