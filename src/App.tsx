import React, { useState } from 'react';
import CollectorSimulator from './components/CollectorSimulator';
import BlindReceiving from './components/BlindReceiving';
import { PackageOpen, PackageSearch, Truck, ChevronRight } from 'lucide-react';
import "./App.css";

type ScreenState = 'MENU' | 'RECEBIMENTO_DEVOLUCAO' | 'RECEBIMENTO_CEGO' | 'CARREGAMENTO';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('MENU');

  return (
    // Fundo geral (caso a tela seja maior que o app)
    <div className="bg-slate-300 h-screen w-full text-gray-800 font-sans flex flex-col overflow-hidden select-none">
      
      {/* Container Principal: w-full h-full para ocupar 100% da tela da coletora */}
      <div className="w-full h-full bg-slate-100 flex flex-col justify-between relative shadow-2xl">
        
        {currentScreen === 'MENU' ? (
          <>
            {/* CABEÇALHO DO MENU (fixo no topo) */}
            <header className="bg-[#002B49] px-3 py-2.5 flex flex-col items-center justify-center shadow-lg shrink-0 border-b-2 border-blue-900">
              <h3 className="!text-white font-bold text-sm tracking-widest uppercase m-0 p-0 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-blue-300" />
                WMS Coletora
              </h3>
              <span className="!text-slate-300 text-[9px] font-mono mt-0.5 m-0 p-0 uppercase tracking-widest">
                Zebra • v1.0 • IP: 150.X.X.X
              </span>
            </header>

            {/* MENU PRINCIPAL: flex-1 faz ele ocupar o espaço restante. overflow-y-auto adiciona rolagem se a tela for muito baixa */}
            <main className="p-3 flex-1 flex flex-col justify-center space-y-2.5 overflow-y-auto">
              
              <div className="text-center mb-1 shrink-0">
                <span className="text-[10px] font-bold text-[#002B49] uppercase tracking-wider bg-blue-200 px-3 py-1 rounded-full border border-blue-300 inline-block shadow-sm">
                  Selecione a Operação
                </span>
              </div>

              {/* OPÇÃO 1 */}
              <button
                onClick={() => setCurrentScreen('RECEBIMENTO_DEVOLUCAO')}
                className="w-full bg-white border border-blue-200 active:bg-blue-50 active:scale-95 p-2 rounded-lg shadow-sm flex items-center justify-between transition-all duration-100 shrink-0"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="bg-blue-900 text-white p-1.5 rounded-md flex items-center justify-center shrink-0">
                    <PackageOpen className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-blue-900 uppercase">Recebimento Devolução</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">Conferência de NFs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400" />
              </button>

              {/* OPÇÃO 2 */}
              <button
                onClick={() => setCurrentScreen('RECEBIMENTO_CEGO')}
                className="w-full bg-white border border-pink-200 active:bg-pink-50 active:scale-95 p-2 rounded-lg shadow-sm flex items-center justify-between transition-all duration-100 shrink-0"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="bg-pink-600 text-white p-1.5 rounded-md flex items-center justify-center shrink-0">
                    <PackageSearch className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-pink-900 uppercase">Recebimento Cego</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">Entrada de paletes</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-400" />
              </button>

              {/* OPÇÃO 3 */}
              <button
                onClick={() => alert('Módulo de Carregamento em desenvolvimento')}
                className="w-full bg-white border border-slate-200 active:bg-slate-100 active:scale-95 p-2 rounded-lg shadow-sm flex items-center justify-between transition-all duration-100 shrink-0"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="bg-slate-500 text-white p-1.5 rounded-md flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-xs text-slate-800 uppercase">Carregamento</span>
                    <span className="block text-[9px] text-slate-500 mt-0.5">Expedição de saída</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </main>

            {/* RODAPÉ (fixo no final) */}
            <footer className="bg-slate-200 border-t border-slate-300 px-3 py-1.5 text-center text-[9px] text-slate-600 font-mono shrink-0">
              Operador: <strong className="text-slate-800">Sem Autenticação</strong>
            </footer>
          </>
        ) : currentScreen === 'RECEBIMENTO_CEGO' ? (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <BlindReceiving onBack={() => setCurrentScreen('MENU')} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 w-full">
            <CollectorSimulator onBack={() => setCurrentScreen('MENU')} />
          </div>
        )}
      </div>
    </div>
  );
}