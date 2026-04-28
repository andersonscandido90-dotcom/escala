import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Military, RosterEntry, RosterService } from '../types';

export interface DailyExportData {
  date: string;
  fielAux: (Military | null)[]; // 3 shifts
  retenFielAux: (Military | null)[]; // 3 shifts
  acompFielAux: (Military | null)[][]; // 3 shifts, each with multiple people
  patrulhaCav: (Military | null)[]; // 3 shifts
  retenPatrulhaCav: (Military | null)[]; // 3 shifts
  acompPatrulhaCav: (Military | null)[][]; // 3 shifts, each with multiple people
  supervisorMaq: Military | null;
  fielCav: Military | null;
  supervisorMO: Military | null;
  supervisorEL: Military | null;
  caboDia: Military | null;
  retenMaq: Military | null;
  acompMaq: (Military | null)[];
  retenCav: Military | null;
  acompCav: (Military | null)[];
  retenMO: Military | null;
  acompMO: (Military | null)[];
  retenEL: Military | null;
  acompEL: (Military | null)[];
  boys: (Military | null)[][]; // grid
  chefeDept: { name: string, rank: string, title: string };
  detalhista: { name: string, rank: string, title: string };
  navyLogo?: string;
  shipLogo?: string;
}

export const exportDailyDetailPDF = (data: DailyExportData) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateObj = parseISO(data.date);
  const dateFormatted = format(dateObj, 'dd/MM/yy');
  const dayOfWeek = format(dateObj, 'EEEE', { locale: ptBR }).toUpperCase();

  const formatName = (m: Military | null) => {
    if (!m) return '—';
    const p = m.posto ? m.posto : '';
    const e = m.especialidade ? `-${m.especialidade}` : '';
    return `${p}${e} ${m.name}`.trim();
  };

  const formatNameList = (list: (Military | null)[]) => {
    const valid = list.filter(m => m);
    if (valid.length === 0) return '—';
    return valid.map(m => formatName(m)).join(' / ');
  };

  // Header
  // Drawings logos if present
  if (data.navyLogo) {
    try {
      // Navy Logo on the Left
      doc.addImage(data.navyLogo, 'PNG', 10, 5, 20, 20);
    } catch(e) { console.error('Error drawing navy logo', e); }
  }
  if (data.shipLogo) {
    try {
      // Ship Logo on the Right
      doc.addImage(data.shipLogo, 'PNG', pageWidth - 30, 5, 20, 20);
    } catch(e) { console.error('Error drawing ship logo', e); }
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('MARINHA DO BRASIL', pageWidth / 2, 10, { align: 'center' });
  doc.text('NAVIO-AERÓDROMO MULTIPROPÓSITO ATLÂNTICO', pageWidth / 2, 15, { align: 'center' });
  doc.text('DETALHE DE SERVIÇO NO PORTO', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(11);
  doc.text(`${dateFormatted} - ${dayOfWeek}`, pageWidth / 2, 28, { align: 'center' });

  // Table 1: Shifts (Landscape optimized with Masks columns)
  autoTable(doc, {
    startY: 35,
    head: [['SERVIÇO', '08 - 12h / 20 - 24h', '12 - 16h / 00 - 04h', 'MÁSCARAS', '16 - 20h / 04 - 08h', 'MÁSCARAS']],
    body: [
      [
        { content: 'FIEL DAS AUXILIARES', styles: { fontStyle: 'bold' } },
        formatName(data.fielAux[0]), 
        formatName(data.fielAux[1]), 
        '46 a 54',
        formatName(data.fielAux[2]),
        '64 a 72'
      ],
      [
        { content: 'RETÉNS:', styles: { fontStyle: 'bold' } }, 
        formatName(data.retenFielAux[0]), 
        formatName(data.retenFielAux[1]), 
        { content: '', styles: { cellPadding: 0 } }, 
        formatName(data.retenFielAux[2]), 
        { content: '', styles: { cellPadding: 0 } }
      ],
      [
        { content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } },
        formatNameList(data.acompFielAux[0]), 
        formatNameList(data.acompFielAux[1]), 
        { content: '', styles: { cellPadding: 0 } }, 
        formatNameList(data.acompFielAux[2]), 
        { content: '', styles: { cellPadding: 0 } }
      ],
      [
        { content: 'PATRULHA DO CAV', styles: { fontStyle: 'bold' } },
        formatName(data.patrulhaCav[0]), 
        formatName(data.patrulhaCav[1]), 
        '55 a 63',
        formatName(data.patrulhaCav[2]),
        '73 a 81'
      ],
      [
        { content: 'RETÉM:', styles: { fontStyle: 'bold' } }, 
        formatName(data.retenPatrulhaCav[0]), 
        formatName(data.retenPatrulhaCav[1]), 
        { content: '', styles: { cellPadding: 0 } }, 
        formatName(data.retenPatrulhaCav[2]), 
        { content: '', styles: { cellPadding: 0 } }
      ],
      [
        { content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } },
        formatNameList(data.acompPatrulhaCav[0]), 
        formatNameList(data.acompPatrulhaCav[1]), 
        { content: '', styles: { cellPadding: 0 } }, 
        formatNameList(data.acompPatrulhaCav[2]), 
        { content: '', styles: { cellPadding: 0 } }
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8.5, halign: 'center', cellPadding: 2, textColor: [0, 0, 0], valign: 'middle' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    columnStyles: { 
      0: { cellWidth: 45 },
      3: { cellWidth: 22, fontStyle: 'bold', textColor: [80, 80, 80] },
      5: { cellWidth: 22, fontStyle: 'bold', textColor: [80, 80, 80] }
    }
  });

  const table1Bottom = (doc as any).lastAutoTable.finalY;

  // Split section: Table 2 (Left) | Cabo+Boys (Right)
  const midPoint = pageWidth / 2;

  // Table 2: Daily Service (Fixed width on left)
  autoTable(doc, {
    startY: table1Bottom + 4,
    margin: { right: midPoint + 5 },
    head: [['SERVIÇO DIÁRIO', 'MILITAR']],
    body: [
      [{ content: 'SUPERVISOR DA MÁQUINA', styles: { fontStyle: 'bold' } }, formatName(data.supervisorMaq)],
      [{ content: 'RETÉM:', styles: { fontStyle: 'bold' } }, formatName(data.retenMaq)],
      [{ content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } }, formatNameList(data.acompMaq)],
      [{ content: 'FIEL DE CAV DE SERVIÇO', styles: { fontStyle: 'bold' } }, formatName(data.fielCav)],
      [{ content: 'RETÉM:', styles: { fontStyle: 'bold' } }, formatName(data.retenCav)],
      [{ content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } }, formatNameList(data.acompCav)],
      [{ content: 'SUPERVISOR "MO"', styles: { fontStyle: 'bold' } }, formatName(data.supervisorMO)],
      [{ content: 'RETÉM:', styles: { fontStyle: 'bold' } }, formatName(data.retenMO)],
      [{ content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } }, formatNameList(data.acompMO)],
      [{ content: 'SUPERVISOR "EL"', styles: { fontStyle: 'bold' } }, formatName(data.supervisorEL)],
      [{ content: 'RETÉM:', styles: { fontStyle: 'bold' } }, formatName(data.retenEL)],
      [{ content: 'ACOMPANHANDO:', styles: { fontStyle: 'bold' } }, formatNameList(data.acompEL)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 1.5, textColor: [0, 0, 0] },
    headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    columnStyles: { 0: { cellWidth: 50, fontSize: 8 } }
  });

  const table2Bottom = (doc as any).lastAutoTable.finalY;

  // Cabo de dia (Right side)
  autoTable(doc, {
    startY: table1Bottom + 4,
    margin: { left: midPoint + 5 },
    head: [['DEPARTAMENTO MÁQUINAS', 'MILITAR']],
    body: [
      [{ content: 'CABO DE DIA', styles: { fontStyle: 'bold' } }, formatName(data.caboDia)],
    ],
    theme: 'grid',
    styles: { fontSize: 8, halign: 'center', cellPadding: 1.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 8, halign: 'center' },
    columnStyles: { 0: { cellWidth: 45, fontSize: 8 } }
  });

  // BOYS (Right side, under Cabo de dia)
  const boysStartY = (doc as any).lastAutoTable.finalY + 10;
  const rightColumnWidth = pageWidth - (midPoint + 5) - 20; // Estimated usable width on right

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BOYS:', midPoint + 5 + (rightColumnWidth / 2), boysStartY - 2, { align: 'center' });
  
  const boysRows = data.boys || [[null, null, null], [null, null, null], [null, null, null], [null, null, null]];
  autoTable(doc, {
    startY: boysStartY,
    margin: { left: midPoint + 5 },
    head: [['08 - 10h', '10 - 12h', '12 - 14h']],
    body: boysRows.slice(0, 2).map(row => row.map(formatName)),
    theme: 'grid',
    styles: { fontSize: 7.5, halign: 'center', cellPadding: 1.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 7.5, halign: 'center' }
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 1.5,
    margin: { left: midPoint + 5 },
    head: [['14 - 16h', '16 - 18h', '18 - 20h']],
    body: boysRows.slice(2, 4).map(row => row.map(formatName)),
    theme: 'grid',
    styles: { fontSize: 7.5, halign: 'center', cellPadding: 1.2, textColor: [0, 0, 0] },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontSize: 7.5, halign: 'center' }
  });

  const layoutBottom = Math.max(table2Bottom, (doc as any).lastAutoTable.finalY);

  // Signatures at the very bottom
  const sigY = pageHeight - 25;
  doc.setLineWidth(0.2);
  
  // Left signature (Detalhista)
  doc.line(20, sigY, midPoint - 20, sigY);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(data.detalhista.name, (20 + midPoint - 20) / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(data.detalhista.rank, (20 + midPoint - 20) / 2, sigY + 9, { align: 'center' });
  doc.text(data.detalhista.title, (20 + midPoint - 20) / 2, sigY + 13, { align: 'center' });

  // Right signature (Chefe)
  doc.line(midPoint + 20, sigY, pageWidth - 20, sigY);
  doc.setFont('helvetica', 'bold');
  doc.text(data.chefeDept.name, (midPoint + 20 + pageWidth - 20) / 2, sigY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(data.chefeDept.rank, (midPoint + 20 + pageWidth - 20) / 2, sigY + 9, { align: 'center' });
  doc.text(data.chefeDept.title, (midPoint + 20 + pageWidth - 20) / 2, sigY + 13, { align: 'center' });

  doc.save(`detalhe_servico_${data.date}.pdf`);
};
