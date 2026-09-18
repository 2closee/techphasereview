import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import PracticeWorkspace from '@/components/practice/PracticeWorkspace';

export default function Practice() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <div className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            Coding Practice Lab
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Learn by doing. Read a short lesson, write real code, and get instant feedback across
            HTML, CSS, JavaScript, SQL and PHP.
          </p>
        </div>
        <PracticeWorkspace />
      </main>
      <Footer />
    </div>
  );
}
