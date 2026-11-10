import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Package, CheckCircle2, Barcode, PackageCheck, AlertTriangle } from 'lucide-react';
import { apiServices } from '../services/apiServices';

interface ScannedBox {
  id: string;
  labelBarcode: string;
  nfNumber: string;
  quantidade: number;
}

interface BlindReceivingProps {
  onBack: () => void;
}

export default function BlindReceiving({ onBack }: BlindReceivingProps) {
  const [scannedBoxes, setScannedBoxes] = useState<ScannedBox[]>([]);
  const [labelBarcode, setLabelBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [scannedBoxes]);

  const handleScanBox = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoLido = labelBarcode.trim();
    
    if (!codigoLido) return;

    const jaBipadoNaTela = scannedBoxes.some(box => box.nfNumber === codigoLido);
    if (jaBipadoNaTela) {
      setMessage({ text: `A NF ${codigoLido} já foi adicionada nesta conferência!`, type: 'error' });
      setLabelBarcode('');
      setTimeout(() => setMessage(null), 3000);
      return; 
    }

    setLoading(true);
    setMessage(null);

    try {
      await apiServices.checkInvoiceStatus(codigoLido);

      setScannedBoxes(prevBoxes => [
        { id: Date.now().toString(), labelBarcode: codigoLido, nfNumber: codigoLido, quantidade: 1 },
        ...prevBoxes
      ]);

      setMessage({ text: `NF ${codigoLido} adicionada!`, type: 'success' });
      setLabelBarcode(''); 
      
    } catch (error: any) {
      let errorMsg = "Erro ao validar a NF.";
      if (error.response?.data) {
        errorMsg = typeof error.response.data === 'string' ? error.response.data : error.response.data.message;
      }
      setMessage({ text: errorMsg, type: 'error' });
      setLabelBarcode('');
      setTimeout(() => setMessage(null), 4000);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

    const handleFinishReceiving = async () => {
    if (scannedBoxes.length === 0) return;

    try {
      setIsSubmitting(true);
      setMessage(null);

      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const manifestCode = `GAM-${day}${month}${hours}${minutes}`;

      const payload = {
        manifestCode: manifestCode,
        receivingCode: scannedBoxes[0].nfNumber, 
        volumes: scannedBoxes.map(box => ({
          nfNumber: box.nfNumber,
          quantidade: box.quantidade
        }))
      };

      await apiServices.createReceiving(payload);

      setMessage({ text: `Manifesto ${manifestCode} enviado com sucesso!`, type: 'success' });
      setTimeout(() => onBack(), 1500);

    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || "Erro ao enviar.", type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCaixas = scannedBoxes.reduce((acc, curr) => acc + curr.quantidade, 0);

  return (
    // ALTERAÇÃO VISUAL: Mantido o layout geral
    <div className="bg-gray-100 h-full w-full text-gray-800 font-sans flex flex-col overflow-hidden">
      
      {/* ALTERAÇÃO VISUAL: Cabeçalho mais fino (px-3 py-2) */}
      <div className="bg-[#002B49] text-white px-3 py-2 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Barcode className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-xs tracking-wide">Recebimento Cego</span>
        </div>
        <button onClick={onBack} disabled={isSubmitting} className="text-[10px] bg-red-700 hover:bg-red-800 disabled:opacity-50 px-2.5 py-1 rounded text-white font-bold transition cursor-pointer">
          Voltar
        </button>
      </div>

      {/* ALTERAÇÃO VISUAL: Redução do espaço entre os blocos (p-2 space-y-2) */}
      <div className="flex-1 flex flex-col min-h-0 p-2 space-y-2">
        
        {/* ALTERAÇÃO VISUAL: Alerta com padding e fonte menor */}
        <div className={`transition-all duration-200 shrink-0 ${message ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
          {message && (
            <div className={`border p-1.5 rounded text-[10px] font-semibold flex items-center space-x-2 ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* ALTERAÇÃO VISUAL: Card do Input mais fino */}
        <div className="bg-white p-2 rounded-lg border border-gray-300 shadow-sm shrink-0">
          <label className="block text-center text-[10px] font-bold text-pink-600 mb-1.5 tracking-widest uppercase">
            Bipar Etiqueta Rosa
          </label>
          <form onSubmit={handleScanBox} className="w-full">
            <input
              ref={inputRef}
              type="text"
              value={labelBarcode}
              onChange={(e) => setLabelBarcode(e.target.value)}
              placeholder="Aguardando leitura da NF..."
              // ALTERAÇÃO VISUAL: Input mais fino (py-1.5) e fonte menor (text-xs)
              className="w-full bg-pink-50 border-2 border-pink-300 px-2 py-1.5 rounded text-xs font-mono text-pink-900 focus:outline-none focus:border-pink-500 placeholder:text-pink-300"
              autoComplete="off"
              disabled={loading || isSubmitting}
            />
          </form>
        </div>

        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Volumes Conferidos</h3>
          <span className="bg-[#002B49] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Total: {totalCaixas}
          </span>
        </div>

        {/* ALTERAÇÃO VISUAL: Lista com itens mais compactos */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0 pb-1">
          {scannedBoxes.map((box) => (
            <div key={box.id} className="p-2 rounded-lg border border-gray-300 bg-white shadow-sm flex items-center justify-between animate-in fade-in">
              <div className="flex items-center space-x-2">
                <div className="bg-pink-100 p-1.5 rounded-md">
                  <Package className="w-4 h-4 text-pink-600" />
                </div>
                <div>
                  <span className="font-mono text-xs font-bold text-blue-900 block">NF: {box.nfNumber}</span>
                </div>
              </div>
              <div className="flex items-center justify-center bg-gray-100 text-gray-800 text-[10px] font-bold w-6 h-6 rounded border border-gray-200">
                #{box.quantidade}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ALTERAÇÃO VISUAL: Rodapé e Botão Finalizar mais finos */}
      <div className="p-2 bg-white border-t border-gray-300 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0">
        <button
          onClick={handleFinishReceiving}
          disabled={scannedBoxes.length === 0 || isSubmitting}
          // ALTERAÇÃO VISUAL: py-2, text-xs e ícone w-4
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow transition cursor-pointer"
        >
          {isSubmitting ? <span>Enviando...</span> : <><PackageCheck className="w-4 h-4" /><span>Finalizar ({totalCaixas} caixas)</span></>}
        </button>
      </div>
    </div>
  );
}