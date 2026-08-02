import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { FileUp, UploadCloud } from "lucide-react";

type Props = {
  onUpload: (files: File[]) => Promise<void>;
};

const allowed = new Set(["application/pdf", "text/csv", "text/plain", "application/vnd.ms-excel"]);

export function UploadDropzone({ onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const accepted = files.filter((file) => allowed.has(file.type) || /\.(pdf|csv|txt)$/i.test(file.name));
    if (accepted.length === 0) {
      setMessage("Solo se admiten PDF, CSV y TXT.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await onUpload(accepted);
      setMessage(`${accepted.length} archivo(s) enviados a procesamiento.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo cargar.");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void submitFiles(event.dataTransfer.files);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void submitFiles(event.target.files);
    }
  }

  return (
    <section
      className={dragging ? "dropzone dragging" : "dropzone"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <UploadCloud size={34} />
      <h2>Carga rápida de documentos</h2>
      <p>Arrastra PDF, CSV o TXT. Cada dato extraído conservará documento, referencia y confianza.</p>
      <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
        <FileUp size={16} />
        Seleccionar archivos
      </button>
      <input ref={inputRef} type="file" multiple accept=".pdf,.csv,.txt" onChange={handleInput} hidden />
      {message ? <span className="drop-message">{message}</span> : null}
    </section>
  );
}
