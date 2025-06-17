
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ImageUpload } from './components/ImageUpload';
import { DataTable } from './components/DataTable';
import { LoadingSpinner } from './components/LoadingSpinner';
import { DownloadIcon, AlertTriangleIcon, CheckCircleIcon, HelpCircleIcon, ZapIcon } from './components/Icons';
import type { CADItem, 품목그룹등록DataType, 표준반제품등록DataType, 표준BOMDataType, ProcessedTables, Column } from './types';
import { processCadDataToErpTables } from './services/erpFormatterService';
import { exportToExcel } from './services/excelExportService';

const App: React.FC = () => {
  const [parentItemGroupInput, setParentItemGroupInput] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [ocrData, setOcrData] = useState<CADItem[] | null>(null);
  const [erpTables, setErpTables] = useState<ProcessedTables | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState<boolean>(false);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setIsApiKeyMissing(true);
      setError("심각한 오류: Gemini API 키가 애플리케이션 환경에 설정되지 않았습니다. 이 문제는 관리자가 해결해야 합니다. API_KEY 환경 변수를 확인해주세요.");
    }
  }, []);


  const handleImageUpload = useCallback((file: File, base64: string) => {
    setUploadedImage(file);
    setBase64Image(base64);
    setOcrData(null);
    setErpTables(null);
    setError(null);
    setSuccessMessage(null);
  }, []);

  const runOCR = async () => {
    if (isApiKeyMissing) {
       setError("API 키 오류: Gemini API 키가 설정되지 않아 데이터 처리를 진행할 수 없습니다. 관리자에게 문의하여 API_KEY 환경 변수를 설정하도록 요청하세요.");
       return;
    }
    if (!base64Image || !uploadedImage || uploadedImage.size === 0) { 
      setError("먼저 이미지를 업로드해주세요.");
      return;
    }
   
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    let ocrTextForLogging = ""; 

    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API 키가 없습니다. 환경 변수를 확인하세요.");
      }
      const ai = new GoogleGenAI({apiKey: apiKey});
      
      const imagePart = {
        inlineData: {
          mimeType: uploadedImage.type, 
          data: base64Image.split(',')[1], 
        },
      };
      
      const textPart = {
        text: `주어진 CAD BOM 이미지에서 다음 항목들을 추출하여 JSON 배열 형태로 반환해주세요: '명칭 (DESCRIPTION)', '재료 (MATERIAL)', '규격 (SPECIFICATION)', '비고 (REMARKS)', '수량 (QTY)'.
각 배열 요소는 객체여야 하며, 다음 키를 가져야 합니다: "DESCRIPTION", "MATERIAL", "SPECIFICATION", "REMARKS", "QTY".

중요 지침:
1.  **JSON 형식 엄수**: 모든 텍스트 값은 유효한 JSON 문자열이어야 합니다. 값 내부에 큰따옴표(")가 포함된 경우, 반드시 백슬래시를 사용하여 \\"로 이스케이프 처리해야 합니다. 줄바꿈 문자는 \\n, 탭 문자는 \\t 등으로 이스케이프해야 합니다.
2.  **누락된 값 처리**: 이미지에서 특정 열의 데이터를 찾을 수 없는 경우, 해당 필드의 값으로 null 또는 빈 문자열("")을 사용하세요. (예: "REMARKS": "" 또는 "REMARKS": null).
3.  **순수 JSON 응답**: 응답은 마크다운 감싸기(\`\`\`json ... \`\`\`)나 다른 설명 없이, 오직 JSON 배열 데이터만을 포함해야 합니다.
4.  **필드명 정확성**: 제시된 키 이름("DESCRIPTION", "MATERIAL", "SPECIFICATION", "REMARKS", "QTY")을 정확히 사용해야 합니다.
5.  **예시**: 만약 '명칭 (DESCRIPTION)' 값이 'Steel Bracket, Type "Heavy Duty"'라면, JSON에서는 "DESCRIPTION": "Steel Bracket, Type \\"Heavy Duty\\""와 같이 표현되어야 합니다.
정확한 JSON 배열을 생성하는 것이 매우 중요합니다. 최고 성능의 OCR 기능을 사용해주세요.`
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-04-17', 
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json", 
        }
      });

      let ocrText = response.text.trim();
      ocrTextForLogging = ocrText; 

      const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
      const matchFence = ocrText.match(fenceRegex);
      if (matchFence && matchFence[2]) {
        ocrText = matchFence[2].trim();
        ocrTextForLogging = ocrText;
      }
      
      if (ocrText.startsWith('[')) {
        let balance = 0;
        let endIndex = -1;
        for (let i = 0; i < ocrText.length; i++) {
          if (ocrText[i] === '[') {
            balance++;
          } else if (ocrText[i] === ']') {
            balance--;
            if (balance === 0) {
              endIndex = i;
              if (i < ocrText.length - 1) {
                ocrText = ocrText.substring(0, endIndex + 1);
                ocrTextForLogging = ocrText; 
              }
              break; 
            }
          }
        }
      }
      
      const parsedOcrData: CADItem[] = JSON.parse(ocrText);
      setOcrData(parsedOcrData);
      
      const processedErpData = processCadDataToErpTables(parsedOcrData, parentItemGroupInput);
      setErpTables(processedErpData);
      setSuccessMessage("OCR 데이터 추출 및 ERP 테이블 생성에 성공했습니다!");

    } catch (e: any) {
      console.error("OCR 또는 데이터 처리 중 오류 발생:", e);
      console.error("Gemini API로부터 받은 파싱 전 원본 텍스트 (최종 파싱 시도 직전):", ocrTextForLogging); 
      let userErrorMessage = `오류 발생: ${e.message}. `;
      if (e.message.toLowerCase().includes('json')) {
        userErrorMessage += "API 응답이 유효한 JSON 형식이 아니거나, 예상치 못한 추가 데이터가 포함된 것 같습니다. 이미지 품질이나 내용을 확인 후 다시 시도해주세요. ";
      } else if (e.message.toLowerCase().includes('api key')) {
         userErrorMessage += "API 키 관련 문제일 수 있습니다. 관리자에게 문의하세요. ";
      } else {
         userErrorMessage += "업로드한 이미지가 올바른 BOM 형식인지, 네트워크 연결 상태를 확인해주세요. ";
      }
      userErrorMessage += "때로는 OCR 결과가 불안정할 수 있으니, 이미지나 프롬프트를 조정 후 다시 시도해보세요. 개발자 콘솔에서 '파싱 전 원본 텍스트'를 확인할 수 있습니다.";
      setError(userErrorMessage);
      setOcrData(null);
      setErpTables(null);
    } finally {
      setIsLoading(false);
    }
  };


  const handleDownloadExcel = () => {
    if (!erpTables) {
      setError("엑셀로 내보낼 데이터가 없습니다. 먼저 데이터 처리를 실행해주세요.");
      return;
    }
    try {
      exportToExcel(erpTables, parentItemGroupInput);
      setSuccessMessage("엑셀 파일 다운로드가 준비되었습니다!"); 
    } catch (e: any) {
      console.error("엑셀 파일 생성 중 오류 발생:", e);
      setError(`엑셀 생성 오류: ${e.message}`);
    }
  };

  const 품목그룹등록Columns: Column<품목그룹등록DataType>[] = [
    { Header: "품목그룹명", accessor: "품목그룹명" },
    { Header: "추천 상위품목", accessor: "추천상위품목" },
    { Header: "예상품목그룹번호", accessor: "예상품목그룹번호" },
    { Header: "구분", accessor: "구분" },
  ];

  const 표준반제품등록Columns: Column<표준반제품등록DataType>[] = [
    { Header: "품목그룹명", accessor: "품목그룹명" },
    { Header: "파트 아이템 규격", accessor: "파트아이템규격" },
    { Header: "단위", accessor: "단위" }, 
  ];

  const 표준BOMColumns: Column<표준BOMDataType>[] = [
    { Header: "LEVEL", accessor: "LEVEL" },
    { Header: "품목그룹명", accessor: "품목그룹명" },
    { Header: "규격", accessor: "규격" },
    { Header: "수량", accessor: "수량" },
  ];

  if (isApiKeyMissing && !process.env.API_KEY) { 
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-gray-800">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg text-center border border-gray-300">
          <AlertTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-red-600 mb-4">API 키 설정 필요</h1>
          <p className="text-gray-700 mb-3">
            이 애플리케이션을 사용하기 위해서는 Gemini API 키가 필요합니다. 
            현재 <code>API_KEY</code> 환경 변수가 설정되어 있지 않습니다.
          </p>
          <p className="text-gray-500 text-sm">
            애플리케이션 관리자는 서버 또는 빌드 환경에서 <code>API_KEY</code>를 올바르게 설정해야 합니다. 
            API 키는 사용자 인터페이스를 통해 입력받거나 코드에 직접 포함되지 않습니다.
          </p>
           <a 
            href="https://ai.google.dev/gemini-api/docs/api-key?hl=ko" 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg transition-colors shadow-sm hover:shadow-md"
          >
            API 키 설정 가이드 보기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 bg-white text-black selection:bg-gray-300 selection:text-black">
      <header className="mb-10 text-center flex flex-col items-center">
        <img src="/logo.png" alt="윤성 품번 박사 로고" className="w-20 h-20 mb-4 rounded-full shadow-sm" />
        <h1 className="text-4xl sm:text-5xl font-bold text-black py-2">
          윤성 품번 박사
        </h1>
        <p className="text-gray-600 mt-2 text-base sm:text-lg">CAD BOM 이미지를 분석, ERP 데이터를 스마트하게 생성합니다.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8 max-w-6xl mx-auto">
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
          <label htmlFor="parentItemGroup" className="block text-base font-semibold text-gray-700 mb-2">
            상위품목그룹
            <HelpCircleIcon 
              className="inline ml-1.5 h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" 
              title="반제품의 '품목그룹명' 생성 시 사용됩니다. (예: MIXER, TANK, HOPPER). 입력하지 않으면 '명칭(DESCRIPTION)'만 사용됩니다." 
            />
          </label>
          <input
            type="text"
            id="parentItemGroup"
            value={parentItemGroupInput}
            onChange={(e) => setParentItemGroupInput(e.target.value)}
            placeholder="예: MIXER (선택 사항)"
            className="w-full p-2.5 bg-white border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-black placeholder-gray-400 transition-all text-sm"
            aria-describedby="parentItemGroupHelp"
          />
          <p id="parentItemGroupHelp" className="mt-1.5 text-xs text-gray-500">
            반제품의 품목그룹명 형식: [입력값] / [명칭]
          </p>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg shadow-md border border-gray-200">
           <ImageUpload onImageUpload={handleImageUpload} />
        </div>
      </div>
      
      <div className="text-center mb-10">
        <button
          onClick={runOCR}
          disabled={isLoading || !uploadedImage || uploadedImage.size === 0 || isApiKeyMissing}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50 flex items-center justify-center mx-auto text-base group"
          aria-label="데이터 처리 시작"
        >
          {isLoading ? <LoadingSpinner /> : <><ZapIcon className="mr-2 h-5 w-5" /> 데이터 처리 시작</>}
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md flex items-start max-w-4xl mx-auto shadow-sm text-sm">
          <AlertTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}
      {successMessage && !error && (
         <div role="status" className="mb-6 p-3 bg-green-50 border border-green-300 text-green-700 rounded-md flex items-center max-w-4xl mx-auto shadow-sm text-sm">
          <CheckCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-green-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {erpTables && (
        <div className="space-y-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-black">1. 품목그룹등록 (Multi)(s)</h2>
            <DataTable columns={품목그룹등록Columns} data={erpTables.품목그룹등록} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-black">2. 표준반제품등록 (s)</h2>
            <DataTable columns={표준반제품등록Columns} data={erpTables.표준반제품등록} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-black">3. 표준BOM</h2>
            <DataTable columns={표준BOMColumns} data={erpTables.표준BOM} />
          </div>
          <div className="text-center mt-8">
            <button
              onClick={handleDownloadExcel}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 flex items-center justify-center mx-auto text-base"
              aria-label="생성된 ERP 데이터를 엑셀 파일로 다운로드"
            >
              <DownloadIcon className="mr-2 h-5 w-5" />
              엑셀 파일로 다운로드
            </button>
          </div>
        </div>
      )}
      <footer className="mt-16 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
        <img src="/logo.png" alt="윤성 로고" className="w-8 h-8 mb-2 rounded-full mx-auto" />
        <p>본 애플리케이션은 Gemini API를 활용하여 제작되었습니다.</p>
        <p>&copy; {new Date().getFullYear()} 윤성 품번 박사. 모든 권리 보유.</p>
      </footer>
    </div>
  );
};

export default App;