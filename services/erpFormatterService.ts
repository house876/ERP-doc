import type { CADItem, 품목그룹등록DataType, 표준반제품등록DataType, 표준BOMDataType, ProcessedTables } from '../types';
import { 
  SEMI_FINISHED_KEYWORDS, 
  PURCHASED_ITEM_KEYWORDS, 
  RECOMMENDED_PARENT_ITEMS_SEMI,
  RECOMMENDED_PARENT_ITEMS_PURCHASED,
  ITEM_GROUP_NUMBER_STARTERS,
  ITEM_GROUP_NUMBER_PREFIXES,
  FASTENER_MAPPINGS,
  DEFAULT_UNIT
} from '../constants';

// Helper function to classify item based on keywords in description
function classifyItem(description: string): "반제품" | "구매품" {
  const upperDesc = description.toUpperCase();

  // 구매품 키워드가 우선적으로 반제품 키워드보다 더 높은 우선순위를 가질 수 있는 경우를 고려
  // 예를 들어 "SENSOR PLATE"는 PLATE(반제품)와 SENSOR(구매품) 키워드를 모두 가질 수 있음.
  // 이 경우, 주요 기능이나 ERP 등록 기준에 따라 결정 필요. 여기서는 구매품 키워드가 더 구체적이면 구매품으로.
  let isPurchased = PURCHASED_ITEM_KEYWORDS.some(keyword => upperDesc.includes(keyword.toUpperCase()));
  let isSemiFinished = SEMI_FINISHED_KEYWORDS.some(keyword => upperDesc.includes(keyword.toUpperCase()));

  if (isPurchased) return "구매품";
  if (isSemiFinished) return "반제품";
  
  // 기본적으로 키워드에 명확히 걸리지 않으면 구매품으로 처리 (사용자 명세에 따름)
  return "구매품"; 
}

// Helper function to get recommended parent item prefix
function getRecommendedParentItem(itemDescription: string, classification: "반제품" | "구매품", parentItemGroupInput: string): string {
  const upperDesc = itemDescription.toUpperCase();
  
  if (classification === "반제품") {
    const upperParentGroupInput = parentItemGroupInput.toUpperCase();
    if (upperParentGroupInput && RECOMMENDED_PARENT_ITEMS_SEMI[upperParentGroupInput]) {
      return RECOMMENDED_PARENT_ITEMS_SEMI[upperParentGroupInput];
    }
    for (const [key, value] of Object.entries(RECOMMENDED_PARENT_ITEMS_SEMI)) {
      if (upperDesc.includes(key.toUpperCase())) return value;
    }
    // 사용자가 상위품목그룹을 입력하지 않았고, 설명에서도 찾을 수 없는 경우 기본값 또는 처리 필요
    // 현재는 이 함수를 호출하기 전에 parentItemGroupInput이 비어있으면 '명칭(DESCRIPTION)'만 사용하므로,
    // 이 부분은 추천 상위 "코드"를 찾는 것이므로, 못찾으면 특정 코드를 반환해야 함.
    // 사용자 요청: "이야기 안해주면 "상위품목그룹"은 뭔가요? 라고 물어보거나 "명칭(DESCRIPTION)"만 써줘" -> 이것은 품목그룹명 생성 규칙.
    // 추천 상위품목 코드는 여기서 결정. 못찾으면 기본 반제품 코드 (예: 'XX' 또는 가장 일반적인 것)
    return "MB"; // 기본값으로 MB (MIXER 관련) 또는 다른 적절한 기본값 설정.
  } else { // 구매품
    for (const [keyword, prefix] of Object.entries(RECOMMENDED_PARENT_ITEMS_PURCHASED)) {
        if (upperDesc.includes(keyword.toUpperCase())) {
            return prefix;
        }
    }
    // 특정 키워드(볼트/너트/와셔)에 대한 기본 추천 코드
    if (upperDesc.includes("BOLT") || upperDesc.includes("NUT") || upperDesc.includes("WASHER") || upperDesc.includes("SCREW")) {
        return "RR01";
    }
    return "PZ01"; // 기타구매품 기본 코드
  }
}

export function processCadDataToErpTables(cadItems: CADItem[], parentItemGroupInputGlobal: string): ProcessedTables {
  const 품목그룹등록Array: 품목그룹등록DataType[] = [];
  const 표준반제품등록Array: 표준반제품등록DataType[] = [];
  const 표준BOMArray: 표준BOMDataType[] = [];

  // 예상품목그룹번호 카운터 초기화
  const counters: Record<string, number> = {};
  for (const key in ITEM_GROUP_NUMBER_STARTERS) {
    counters[ITEM_GROUP_NUMBER_PREFIXES[key] || key] = ITEM_GROUP_NUMBER_STARTERS[key];
  }
  Object.values(RECOMMENDED_PARENT_ITEMS_PURCHASED).forEach(prefix => {
    if (!counters[prefix]) { // 구매품 접두사 카운터는 1부터 시작
      counters[prefix] = 1;
    }
  });
  
  const assignedNumbersCache: Map<string, string> = new Map(); // Key: 품목그룹명 + 규격, Value: 예상품목그룹번호

  cadItems.forEach(cadItem => {
    const originalDescription = cadItem.DESCRIPTION?.trim() || "N/A";
    if (originalDescription === "N/A") return;

    const material = cadItem.MATERIAL?.trim() || "";
    const specification = cadItem.SPECIFICATION?.trim() || "";
    const remarks = cadItem.REMARKS?.trim() || "";
    const qtyString = cadItem.QTY?.trim() || "1";
    const quantity = parseInt(qtyString, 10) || 1;

    const combinedSpecForCacheAndDisplay = [material, specification, remarks].filter(s => s).join(', ');

    // 볼트류 등 복합 명칭 처리
    const itemsToProcess: { currentDesc: string; originalFullDesc: string }[] = [];
    const fastenerRegex = /[,/]/;

    if ((originalDescription.toUpperCase().includes("HEX BOLT") || 
         originalDescription.toUpperCase().includes("HEX.BOLT") ||
         originalDescription.toUpperCase().includes("HEX SOCKET HEAD BOLT")) && 
         fastenerRegex.test(originalDescription)) {
      const parts = originalDescription.split(fastenerRegex).map(p => p.trim().toUpperCase());
      parts.forEach(part => {
        if (part) { // 빈 문자열 방지
          itemsToProcess.push({ currentDesc: FASTENER_MAPPINGS[part] || part, originalFullDesc: originalDescription });
        }
      });
    } else {
      itemsToProcess.push({ currentDesc: originalDescription, originalFullDesc: originalDescription });
    }

    itemsToProcess.forEach(itemEntry => {
      const currentDescription = itemEntry.currentDesc;
      const classification = classifyItem(currentDescription);
      
      let 품목그룹명: string;
      if (classification === "반제품") {
        품목그룹명 = parentItemGroupInputGlobal.trim() ? `${parentItemGroupInputGlobal.trim()} / ${currentDescription}` : currentDescription;
      } else {
        품목그룹명 = currentDescription;
      }

      const 추천상위품목 = getRecommendedParentItem(currentDescription, classification, parentItemGroupInputGlobal.trim());
      
      let 예상품목그룹번호: string;
      // 품목그룹명과 규격(재료,스펙,비고 조합)이 같으면 같은 번호 사용
      const uniqueIdForNumbering = `${품목그룹명}|${combinedSpecForCacheAndDisplay}`; 

      if (assignedNumbersCache.has(uniqueIdForNumbering)) {
        예상품목그룹번호 = assignedNumbersCache.get(uniqueIdForNumbering)!;
      } else {
        if (classification === "반제품") {
          const basePrefix = ITEM_GROUP_NUMBER_PREFIXES[추천상위품목] || 추천상위품목; // IB, IH, IT 등
          if (counters[basePrefix] === undefined) { // 카운터 초기화 (ITEM_GROUP_NUMBER_STARTERS에 의해 이미 되었어야 함)
            counters[basePrefix] = ITEM_GROUP_NUMBER_STARTERS[추천상위품목] || 1; 
          }
          예상품목그룹번호 = `${basePrefix}${String(counters[basePrefix]++).padStart(4, '0')}`;
        } else { // 구매품
          const prefixKey = 추천상위품목; // PE01, RR01 등
          if (counters[prefixKey] === undefined) {
            counters[prefixKey] = 1; 
          }
          예상품목그룹번호 = `${prefixKey}-${String(counters[prefixKey]++).padStart(3, '0')}`;
        }
        assignedNumbersCache.set(uniqueIdForNumbering, 예상품목그룹번호);
      }

      // 1. 품목그룹등록(Multi)(s)
      const 품목그룹등록Entry: 품목그룹등록DataType = {
        품목그룹명,
        추천상위품목,
        예상품목그룹번호,
        구분: classification,
        originalDescription: currentDescription, // 내부 참조용
        material, specification, remarks
      };
      // 품목그룹등록 테이블에는 중복 없이 추가 (품목그룹명, 재료, 규격, 비고, 구분 모두 동일한 경우)
      const 품목그룹UniqueKey = `${품목그룹명}|${material}|${specification}|${remarks}|${classification}`;
      if (!품목그룹등록Array.some(item => 
          `${item.품목그룹명}|${item.material}|${item.specification}|${item.remarks}|${item.구분}` === 품목그룹UniqueKey
      )) {
        품목그룹등록Array.push(품목그룹등록Entry);
      }

      // 2. 표준반제품등록(s) - 반제품만 해당
      if (classification === "반제품") {
        const 표준반제품UniqueKey = `${품목그룹명}|${combinedSpecForCacheAndDisplay}`;
        if (!표준반제품등록Array.some(item => `${item.품목그룹명}|${item.파트아이템규격}` === 표준반제품UniqueKey)) {
          표준반제품등록Array.push({
            품목그룹명: 품목그룹명, 
            파트아이템규격: combinedSpecForCacheAndDisplay,
            단위: DEFAULT_UNIT,
          });
        }
      }

      // 3. 표준BOM
      표준BOMArray.push({
        LEVEL: classification === "반제품" ? "L3" : "L4",
        품목그룹명: 품목그룹명, 
        규격: combinedSpecForCacheAndDisplay,
        수량: quantity, // 복합명칭에서 분리된 경우에도 원본 수량을 각 파생 품목에 적용
      });
    });
  });
  
  return {
    품목그룹등록: 품목그룹등록Array,
    표준반제품등록: 표준반제품등록Array,
    표준BOM: 표준BOMArray,
  };
}
