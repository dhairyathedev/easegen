import { Button } from "@/components/ui/button";
import Link from "next/link";
import { IconSparkles } from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="max-w-screen-xl mx-auto m-2 p-4">
      <nav className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">EaseGen</h1>
        <div className="flex items-center space-x-8">
          <Link
            href="/documentation"
            className="font-medium hover:underline"
          >
            Documentation
          </Link>
          <Button className="font-semibold" variant="secondary" size="lg">
            Register
          </Button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="flex flex-col items-center justify-center space-y-4 mt-32">
        <div className="text-center">
          <h1 className="text-4xl max-w-2xl font-bold">
            Tired of Creating{" "}
            <span className="text-primary">Practical Files</span> for Your
            Technical Subjects?
          </h1>
          <h3 className="text-xl mt-4">
            Automate your practical file creation with our innovative software
            solution.
          </h3>
          <div className="flex items-center justify-center space-x-10 mt-8">
            <Button className="font-semibold" variant="secondary" size="lg">
              Demo Video
            </Button>
            <Link href="/upload">
              <Button className="gap-x-1 font-semibold px-5" size={"lg"}>
                Try now <IconSparkles stroke={2} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <div className="max-w-3xl bg-red-400 h-3 mx-auto mt-20">

      </div>
    </div>
  );
}
