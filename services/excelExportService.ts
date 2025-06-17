import * as XLSX from 'xlsx';
import type { ProcessedTables } from '../types';

const getColumnWidths = (data: any[], headers: string[]) => {
  const widths = headers.map(header => ({ wch: Math.max(header.length, 10) + 2 })); // Header 길이 + 여유분
  data.forEach(row => {
    headers.forEach((header, i) => {
      const cellValue = row[header] ? String(row[header]) : '';
      widths[i].wch = Math.max(widths[i].wch, cellValue.length + 2); // 내용 길이 + 여유분
    });
  });
  return widths.map(w => ({ wch: Math.min(w.wch, 60) })); // 최대 너비 60으로 제한
};

export function exportToExcel(tables: ProcessedTables, parentItemGroupName: string | null): void {
  const wb = XLSX.utils.book_new();

  const 품목그룹Headers = ["품목그룹명", "추천 상위품목", "예상품목그룹번호", "구분"];
  const 표준반제품Headers = ["품목그룹명", "파트 아이템 규격", "단위"];
  const 표준BOMHeaders = ["LEVEL", "품목그룹명", "규격", "수량"];

  const 품목그룹Data = tables.품목그룹등록.map(row => ({
    "품목그룹명": row.품목그룹명,
    "추천 상위품목": row.추천상위품목,
    "예상품목그룹번호": row.예상품목그룹번호,
    "구분": row.구분,
  }));

  const 표준반제품Data = tables.표준반제품등록.map(row => ({
    "품목그룹명": row.품목그룹명,
    "파트 아이템 규격": row.파트아이템규격,
    "단위": row.단위,
  }));
  
  const 표준BOMData = tables.표준BOM.map(row => ({
    "LEVEL": row.LEVEL,
    "품목그룹명": row.품목그룹명,
    "규격": row.규격,
    "수량": row.수량,
  }));

  const ws1 = XLSX.utils.json_to_sheet(품목그룹Data, { header: 품목그룹Headers });
  ws1['!cols'] = getColumnWidths(품목그룹Data, 품목그룹Headers);
  XLSX.utils.book_append_sheet(wb, ws1, "품목그룹등록");

  const ws2 = XLSX.utils.json_to_sheet(표준반제품Data, { header: 표준반제품Headers });
  ws2['!cols'] = getColumnWidths(표준반제품Data, 표준반제품Headers);
  XLSX.utils.book_append_sheet(wb, ws2, "표준반제품등록");

  const ws3 = XLSX.utils.json_to_sheet(표준BOMData, { header: 표준BOMHeaders });
  ws3['!cols'] = getColumnWidths(표준BOMData, 표준BOMHeaders);
  XLSX.utils.book_append_sheet(wb, ws3, "표준BOM");
  
  const headerCellStyle = {
    font: { bold: true, sz: 20, color: { rgb: "FFFFFF" } }, // 글자 크기 20pt
    fill: { fgColor: { rgb: "0070C0" } }, // 파란색 배경 (RGB for a common blue)
    alignment: { horizontal: "center", vertical: "center" },
    border: { // 굵은 테두리는 개별 셀에 적용하기 어려우므로 표준 테두리 적용
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
    }
  };
  const dataCellStyle = {
    alignment: { horizontal: "center", vertical: "center" },
     border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
    }
  };

  [ws1, ws2, ws3].forEach((ws) => {
    if(!ws || !ws['!ref']) return;
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = { c: C, r: R };
        const cellRef = XLSX.utils.encode_cell(cellAddress);
        if (!ws[cellRef]) { 
            ws[cellRef] = {v: ""}; 
        }
        if (ws[cellRef].t === undefined && ws[cellRef].v === undefined) {
             ws[cellRef] = {t: 's', v: ""}; 
        } else if (ws[cellRef].t === undefined && ws[cellRef].v !== undefined) {
            if (typeof ws[cellRef].v === 'number') ws[cellRef].t = 'n';
            else if (typeof ws[cellRef].v === 'boolean') ws[cellRef].t = 'b';
            else ws[cellRef].t = 's';
        }

        if (R === 0) { 
          ws[cellRef].s = headerCellStyle;
        } else { 
          ws[cellRef].s = dataCellStyle;
        }
      }
    }
    // 가장 바깥쪽 테두리를 굵게는 XLSX 기본 기능으로 직접 지원하기 복잡.
    // 대신 모든 셀에 표준 테두리를 적용하여 표 형태를 명확히 함.
  });

  const now = new Date();
  const fileNameDatePart = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}_${now.getMinutes().toString().padStart(2, '0')}`;
  const safeParentGroupName = parentItemGroupName ? parentItemGroupName.replace(/[\\/:*?"<>|]/g, '_') : 'BOM';
  const fileName = `${fileNameDatePart}_${safeParentGroupName}_ERP품목.xlsx`;

  XLSX.writeFile(wb, fileName);
}
