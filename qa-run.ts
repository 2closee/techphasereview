import fs from 'fs';
const orig = globalThis.fetch;
(globalThis as any).FileReader = class { result: any; onloadend: any; onerror: any; readAsDataURL(b: any) { b.arrayBuffer().then((a: any) => { this.result = 'data:image/jpeg;base64,' + Buffer.from(a).toString('base64'); this.onloadend(); }); } };
globalThis.fetch = async (u: any) => {
  const p = String(u).replace('file://','');
  const f = p.includes('pind') ? '/mnt/user-uploads/PIND_LOGO.jpeg' : '/mnt/user-uploads/Meranos_RGP.jpeg';
  return new Response(fs.readFileSync(f), { headers: { 'content-type': 'image/jpeg' } });
};
const saved: Record<string, Uint8Array> = {};
const { jsPDF } = await import('jspdf');
(jsPDF as any).prototype.save = function (name: string) {
  fs.writeFileSync('/tmp/qa/' + name, Buffer.from(this.output('arraybuffer')));
};
const m = await import('/dev-server/src/lib/studentDocuments.ts');
const s = { fullName: 'Ebiere Preye Tamuno', matricNumber: '1250301', programName: 'Igbematoru Youth Skills Empowerment Programme', locationName: 'Warri Training Centre, Warri', address: '12 Okere Road, Warri', phone: '08030000000', email: 'a@b.com', startDate: '02 March 2026' };
await m.downloadAdmissionLetter(s);
await m.downloadAcceptanceLetter(s);
await m.downloadConsentForm(s);
console.log('ok');
