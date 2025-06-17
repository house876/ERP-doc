
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, XIcon } from './Icons';

interface ImageUploadProps {
  onImageUpload: (file: File, base64Image: string) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onImageUpload(file, base64);
    };
    reader.readAsDataURL(file);
  }, [onImageUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
    event.currentTarget.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500'); 
  }, [processFile]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-blue-500', 'ring-1', 'ring-blue-500'); 
  };
  
  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-blue-500', 'ring-1', 'ring-blue-500'); 
  };

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const fileExtension = file.type.split('/')[1] || 'png';
          const namedFile = new File([file], file.name || `pasted_image_${Date.now()}.${fileExtension}`, { type: file.type });
          processFile(namedFile);
          break; 
        }
      }
    }
  }, [processFile]);

  const removeImage = useCallback(() => {
    setPreview(null);
    setFileName(null);
    onImageUpload(new File([], "", {type: "text/plain"}), ""); 
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
  }, [onImageUpload]);

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPaste={handlePaste}
        tabIndex={0} 
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all duration-200 ease-in-out ${preview ? 'p-1.5' : 'p-4'} focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 outline-none group`}
        aria-label="CAD BOM 이미지 업로드 영역: 클릭, 드래그앤드롭, 또는 붙여넣기로 파일 업로드"
      >
        {preview ? (
          <div className="relative w-full h-full">
            <img src={preview} alt="Preview" className="object-contain w-full h-full rounded-md" />
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeImage(); }} 
              className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-sm z-10 transition-transform hover:scale-110"
              title="이미지 제거"
              aria-label="업로드된 이미지 제거"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-500 text-center">
            <UploadCloudIcon className="w-8 h-8 mb-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <p className="mb-1 text-xs">
              <span className="font-semibold text-blue-600">클릭하여 업로드</span>, 드래그 앤 드롭, <br/>또는 붙여넣기
            </p>
            <p className="text-xs text-gray-400">CAD BOM 이미지 파일</p>
          </div>
        )}
        <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
      </label>
      {fileName && preview && (
         <p className="mt-1.5 text-xs text-gray-500 truncate" title={fileName}>업로드 파일: {fileName}</p>
      )}
    </div>
  );
};