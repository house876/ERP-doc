// 반제품 키워드 (Keywords for Semi-finished Products)
// 사용자가 제공한 명칭(DESCRIPTION)에 다음 단어가 포함된 품목
export const SEMI_FINISHED_KEYWORDS: string[] = [
  // 기계 부품
  "COVER", "HOUSING", "BUSHING", "SPACER", "SHAFT", "BLADE", "SLEEVE", "CAP", "PLATE",
  // 프레임 및 구조물
  "FRAME", "BRACKET", "BASE", "PANEL", "SUPPORT", "MOUNT",
  // 챔버 관련 부품
  "CHAMBER", "NOZZLE", "FLANGE", "TUBE", "PIPE",
  // 믹싱 관련 부품
  "ROTOR", "IMPELLER", "MIXING BLADE", "AGITATOR",
  // 기타 설비 내부 부품
  "GUIDE", "RING", "BLOCK", "STOPPER"
];

// 구매품 키워드 (Keywords for Purchased Items)
// 사용자가 제공한 명칭(DESCRIPTION)에 다음 단어가 포함된 품목
export const PURCHASED_ITEM_KEYWORDS: string[] = [
  // 베어링 및 기계 요소
  "BALL BEARING", "BEARING WASHER", "BEARING NUT", "OIL SEAL", "BUSH BEARING",
  // 패스너 (볼트/너트/와셔) - 개별 및 복합 명칭 포함
  "HEX.BOLT", "HEX BOLT", "BOLT", "SW", "SPRING WASHER", "PW", "PLAIN WASHER", "NUT", "ANCHOR BOLT", "HEX SOCKET HEAD BOLT",
  // 전기 부품
  "SENSOR", "MOTOR", "ENCODER", "SWITCH", "RELAY", "BREAKER",
  // 유압/공압 부품
  "CYLINDER", "VALVE", "COUPLING", "FITTING", "HOSE", "PUMP",
  // 기타
  "BELT", "CHAIN", "SPROCKET", "FILTER", "SEAL", "O-RING", "V-RING"
];

// 추천 상위품목 - 반제품 (Recommended Parent Item Prefixes for Semi-finished)
// 사용자의 '상위품목그룹' 입력 또는 품목 설명에 따라 결정. 값은 ERP 코드 접두사.
export const RECOMMENDED_PARENT_ITEMS_SEMI: Record<string, string> = {
  "MIXER": "MB",
  "BATCH": "MB", // 예: MIXER(BATCH)
  "TANK": "TK",
  "HOPPER": "HP",
  // 추가적인 규칙이 필요하면 여기에 기술 (예: CHAMBER -> MC 등)
};

// 추천 상위품목 - 구매품 (Recommended Parent Item Prefixes for Purchased)
// 사용자가 제공한 ERP 분류 코드를 기반으로 키워드와 ERP 코드 접두사 매핑
// 키: 품목 설명(DESCRIPTION)에 포함될 가능성이 있는 키워드 (대문자)
// 값: ERP 코드 접두사 (XX)
export const RECOMMENDED_PARENT_ITEMS_PURCHASED: Record<string, string> = {
  "PLC": "PE01",
  "HMI": "PE02",
  "INVERTER": "PE03",
  "SAFETY PLC": "PE04",
  "NOISE FILTER": "PE05",
  "BARCODE READER": "PE06",
  "UPS": "PE07",
  "CABLE": "PE08",
  "M/C": "PE09", // Magnetic Contactor로 추정
  "MAGNETIC CONTACTOR": "PE09",
  "SAFETY RELAY": "PE10",
  "SMPS": "PE11",
  "TERMINAL BLOCK": "PE12",
  "CIRCUIT BREAKER": "PE13",
  "BREAKER": "PE13",
  "TRANSFORMER": "PE14",
  "ETHERNET SWITCH": "PE15",
  "E&I SYSTEM": "PE16", // OTHERS_E&I SYSTEM
  "EXPLOSION PROOF BARRIER": "PE17",
  "ELECTRIC LABEL": "PE18",
  "DUCT": "PE19",
  "MACHINERY": "PM01", // 일반 기계 부품류
  "PART": "PM02", // 일반 부품류
  "SEAL": "PM03", // SEALING (O-RING, GASKET 등 포함)
  "GASKET": "PM03", // (RR07과 중복 가능성 있으나 PM03이 더 구체적인 분류로 보임)
  "O-RING": "PM03",
  "V-RING": "PM03",
  "GAUGE": "PM04", // (CZ01 게이지와 구분 필요, PM04는 설비 부착형 센서/게이지류로 판단)
  "SENSOR": "PM04",
  // "SWITCH": "PM04", // (전기부품 SWITCH와 구분 필요, 여기서는 설비용 스위치로 가정)
  "VALVE": "PN01",
  "INSULATION": "PN02",
  "IN-LINE ITEM": "PN03",
  "HANGER": "PN04",
  "SUPPORT": "PN04", // (반제품 SUPPORT와 구분, 여기서는 배관 지지용)
  "INSTRUMENT": "PN05", // 계장품
  "OTHER PIPING": "PN06", // 기타 배관 관련
  "BOLT": "RR01", // (HEX BOLT, ANCHOR BOLT 등 포함)
  "NUT": "RR01",
  "WASHER": "RR01", // (SW, PW 포함)
  "SCREW": "RR01",
  "FERRULE": "RR02",
  "FITTING": "RR03",
  "FLANGE": "RR04", // (반제품 FLANGE와 구분, 여기서는 규격품 플랜지)
  "PIPE": "RR05", // (반제품 PIPE와 구분, 여기서는 규격품 파이프)
  "TUBE": "RR05",
  "PLATE": "RR06", // (원자재로서의 PLATE)
  // "GASKET": "RR07", // PM03으로 통합
  "SHAPE STEEL": "RR08", // 형강
  "ETC_RAW_MATERIAL": "RR99", // 기타 원자재
  "게이지": "CZ01", // 측정용 게이지 (PM04와 구분)
  "수평기": "CZ02",
  "길이/두께 측정기": "CZ03",
  "기타계측기": "CZ04",
  "일반공구": "CZ05",
  "절삭/절단 공구": "CZ06",
  "포장재": "CZ07",
  "안전용품": "CZ08",
  "안전착용품": "CZ09",
  "연마자재": "CZ10",
  "용접자재": "CZ11",
  "용접봉": "CZ12",
  "가공자재": "CZ13",
  "워터젯자재": "CZ14",
  "윤활제/오일류": "CZ15",
  "윤활/오일 부품": "CZ16",
  "기타소모품": "CZ17",
  "개발용 소재": "CZ18",
  "기타구매품": "PZ01",
};

// 예상품목그룹번호 시작 번호 (반제품용)
export const ITEM_GROUP_NUMBER_STARTERS: Record<string, number> = {
  "MB": 3606, // 사용자 지정: MB일때는 IB3606부터
  "HP": 834,  // 사용자 지정: HP일때는 IH0834부터
  "TK": 3385,  // 사용자 지정: TK일때는 IT3385부터
  // 구매품은 추천상위품목 코드별로 1부터 시작 (예: PE01-001)
};

// 예상품목그룹번호 접두사 (반제품용)
export const ITEM_GROUP_NUMBER_PREFIXES: Record<string, string> = {
  "MB": "IB",
  "HP": "IH",
  "TK": "IT",
};

// 볼트류 명칭(DESCRIPTION) 분리 및 표준화 매핑
export const FASTENER_MAPPINGS: Record<string, string> = {
  "HEX BOLT": "HEX BOLT",
  "HEX.BOLT": "HEX BOLT",
  "HEX SOCKET HEAD BOLT": "HEX SOCKET HEAD BOLT", // 표준화된 명칭으로 유지 또는 "HEX BOLT"로 통합 가능
  "SW": "SW (SPRING WASHER)",
  "SPRING WASHER": "SW (SPRING WASHER)",
  "PW": "PW (PLAIN WASHER)",
  "PLAIN WASHER": "PW (PLAIN WASHER)",
  "NUT": "NUT",
  // ANCHOR BOLT는 자체로 하나의 품목으로 처리될 가능성이 높음
};

export const DEFAULT_UNIT = "EA"; // 기본 단위
