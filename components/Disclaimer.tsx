import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield } from "lucide-react"

interface DisclaimerProps {
  onAccept: () => void;
}

export function Disclaimer({ onAccept }: DisclaimerProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false)

  const handleAccept = () => {
    if (termsAccepted && responsibilityAccepted) {
      onAccept()
    }
  }

  return (
    <Card className="w-[600px] max-w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Disclaimer and Usage Guidelines</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            Please read this disclaimer carefully before using the Easegen
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center">
            <Shield className="mr-2" />
            Disclaimer and Liability
          </h3>
          <p>
            The Practical File Builder is a tool designed to assist in the generation of templates for practical files. It is not intended to replace individual effort or circumvent academic integrity policies.
          </p>
          <p className="font-semibold">
            Dhairya Shah, the creator of this tool, will not be liable for any offense, academic misconduct, or violation of university guidelines and submission terms resulting from the misuse of this tool.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Best Practices</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Use the Practical File Builder only for generating template structures and layouts.</li>
            <li>Always write your own code and content for your practical assignments.</li>
            <li>Use the tool to understand formatting requirements, not to generate actual assignment content.</li>
            <li>Consult with your instructors if you have any doubts about the appropriate use of this tool.</li>
            <li>Regularly review and adhere to your institution&apos;s academic integrity policies.</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Acknowledgment</h3>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm">
              I have read and understood the disclaimer and usage guidelines.
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="responsibility" 
              checked={responsibilityAccepted}
              onCheckedChange={(checked) => setResponsibilityAccepted(checked as boolean)}
            />
            <label htmlFor="responsibility" className="text-sm">
              I accept full responsibility for my use of the Practical File Builder and will comply with my institution&apos;s academic integrity policies.
            </label>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleAccept} 
          disabled={!termsAccepted || !responsibilityAccepted}
          className="w-full"
        >
          I Agree and Wish to Proceed
        </Button>
      </CardFooter>
    </Card>
  )
}