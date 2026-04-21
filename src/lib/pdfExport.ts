import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Military, RosterEntry, RosterService } from '../types';

export interface DailyExportData {
  date: string;
  fielAux: (Military | null)[]; // 3 shifts
  retenFielAux: (Military | null)[]; // 3 shifts
  acompFielAux: (Military | null)[]; // 3 shifts
  patrulhaCav: (Military | null)[]; // 3 shifts
  retenPatrulhaCav: (Military | null)[]; // 3 shifts
  acompPatrulhaCav: (Military | null)[]; // 3 shifts
  supervisorMaq: Military | null;
  fielCav: Military | null;
  supervisorMO: Military | null;
  supervisorEL: Military | null;
  caboDia: Military | null;
  retenMaq: Military | null;
  acompMaq: Military | null;
  retenCav: Military | null;
  acompCav: Military | null;
  retenMO: Military | null;
  acompMO: Military | null;
  retenEL: Military | null;
  acompEL: Military | null;
  boys: (Military | null)[][]; // grid
  chefeDept: { name: string, rank: string, title: string };
  detalhista: { name: string, rank: string, title: string };
}

export const exportDailyDetailPDF = (data: DailyExportData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const dateObj = parseISO(data.date);
  const dateFormatted = format(dateObj, 'dd/MM/yy');
  const dayOfWeek = format(dateObj, 'EEEE', { locale: ptBR }).toUpperCase();

  const formatName = (m: Military | null) => {
    if (!m) return '—';
    const p = m.posto ? m.posto : '';
    const e = m.especialidade ? `-${m.especialidade}` : '';
    return `${p}${e} ${m.name}`.trim();
  };

  // Header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('MARINHA DO BRASIL', pageWidth / 2, 10, { align: 'center' });
  doc.text('NAVIO-AERÓDROMO MULTIPROPÓSITO ATLÂNTICO', pageWidth / 2, 14, { align: 'center' });
  doc.text('DETALHE DE SERVIÇO NO PORTO', pageWidth / 2, 18, { align: 'center' });
  
  doc.setFontSize(10);
  doc.text(dateFormatted, pageWidth / 2, 26, { align: 'center' });
  doc.setFontSize(8);
  doc.text(dayOfWeek, pageWidth / 2 + 30, 26, { align: 'left' });

  // Table 1: Shifts
  autoTable(doc, {
    startY: 32,
    head: [['SERVIÇO', '08 - 12h / 20 - 24h', '12 - 16h / 00 - 04h', '16 - 20h / 04 - 08h']],
    body: [
      ['FIEL DAS AUXILIARES', ...data.fielAux.map(formatName)],
      ['RETÉNS:', ...data.retenFielAux.map(formatName)],
      ['ACOMPANHANDO', ...data.acompFielAux.map(formatName)],
      ['PATRULHA DO CAV', ...data.patrulhaCav.map(formatName)],
      ['RETÉM:', ...data.retenPatrulhaCav.map(formatName)],
      ['ACOMPANHANDO', ...data.acompPatrulhaCav.map(formatName)],
    ],
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center', cellPadding: 2 },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 40 } }
  });

  // Table 2: Daily Service
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 5,
    head: [['SERVIÇO', 'MILITAR']],
    body: [
      ['SUPERVISOR DA MÁQUINA', formatName(data.supervisorMaq)],
      ['RETÉM:', formatName(data.retenMaq)],
      ['ACOMPANHANDO', formatName(data.acompMaq)],
      ['FIEL DE CAV DE SERVIÇO', formatName(data.fielCav)],
      ['RETÉM:', formatName(data.retenCav)],
      ['ACOMPANHANDO', formatName(data.acompCav)],
      ['SUPERVISOR "MO"', formatName(data.supervisorMO)],
      ['RETÉM:', formatName(data.retenMO)],
      ['ACOMPANHANDO', formatName(data.acompMO)],
      ['SUPERVISOR "EL"', formatName(data.supervisorEL)],
      ['RETÉM:', formatName(data.retenEL)],
      ['ACOMPANHANDO', formatName(data.acompEL)],
    ],
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center', cellPadding: 2 },
    headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 60 } }
  });

  // Cabo de dia section
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['DEPARTAMENTO MÁQUINAS', 'MILITAR']],
    body: [
      ['CABO DE DIA', formatName(data.caboDia)],
    ],
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
    columnStyles: { 0: { halign: 'left', fontStyle: 'bold', cellWidth: 60 } }
  });

  const finalY = (doc as any).lastAutoTable.finalY;

  // Signatures
  doc.setFontSize(7);
  doc.text('__________________________________________', 50, finalY + 20, { align: 'center' });
  doc.text(data.chefeDept.name, 50, finalY + 24, { align: 'center' });
  doc.text(data.chefeDept.rank, 50, finalY + 27, { align: 'center' });
  doc.text(data.chefeDept.title, 50, finalY + 30, { align: 'center' });

  doc.text('__________________________________________', pageWidth - 50, finalY + 20, { align: 'center' });
  doc.text(data.detalhista.name, pageWidth - 50, finalY + 24, { align: 'center' });
  doc.text(data.detalhista.rank, pageWidth - 50, finalY + 27, { align: 'center' });
  doc.text(data.detalhista.title, pageWidth - 50, finalY + 30, { align: 'center' });

  // BOYS
  doc.text('BOYS:', 10, finalY + 45);
  const boysRows = data.boys || [[null, null, null], [null, null, null]];
  autoTable(doc, {
    startY: finalY + 48,
    head: [['08 - 10h', '10 - 12h', '12 - 14h']],
    body: boysRows.slice(0, 2).map(row => row.map(formatName)),
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 2,
    head: [['14 - 16h', '16 - 18h', '18 - 20h']],
    body: boysRows.slice(2, 4).map(row => row.map(formatName)),
    theme: 'grid',
    styles: { fontSize: 7, halign: 'center' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] }
  });

  doc.save(`detalhe_servico_${data.date}.pdf`);
};
