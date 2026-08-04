import { jsPDF } from 'jspdf';
import pindLogo from '@/assets/pind-logo.jpg';
import meranosLogo from '@/assets/meranos-logo.jpg';

export interface DocStudent {
  fullName: string;
  matricNumber?: string | null;
  programName: string;
  locationName?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  startDate?: string | null;
}

const MARGIN = 18;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function today() {
  return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
}

async function header(doc: jsPDF, title: string, subtitle: string) {
  const [meranos, pind] = await Promise.all([toDataUrl(meranosLogo), toDataUrl(pindLogo)]);

  // Meranos left, PIND right
  doc.addImage(meranos, 'JPEG', MARGIN, 13, 46, 11.4);
  doc.addImage(pind, 'JPEG', PAGE_W - MARGIN - 36, 14, 36, 8.5);

  doc.setDrawColor(20, 45, 85);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, 31, PAGE_W - MARGIN, 31);
  doc.setLineWidth(0.3);
  doc.setDrawColor(190, 30, 45);
  doc.line(MARGIN, 32.4, PAGE_W - MARGIN, 32.4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(20, 45, 85);
  doc.text(title.toUpperCase(), PAGE_W / 2, 42, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, PAGE_W / 2, 48, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  return 58;
}

function paragraph(doc: jsPDF, text: string, y: number, size = 10.5, gap = 4) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, CONTENT_W);
  doc.text(lines, MARGIN, y);
  return y + lines.length * (size * 0.45) + gap;
}

function labelLine(doc: jsPDF, label: string, value: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`${label}:`, MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.text(value || '—', MARGIN + 42, y);
  return y + 6.5;
}

function fillLine(doc: jsPDF, label: string, y: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(`${label}:`, MARGIN, y);
  doc.setDrawColor(140, 140, 140);
  doc.setLineWidth(0.2);
  doc.line(MARGIN + 42, y + 1, PAGE_W - MARGIN, y + 1);
  return y + 10;
}

function footer(doc: jsPDF, note: string) {
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(note, PAGE_W / 2, 287, { align: 'center' });
  doc.setTextColor(0, 0, 0);
}

function signatureBlock(doc: jsPDF, y: number) {
  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + 60, y);
  doc.line(PAGE_W - MARGIN - 60, y, PAGE_W - MARGIN, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Programme Coordinator', MARGIN, y + 5);
  doc.text('Meranos Nigeria Limited', PAGE_W - MARGIN - 60, y + 5);
  return y + 12;
}

export async function downloadAdmissionLetter(s: DocStudent) {
  const doc = new jsPDF();
  let y = await header(
    doc,
    'Letter of Admission',
    'Igbematoru Youth Skills Empowerment Programme — Sponsored by PIND Foundation',
  );

  doc.setFontSize(10);
  doc.text(today(), PAGE_W - MARGIN, y, { align: 'right' });
  y += 8;

  y = labelLine(doc, 'Name', s.fullName, y);
  if (s.matricNumber) y = labelLine(doc, 'Matriculation No', s.matricNumber, y);
  y = labelLine(doc, 'Programme', s.programName, y);
  if (s.locationName) y = labelLine(doc, 'Training Centre', s.locationName, y);
  y += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Dear ${s.fullName},`, MARGIN, y);
  y += 8;

  y = paragraph(
    doc,
    `We are pleased to inform you that you have been offered admission into the six (6) month ${s.programName} conducted by Meranos Nigeria Limited in partnership with the Foundation for Partnership Initiatives in the Niger Delta (PIND).`,
    y,
  );
  y = paragraph(
    doc,
    'This training is fully sponsored. You are not required to make any tuition or registration payment for the duration of the programme.',
    y,
  );
  y = paragraph(
    doc,
    `Your training will hold at ${s.locationName || 'the assigned training centre'}${s.startDate ? `, commencing on ${s.startDate}` : ''}. You are expected to attend all scheduled sessions, observe the attendance and check-in requirements, and comply with the rules and code of conduct of the training centre.`,
    y,
  );
  y = paragraph(
    doc,
    'Please sign and return the attached Acceptance Letter and Consent Form to confirm your place in this programme.',
    y,
  );
  y = paragraph(doc, 'We congratulate you and look forward to welcoming you.', y + 2);

  y += 14;
  signatureBlock(doc, y);
  footer(doc, 'Meranos Nigeria Limited · In partnership with PIND Foundation');
  doc.save(`Admission-Letter-${s.fullName.replace(/\s+/g, '-')}.pdf`);
}

export async function downloadAcceptanceLetter(s: DocStudent) {
  const doc = new jsPDF();
  let y = await header(
    doc,
    'Letter of Acceptance',
    'Igbematoru Youth Skills Empowerment Programme — Sponsored by PIND Foundation',
  );

  y = labelLine(doc, 'Name', s.fullName, y);
  if (s.matricNumber) y = labelLine(doc, 'Matriculation No', s.matricNumber, y);
  y = labelLine(doc, 'Programme', s.programName, y);
  if (s.locationName) y = labelLine(doc, 'Training Centre', s.locationName, y);
  y += 4;

  y = paragraph(
    doc,
    `I, ${s.fullName}, hereby accept the offer of admission into the six (6) month ${s.programName} organised by Meranos Nigeria Limited and sponsored by the Foundation for Partnership Initiatives in the Niger Delta (PIND).`,
    y,
  );
  y = paragraph(
    doc,
    'I understand and agree to the following conditions of my participation:',
    y,
  );

  const terms = [
    'I will attend all training sessions punctually and maintain the minimum attendance required to complete the programme.',
    'I understand that the training is fully sponsored and that no tuition or registration fee is payable by me.',
    'I will conduct myself responsibly and comply with the rules, safety guidelines and code of conduct of the training centre.',
    'I will take proper care of any tools, equipment or materials issued to me during the training.',
    'I understand that my place may be withdrawn for persistent absenteeism or serious misconduct.',
    'I consent to my attendance and progress records being shared with Meranos Nigeria Limited and PIND for programme monitoring and reporting.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  terms.forEach((t, i) => {
    const lines = doc.splitTextToSize(`${i + 1}.  ${t}`, CONTENT_W - 5);
    doc.text(lines, MARGIN + 3, y);
    y += lines.length * 4.7 + 2.5;
  });

  y += 8;
  y = fillLine(doc, 'Signature', y);
  y = fillLine(doc, 'Name', y);
  y = fillLine(doc, 'Phone No', y);
  y = fillLine(doc, 'Date', y);

  footer(doc, 'Meranos Nigeria Limited · In partnership with PIND Foundation');
  doc.save(`Acceptance-Letter-${s.fullName.replace(/\s+/g, '-')}.pdf`);
}

export async function downloadConsentForm(s: DocStudent) {
  const doc = new jsPDF();
  let y = await header(doc, 'Consent Form', 'Foundation for Partnership Initiatives in the Niger Delta (PIND)');

  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text('25 Jimmy Carter Street, Asokoro, Abuja, Nigeria · Ph: 09 291 0454', PAGE_W / 2, y - 4, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Programme: ${s.programName}`, MARGIN, y);
  y += 9;

  const paras = [
    'I hereby agree to participate in the photographing or production of the programme mentioned above, the nature and content of which have been fully explained to me, and I perfectly understand. I give PIND the absolute and irrevocable right and my unreserved consent to photographing, filming, and recording my contribution to the Programme.',
    'I agree that PIND, its agent, or others acting on its behalf do not have to use my photograph or recorded contribution. Still, if they do so, they may cut and edit it as they wish and use it in any manner without my inspecting or approving the finished products or the advertising copy or printed matter.',
    'I give all the necessary consents for my photograph or recorded contribution to be used in all present and future media anywhere in the world in perpetuity without liability, compensation, or further acknowledgment.',
    'I understand that the photograph or recorded contribution taken by PIND will be included in the stock files and that the copyright belongs to PIND.',
    'PIND hereby agrees to behave in a legal, ethical, and moral manner about using and exploiting your contribution to the programme.',
  ];
  paras.forEach(p => { y = paragraph(doc, p, y, 10.5, 4.5); });

  y += 8;
  y = fillLine(doc, 'Signed', y);
  y = fillLine(doc, 'Name', y);
  y = fillLine(doc, 'Address', y);
  y = fillLine(doc, 'Phone No', y);
  y = fillLine(doc, 'Date', y);
  y = fillLine(doc, 'Filming Location', y);

  footer(doc, 'PIND Foundation · Meranos Nigeria Limited');
  doc.save(`Consent-Form-${s.fullName.replace(/\s+/g, '-')}.pdf`);
}
