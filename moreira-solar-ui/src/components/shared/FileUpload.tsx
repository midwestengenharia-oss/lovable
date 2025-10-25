import { useState, useCallback } from "react";
import { Upload, X, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface UploadedFile {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  data: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  accept?: string;
  maxFiles?: number;
  showGallery?: boolean;
}

export function FileUpload({ 
  files, 
  onFilesChange, 
  accept = "*", 
  maxFiles = 10,
  showGallery = true 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, [files, maxFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }, [files, maxFiles]);

  const handleFiles = (newFiles: File[]) => {
    if (files.length + newFiles.length > maxFiles) {
      alert(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }

    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      nome: file.name,
      url: URL.createObjectURL(file),
      tipo: file.type,
      data: new Date().toISOString(),
    }));

    onFilesChange([...files, ...uploadedFiles]);
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const getFileIcon = (tipo: string) => {
    if (tipo.startsWith("image/")) return <ImageIcon className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
        )}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <Button variant="outline" size="sm" onClick={() => document.getElementById("file-upload")?.click()}>
          Selecionar Arquivos
        </Button>
      </div>

      {showGallery && files.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {files.map(file => (
            <Card key={file.id} className="p-3 relative group">
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(file.id)}
              >
                <X className="h-3 w-3" />
              </Button>

              {file.tipo.startsWith("image/") ? (
                <img src={file.url} alt={file.nome} className="w-full h-24 object-cover rounded mb-2" />
              ) : (
                <div className="w-full h-24 bg-muted rounded mb-2 flex items-center justify-center">
                  {getFileIcon(file.tipo)}
                </div>
              )}

              <p className="text-xs truncate" title={file.nome}>{file.nome}</p>
              <p className="text-xs text-muted-foreground">{new Date(file.data).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
