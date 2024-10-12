/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

interface FieldType {
  name: string;
  isCode: boolean;
  isImage: boolean;
  isAim: boolean;
  isOutput: boolean;
  isConclusion?: boolean; // Added for conclusion
  defaultLanguage?: string;
}

export default function DataEntry({ params }: { params: { id: string } }) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [fieldTypes, setFieldTypes] = useState<Record<string, FieldType>>({});
  const [practicalCount, setPracticalCount] = useState(1);
  const [practicalData, setPracticalData] = useState<
    Record<string, string | File>[]
  >([{}]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [conclusion, setConclusion] = useState<string>("");

  useEffect(() => {
    fetch(`/api/mappings/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setMappings(data.mappings);
        const initialFieldTypes: Record<string, FieldType> = {};
        Object.values(data.mappings).forEach((field: any) => {
          initialFieldTypes[field] = {
            name: field,
            isCode: false,
            isImage: false,
            isAim: false,
            isOutput: false,
            isConclusion: false,
          };
        });
        setFieldTypes(initialFieldTypes);
      })
      .catch((err) => setError("Failed to load mappings"));
  }, [params.id]);

  const handlePracticalCountChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const count = parseInt(e.target.value);
    setPracticalCount(count);
    setPracticalData((prev) => {
      const newData = [...prev];
      while (newData.length < count) {
        newData.push({});
      }
      return newData.slice(0, count);
    });
  };

  const handleDataChange = (
    practicalIndex: number,
    field: string,
    value: string | File
  ) => {
    setPracticalData((prev) => {
      const newData = [...prev];
      newData[practicalIndex] = { ...newData[practicalIndex], [field]: value };
      return newData;
    });
  };

  const handleFieldTypeChange = (
    field: string,
    type: "isCode" | "isImage" | "isAim" | "isOutput" | "isConclusion"
  ) => {
    setFieldTypes((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: !prev[field][type],
        ...(type === "isCode"
          ? { isImage: false, isAim: false, isOutput: false, isConclusion: false }
          : type === "isImage"
          ? { isCode: false, isAim: false, isOutput: false, isConclusion: false }
          : type === "isAim"
          ? { isCode: false, isImage: false, isOutput: false, isConclusion: false }
          : type === "isOutput"
          ? { isCode: false, isImage: false, isAim: false, isConclusion: false }
          : type === "isConclusion"
          ? { isCode: false, isImage: false, isAim: false, isOutput: false }
          : {}),
      },
    }));
  };

  const handleDefaultLanguageChange = (field: string, language: string) => {
    setFieldTypes((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        defaultLanguage: language,
      },
    }));
  };

  const handleGenerateCode = async (practicalIndex: number) => {
    const aimField = Object.entries(fieldTypes).find(
      ([_, type]) => type.isAim
    )?.[0];
    const codeField = Object.entries(fieldTypes).find(
      ([_, type]) => type.isCode
    )?.[0];

    const aim = aimField
      ? (practicalData[practicalIndex]?.[aimField] as string)
      : undefined;
    const language = codeField
      ? fieldTypes[codeField].defaultLanguage
      : undefined;

    if (!language) {
      setError("Please select a programming language to generate code.");
      return;
    }

    if (!codeField) {
      setError("Please mark a field as Code to generate code.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ aim, language }),
      });

      const data = await response.json();

      if (response.ok) {
        handleDataChange(practicalIndex, codeField, data.code);
      } else {
        setError(data.error || "Code generation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred during code generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateConclusion = async (practicalIndex: number) => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate-conclusion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ practicalData:practicalData[practicalIndex] }),
      });

      const data = await response.json();
      setConclusion(data.conclusion);

      if (response.ok) {
        handleDataChange(practicalIndex, "conclusion", data.conclusion);
      } else {
        setError(data.error || "Conclusion generation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred during conclusion generation");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatOutput = (language: string, output: string): string => {
    const commandMap: Record<string, string> = {
      python: "python app.py",
      javascript: "node app.js",
      java: "javac Main.java && java Main",
      cpp: "g++ main.cpp -o main && ./main",
    };

    const command = commandMap[language] || "Unknown command";
    return `~ ${command}\n${output}`;
  };

  const handleExecuteCode = async (practicalIndex: number) => {
    setIsExecuting(true);
    setError(null);

    const codeField = Object.entries(fieldTypes).find(
      ([_, type]) => type.isCode
    )?.[0];
    const outputField = Object.entries(fieldTypes).find(
      ([_, type]) => type.isOutput
    )?.[0];

    if (!codeField || !outputField) {
      setError("Please mark fields for Code and Output");
      setIsExecuting(false);
      return;
    }

    const code = practicalData[practicalIndex]?.[codeField] as string;
    const language = fieldTypes[codeField].defaultLanguage;

    if (!code || !language) {
      setError("Code or language is missing");
      setIsExecuting(false);
      return;
    }

    try {
      const response = await fetch(
        "https://api.compiler.dhairyashah.dev/submissions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            source_code: code,
            language_id: getLanguageId(language),
            stdin: "",
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const result = await pollForResult(data.token);
        const formattedOutput = formatOutput(
          language,
          result.stdout || result.stderr || "No output"
        );
        handleDataChange(practicalIndex, outputField, formattedOutput);
      } else {
        setError(data.error || "Code execution failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred during code execution");
    } finally {
      setIsExecuting(false);
    }
  };

  const getLanguageId = (language: string): number => {
    const languageMap: Record<string, number> = {
      python: 71, // Python (3.8.1)
      javascript: 63, // JavaScript (Node.js 12.14.0)
      java: 62, // Java (OpenJDK 13.0.1)
      cpp: 54, // C++ (GCC 9.2.0)
    };
    return languageMap[language] || 71; // Default to Python if language not found
  };

  const pollForResult = async (token: string): Promise<any> => {
    const maxAttempts = 10;
    const delay = 2000; // 2 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        `https://api.compiler.dhairyashah.dev/submissions/${token}`
      );
      const data = await response.json();

      if (data.status.id === 3) {
        // Assuming 3 means completed
        return data;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error("Execution timed out");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    const formData = new FormData();
    formData.append("id", params.id);
    formData.append("practicalData", JSON.stringify(practicalData));
    formData.append("fieldTypes", JSON.stringify(fieldTypes));

    practicalData.forEach((practical, index) => {
      Object.entries(practical).forEach(([field, value]) => {
        if (value instanceof File) {
          formData.append(`image_${index}_${field}`, value);
        }
      });
    });

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/preview/${data.fileId}`);
      } else {
        setError(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold mb-4">
            Enter Practical Data
          </CardTitle>
        </CardHeader>
        <CardContent>
        <Alert className="mb-3" variant="default">
            <AlertTitle>Important Note</AlertTitle>
            <AlertDescription>
              Be sure to follow the correct format when creating your template. For more information, refer to the  
              <Link href="/documentation" className="font-medium underline ml-1">
              documentation.
              </Link>
            </AlertDescription>
          </Alert>
          <div className="mb-4">
            <Label htmlFor="practicalCount">Number of Practicals</Label>
            <Input
              id="practicalCount"
              type="number"
              min="1"
              value={practicalCount}
              onChange={handlePracticalCountChange}
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Field Types</h3>
            {Object.entries(fieldTypes).map(([field, type]) => (
              <div key={field} className="flex items-center space-x-2 mb-2">
                <Label className="w-24">{field}</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-code`}
                    checked={type.isCode}
                    onCheckedChange={() =>
                      handleFieldTypeChange(field, "isCode")
                    }
                  />
                  <Label htmlFor={`${field}-code`}>Code</Label>
                  {type.isCode && (
                    <Select
                      value={type.defaultLanguage}
                      onValueChange={(value) =>
                        handleDefaultLanguageChange(field, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="cpp">C++</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-aim`}
                    checked={type.isAim}
                    onCheckedChange={() =>
                      handleFieldTypeChange(field, "isAim")
                    }
                  />
                  <Label htmlFor={`${field}-aim`}>Aim</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-output`}
                    checked={type.isOutput}
                    onCheckedChange={() =>
                      handleFieldTypeChange(field, "isOutput")
                    }
                  />
                  <Label htmlFor={`${field}-output`}>Output</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field}-conclusion`}
                    checked={type.isConclusion}
                    onCheckedChange={() =>
                      handleFieldTypeChange(field, "isConclusion")
                    }
                  />
                  <Label htmlFor={`${field}-conclusion`}>Conclusion</Label>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {Array.from({ length: practicalCount }).map((_, index) => (
              <Card key={index} className="p-4">
                <CardTitle className="text-xl font-bold mb-4">
                  Block {index + 1}
                </CardTitle>
                <div className="space-y-4">
                  {Object.entries(mappings).map(([placeholder, field]) => (
                    <div key={field}>
                      <Label htmlFor={`${field}-${index}`}>{field}</Label>
                      {fieldTypes[field]?.isCode ? (
                        <div>
                          <CodeEditor
                            value={
                              (practicalData[index]?.[field] as string) || ""
                            }
                            language={
                              fieldTypes[field].defaultLanguage || "cpp"
                            }
                            placeholder="Enter your code here"
                            onChange={(evn) =>
                              handleDataChange(index, field, evn.target.value)
                            }
                            padding={15}
                            style={{
                              fontSize: 12,
                              backgroundColor: "#000000",
                              fontFamily:
                                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                            }}
                          />
                          <div className="mt-2 space-x-2">
                            <Button
                              type="button"
                              onClick={() => handleGenerateCode(index)}
                              disabled={isGenerating}
                            >
                              Generate Code
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleExecuteCode(index)}
                              disabled={isExecuting}
                            >
                              Execute Code
                            </Button>
                          </div>
                        </div>
                      ) : fieldTypes[field]?.isImage ? (
                        <Input
                          id={`${field}-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleDataChange(index, field, file);
                            }
                          }}
                        />
) : fieldTypes[field]?.isOutput ? (
  <CodeEditor
                            value={
                              (practicalData[index]?.[field] as string) || ""
                            }
                            language={
                              fieldTypes[field].defaultLanguage || "cpp"
                            }
                            placeholder="Enter your code here"
                            onChange={(e) =>
                              handleDataChange(index, field, e.target.value)
                            }
                            padding={15}
                            style={{
                              fontSize: 12,
                              backgroundColor: "#000000",
                              fontFamily:
                                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                            }}
                            readOnly={fieldTypes[field]?.isOutput}
                          />
) : fieldTypes[field]?.isConclusion ? (
  <>
  <Textarea
    id={`${field}-${index}`}
    value={(practicalData[index]?.[field] as string) || ""}
    onChange={(e) => setConclusion(e.target.value)}
    placeholder="Conclusion will appear here"
  />
  <div className="mt-2 space-x-2">
                            <Button
                              type="button"
                              onClick={() => handleGenerateConclusion(index)}
                              disabled={isGenerating}
                            >
                              Generate Conclusion
                            </Button>
                          </div>
                          </>
):  (
  <Input
    id={`${field}-${index}`}
    type="text"
    value={
      (practicalData[index]?.[field] as string) || ""
    }
    onChange={(e) =>
      handleDataChange(index, field, e.target.value)
    }
  />
)}
</div>
))}
</div>
              </Card>
            ))}
            <Button
              type="submit"
              disabled={isGenerating || isExecuting}
              className="w-full"
            >
              {isGenerating
                ? "Generating..."
                : isExecuting
                ? "Executing..."
                : "Generate Document"}
            </Button>
          </form>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}