import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText, Upload, FileUp, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Documentation() {
  return (
    <div className="container mx-auto p-4 space-y-6">
        <nav className="flex justify-between items-center">
        <Link href="/">
        <h1 className="text-2xl font-semibold">EaseGen</h1>
        </Link>
        <div className="flex items-center space-x-8">
          <Link href="/documentation" className="font-medium hover:underline">
            Documentation
          </Link>
          <Link href="/auth/login">
          <Button className="font-semibold" variant="secondary" size="lg">
            Register
          </Button>
          </Link>
        </div>
      </nav>
      <h1 className="sm:text-4xl text-3xl font-bold mb-6">General Documentation</h1>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          Due to the early version of this system, please open generated files only in Google Docs for the best compatibility and formatting.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2" />
            Creating the Format
          </CardTitle>
          <CardDescription>How to create a template for your practical file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>Demo Template: 

            <Link href="https://docs.google.com/document/d/1FR8_MpVUK5XsE77CdH5RZjv4FlodkmOOvh7eL7qRtqc/edit?usp=sharing" className="font-medium underline ml-1 text-primary">
              Google Docs Link
            </Link>
            </li>
            <li>Open a new document in Google Docs.</li>
            <li>Create your desired layout for a single practical entry.</li>
            <li>Use double curly braces to denote placeholders, e.g., {"{{title}}"}, {"{{aim}}"}, {"{{code}}"}, {"{{output}}"}, {"{{conclusion}}"}</li>
            <li>Ensure each placeholder has a unique name that describes its content.</li>
            <li>Format the document as desired, including headers, footers, and page numbers if needed.</li>
            <li>Save the document as a DOCX file.</li>
          </ol>
          <Alert>
            <AlertTitle>Tip</AlertTitle>
            <AlertDescription>
              Keep your template simple and consistent. This will make it easier for the system to generate accurate practical files.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="mr-2" />
            Uploading Your Template
          </CardTitle>
          <CardDescription>Steps to upload your created template to the Practical File Builder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            <li>Log in to your Easegen account.</li>
            <li>Navigate to the &quot;Templates&quot; section in the dashboard.</li>
            <li>Click on the &quot;Upload New Template&quot; button.</li>
            <li>Select your DOCX file and click &quot;Open&quot;.</li>
            <li>Give your template a name and description.</li>
            <li>Map the placeholders in your template to the corresponding fields in the system.</li>
            <li>Click &quot;Save&quot; to finalize the upload.</li>
          </ol>
          <Alert>
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              Ensure that all placeholders in your template are correctly mapped to avoid errors during file generation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileUp className="mr-2" />
            Generating Practical Files
          </CardTitle>
          <CardDescription>How to use your template to generate practical files</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="list-decimal list-inside space-y-2">
            {/* <li>Go to the &quot;Create New Project&quot; section in your dashboard.</li> */}
            {/* <li>Select the template you want to use.</li> */}
            <li>Enter the number of practicals you want to generate.</li>
            <li>Fill in the required information for each practical (title, aim, code, etc.).</li>
            <li>For code sections, you can use the built-in code generator or paste your code.</li>
            <li>If your template includes an output section, you can either:
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Enter the output manually</li>
                <li>Use the &quot;Execute Code&quot; feature to generate output (for supported languages)</li>
                <li>Enable the &quot;Use Terminal-style Output Images&quot; option for visual output</li>
              </ul>
            </li>
            <li>Review your entries and click &quot;Generate Document&quot; when ready.</li>
            <li>Wait for the system to process your request and generate the DOCX file.</li>
            <li>Download the generated file from the &quot;Downloads&quot; section.</li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2" />
            Important Guidelines
          </CardTitle>
          <CardDescription>Essential tips for using the Practical File Builder</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="list-disc list-inside space-y-2">
            <li>Always open generated files in Google Docs for the best compatibility and formatting.</li>
            <li>Regularly save your progress when entering data for multiple practicals.</li>
            <li>If you encounter any issues with formatting or placeholder replacement, double-check your template and placeholder mappings.</li>
            <li>For code execution, ensure you&apos;ve selected the correct programming language.</li>
            <li>If code execution fails, click on <span className="font-medium">Generate Code</span> button again and then execute again.</li>
            {/* <li>When using terminal-style output images, make sure your template has enough space to accommodate the images.</li> */}
            <li>If you need to make changes after generating a file, it&apos;s often easier to edit the project in the Easegen and regenerate the document rather than editing the DOCX file directly.</li>
          </ul>
        </CardContent>
      </Card>

      <Alert>
        <AlertTitle>Need Help?</AlertTitle>
        <AlertDescription>
          If you encounter any issues or have questions, please don&apos;t hesitate to contact our support team at hello[at]dhairyashah.dev.
        </AlertDescription>
      </Alert>
    </div>
  )
}