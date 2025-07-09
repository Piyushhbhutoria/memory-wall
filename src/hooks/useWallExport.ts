import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

interface ExportOptions {
  wallName: string;
  format: 'pdf' | 'png' | 'jpeg';
  quality?: number;
}

export const useWallExport = () => {
  const { toast } = useToast();

  const exportWall = async (element: HTMLElement, options: ExportOptions) => {
    try {
      toast({
        title: "Preparing export...",
        description: "This may take a moment depending on the wall size.",
      });

      // Configure html2canvas options for better quality
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png', options.quality || 0.95);
      
      if (options.format === 'pdf') {
        // Create PDF
        const pdf = new jsPDF({
          orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${options.wallName}-export.pdf`);
      } else {
        // Create image download
        const link = document.createElement('a');
        link.download = `${options.wallName}-export.${options.format}`;
        
        if (options.format === 'jpeg') {
          const jpegCanvas = document.createElement('canvas');
          const jpegCtx = jpegCanvas.getContext('2d');
          jpegCanvas.width = canvas.width;
          jpegCanvas.height = canvas.height;
          
          // Fill with white background for JPEG
          jpegCtx!.fillStyle = '#ffffff';
          jpegCtx!.fillRect(0, 0, canvas.width, canvas.height);
          jpegCtx!.drawImage(canvas, 0, 0);
          
          link.href = jpegCanvas.toDataURL('image/jpeg', options.quality || 0.9);
        } else {
          link.href = imgData;
        }
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export successful!",
        description: `Your wall has been exported as ${options.format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your wall. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { exportWall };
};