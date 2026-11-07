import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Package, CheckCircle2, Barcode, PackageCheck, AlertTriangle } from 'lucide-react';
import { apiServices } from '../services/apiServices'; // <-- IMPORTANDO O APISERVICES

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
  const [isSubmitting, setIsSubmitting] = useState(false); // NOVO ESTADO PARA O BOTÃO FINALIZAR
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Foco automático no input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [scannedBoxes]);

  const handleScanBox = (e: React.FormEvent) => {
    e.preventDefault();
    const codigoLido = labelBarcode.trim();
    
    if (!codigoLido) return;

    setLoading(true);

    setTimeout(() => {
      const nfNumber = codigoLido; 

      setScannedBoxes(prevBoxes => {
        const existingBoxIndex = prevBoxes.findIndex(box => box.nfNumber === nfNumber);
        
        if (existingBoxIndex >= 0) {
          const updatedBoxes = [...prevBoxes];
          updatedBoxes[existingBoxIndex] = {
            ...updatedBoxes[existingBoxIndex],
            quantidade: updatedBoxes[existingBoxIndex].quantidade + 1
          };
          return updatedBoxes;
        } else {
          const newBox: ScannedBox = {
            id: Date.now().toString(),
            labelBarcode: codigoLido,
            nfNumber: nfNumber,
            quantidade: 1
          };
          return [newBox, ...prevBoxes];
        }
      });

      setLabelBarcode(''); 
      setLoading(false);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);

      setTimeout(() => setMessage(null), 2000);
    }, 200);
  };

  // ==========================================
  // AQUI É ONDE ENVIA PARA O BACKEND
  // ==========================================
  const handleFinishReceiving = async () => {
    if (scannedBoxes.length === 0) return;

    try {
      setIsSubmitting(true);
      setMessage(null);

      // Gera o código do manifesto baseado no timestamp (ex: REC-123456)
      const receivingCode = `REC-${Date.now().toString().slice(-6)}`;

      // Monta o payload exatamente como o Backend espera
      const payload = {
        receivingCode: receivingCode,
        volumes: scannedBoxes.map(box => ({
          nfNumber: box.nfNumber,
          quantidade: box.quantidade
        }))
      };

      console.log("Enviando para o backend:", payload);

      // Chama a rota do apiServices
      await apiServices.createReceiving(payload);

      // Feedback visual de sucesso
      setMessage({ text: `Recebimento ${receivingCode} enviado com sucesso!`, type: 'success' });
      
      // Espera 1.5 segundos para o operador ver a mensagem e volta para a tela anterior
      setTimeout(() => {
        onBack();
      }, 1500);

    } catch (error: any) {
      console.error("Erro ao criar recebimento:", error);
      setMessage({ 
        text: error.response?.data?.message || "Erro ao enviar recebimento para o servidor.", 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCaixas = scannedBoxes.reduce((acc, curr) => acc + curr.quantidade, 0);

  return (
    <div className="bg-gray-100 h-full w-full text-gray-800 font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="bg-[#002B49] text-white px-4 py-3 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center space-x-2">
          <Barcode className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-xs tracking-wide">WMS Coletora Zebra</span>
        </div>
        <button 
          onClick={onBack}
          disabled={isSubmitting} // Desabilita o voltar se estiver enviando
          className="text-[11px] bg-red-700 hover:bg-red-800 disabled:opacity-50 px-3 py-1.5 rounded text-white font-bold transition cursor-pointer"
        >
          Voltar
        </button>
      </div>

      {/* ÁREA CENTRAL */}
      <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
        
        {/* MENSAGEM DE SUCESSO / ERRO */}
        <div className={`transition-all duration-200 shrink-0 ${message ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
          {message && (
            <div className={`border p-2 rounded text-xs font-semibold flex items-center space-x-2 ${
              message.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* INPUT DE BIPAGEM */}
        <div className="bg-white p-3 rounded-lg border border-gray-300 shadow-sm shrink-0">
          <label className="block text-center text-xs font-bold text-pink-600 mb-2 tracking-widest uppercase">
            Bipar Etiqueta Rosa
          </label>
          <form onSubmit={handleScanBox} className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={labelBarcode}
                onChange={(e) => setLabelBarcode(e.target.value)}
                placeholder="Aguardando leitura da NF..."
                className="w-full bg-pink-50 border-2 border-pink-300 px-3 py-2 rounded text-sm font-mono text-pink-900 focus:outline-none focus:border-pink-500 placeholder:text-pink-300"
                autoComplete="off"
                disabled={loading || isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={loading || isSubmitting || !labelBarcode.trim()}
              className="bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded shadow transition cursor-pointer text-sm"
            >
              {loading ? '...' : 'OK'}
            </button>
          </form>
        </div>

        {/* LISTA DE VOLUMES */}
        <div className="flex items-center justify-between shrink-0">
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Volumes Conferidos</h3>
          <span className="bg-[#002B49] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            Total: {totalCaixas}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 pb-2">
          {scannedBoxes.length === 0 ? (
            <div className="text-center py-6 text-gray-400 font-medium text-xs border-2 border-dashed border-gray-300 rounded-lg">
              Nenhum volume bipado.
            </div>
          ) : (
            scannedBoxes.map((box) => (
              <div 
                key={box.id} 
                className="p-2.5 rounded-lg border border-gray-300 bg-white shadow-sm flex items-center justify-between animate-in fade-in duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-pink-100 p-1.5 rounded-md">
                    <Package className="w-4 h-4 text-pink-600" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-900 block">NF: {box.nfNumber}</span>
                    <span className="text-[9px] text-gray-400 font-mono">Cód: {box.labelBarcode}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center bg-gray-100 text-gray-800 text-xs font-bold w-7 h-7 rounded border border-gray-200">
                  #{box.quantidade}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTÃO FINALIZAR */}
      <div className="p-3 bg-white border-t border-gray-300 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] shrink-0">
        <button
          onClick={handleFinishReceiving}
          disabled={scannedBoxes.length === 0 || isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow transition cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-4 h-4"></span>
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <PackageCheck className="w-4 h-4" />
              <span>Finalizar ({totalCaixas} caixas)</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}