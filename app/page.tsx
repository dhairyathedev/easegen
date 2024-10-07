import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  IconAi,
  IconCloudUpload,
  IconFileExport,
  IconRobot,
  IconSparkles,
  IconTransformPoint,
} from "@tabler/icons-react";

export default function Home() {
  return (
    <div className="max-w-screen-xl mx-auto m-2 p-4">
      <nav className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">EaseGen</h1>
        <div className="flex items-center space-x-8">
          <Link href="/documentation" className="font-medium hover:underline">
            Documentation
          </Link>
          <Link href="/login">
          <Button className="font-semibold" variant="secondary" size="lg">
            Register
          </Button>
          </Link>
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
      <div className="max-w-5xl md:h-[600px] h-full mx-auto mt-20 p-4">
        <div className="grid md:grid-cols-12 md:grid-rows-4 gap-4 items-center w-full bg-primary/10 h-full p-4 rounded-xl">
          <div className="col-span-4 row-span-4 bg-primary rounded-xl h-80 md:h-full w-full p-5 px-6 text-white relative">
            <h3 className="text-5xl mt-2 font-semibold max-w-3xl leading-tight">
              How it works?
            </h3>
            <div className="absolute bottom-8 right-3">
              <IconRobot size={80} stroke={1} />
            </div>
          </div>
          <div className="col-span-4 row-span-2 bg-primary rounded-xl h-72 md:h-full w-full p-5 px-6 text-white relative">
            <h3 className="text-5xl mt-2 font-semibold max-w-3xl leading-tight">
              1.
            </h3>
            <div className="inset-0 flex justify-center items-center">
              <IconCloudUpload size={80} stroke={1} />
            </div>
            <h4 className="text-center font-semibold text-lg mt-4">
              Upload your format
            </h4>
          </div>
          <div className="col-span-4 row-span-3 bg-primary rounded-xl h-80 md:h-full w-full p-5 px-6 text-white relative">
            <h3 className="text-5xl mt-2 font-semibold max-w-3xl leading-tight">
              2.
            </h3>
            <div className="inset-0 flex justify-center items-center mt-8 md:mt-20">
              <IconTransformPoint size={80} stroke={1} />
            </div>
            <h4 className="text-center font-semibold text-lg mt-4">
              Map Fields with respective functionality
            </h4>
          </div>
          <div className="col-span-4 row-span-2 bg-primary rounded-xl h-72 md:h-full w-full p-5 px-6 text-white relative">
            <h3 className="text-5xl mt-2 font-semibold max-w-3xl leading-tight">
              3.
            </h3>
            <div className="inset-0 flex justify-center items-center">
              <IconAi size={100} stroke={1} />
            </div>
            <h4 className="text-center font-semibold mt-4">
              AI Code Generation and Execution
            </h4>
          </div>
          <div className="col-span-4 row-span-1 bg-primary rounded-xl h-72 md:h-full w-full p-5 px-6 text-white md:flex block md:space-x-14">
            <h3 className="text-5xl mt-2 font-semibold max-w-3xl leading-tight">
              4.
            </h3>
            <div className="inset-0 flex justify-center items-center md:mt-0 mt-8">
              <IconFileExport size={70} stroke={1.4} />
            </div>
            <h4 className="text-center font-semibold mt-4 md:hidden block">
              Export and Download
            </h4>
          </div>
          {/* <div className="col-span- row-span-3 bg-primary/30 rounded-3xl text-center h-48 w-20">Artist Name</div> */}
          {/* <div className="col-span- row-span- bg-primary/30 rounded-3xl text-center h-48 w-20">User Name</div> */}
          {/* <div className="col-span- row-span- bg-primary/30 rounded-3xl text-center h-48 w-20">Artist Interest</div> */}
          {/* <div className="col-span- row-span- bg-primary/30 rounded-3xl text-center h-48 w-20">User Interset</div> */}
          {/* <div className="col-span- row-span- bg-primary/30 rounded-3xl text-center h-48 w-20">Final Box</div> */}
        </div>
      </div>
    </div>
  );
}
