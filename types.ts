import type React from 'react';

export interface CADItem {
  DESCRIPTION: string | null;
  MATERIAL: string | null;
  SPECIFICATION: string | null;
  REMARKS: string | null;
  QTY: string | null; // Quantity might be a string from OCR, convert to number later
}

export interface 품목그룹등록DataType {
  품목그룹명: string;
  추천상위품목: string;
  예상품목그룹번호: string;
  구분: "반제품" | "구매품";
  // For internal use during processing, e.g. to avoid duplicates or pass data
  originalDescription?: string; 
  material?: string | null;
  specification?: string | null;
  remarks?: string | null;
}

export interface 표준반제품등록DataType {
  품목그룹명: string;
  파트아이템규격: string;
  단위: string; // 예: EA (사용자 요청으로 추가됨)
}

export interface 표준BOMDataType {
  LEVEL: "L3" | "L4";
  품목그룹명: string;
  규격: string;
  수량: number;
}

export interface ProcessedTables {
  품목그룹등록: 품목그룹등록DataType[];
  표준반제품등록: 표준반제품등록DataType[];
  표준BOM: 표준BOMDataType[];
}

// For DataTable component
export interface Column<T> {
  Header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
}
