import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const exportToPDF = async (elementId: string, filename: string = 'card') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: null,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
  pdf.save(`${filename}.pdf`);
};

export const generateShareLink = (cardId: string): string => {
  return `${window.location.origin}/preview/${cardId}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
};

export const sendEmail = (toEmail: string, subject: string, body: string, cardLink: string): string => {
  const emailBody = `${body}\n\n贺卡链接: ${cardLink}`;
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(emailBody);
  return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
};