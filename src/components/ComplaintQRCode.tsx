import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download } from 'lucide-react';

interface ComplaintQRCodeProps {
  complaintId: string;
  ticketNumber: string;
}

export const ComplaintQRCode = ({ complaintId, ticketNumber }: ComplaintQRCodeProps) => {
  const complaintUrl = `${window.location.origin}/dashboard/complaints/${complaintId}`;

  const downloadQRCode = () => {
    const svg = document.getElementById(`qr-${complaintId}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 300;
    canvas.height = 300;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `complaint-${ticketNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-border/50">
        <DialogHeader>
          <DialogTitle>Complaint QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="p-4 bg-white rounded-xl">
            <QRCodeSVG
              id={`qr-${complaintId}`}
              value={complaintUrl}
              size={256}
              level="H"
              includeMargin
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-mono text-muted-foreground">{ticketNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">Scan to view complaint details</p>
          </div>
          <Button onClick={downloadQRCode} className="gap-2">
            <Download className="w-4 h-4" />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
