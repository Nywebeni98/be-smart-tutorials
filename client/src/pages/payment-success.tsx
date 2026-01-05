import { useState } from "react";
import { Link } from "wouter";
import { Video, Link2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PaymentSuccess() {
  const [zoomLink, setZoomLink] = useState('');

  const handleJoinSession = () => {
    if (zoomLink.trim()) {
      window.open(zoomLink.trim(), '_blank');
    }
  };

  const isValidZoomLink = zoomLink.trim().includes('zoom.us') || zoomLink.trim().startsWith('https://');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Video className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl" style={{ color: 'hsl(var(--brand-blue))' }}>
              Join Your Tutoring Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground text-center">
              Paste the Zoom invitation link that was sent to your email to join your session.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="zoomLink">Zoom Invitation Link</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="zoomLink"
                  placeholder="Paste your Zoom link here"
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="pl-10"
                  data-testid="input-zoom-link"
                />
              </div>
            </div>

            <Button 
              onClick={handleJoinSession}
              disabled={!zoomLink.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6 h-auto"
              size="lg"
              data-testid="button-join-zoom"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Join Zoom Session
            </Button>

            {zoomLink.trim() && !isValidZoomLink && (
              <p className="text-sm text-amber-600 dark:text-amber-400 text-center">
                Make sure you paste the complete Zoom link from your email.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button asChild variant="outline" data-testid="button-back-home">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
