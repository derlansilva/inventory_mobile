import React, { useState } from 'react';
import CollectorSimulator from './components/CollectorSimulator';
import BlindReceiving from './components/BlindReceiving';
import "./App.css";

type ScreenState = 'MENU' | 'RECEBIMENTO_DEVOLUCAO' | 'RECEBIMENTO_CEGO' | 'CARREGAMENTO';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('MENU');

  return (
    // h-screen e max-w-md mx-auto fazem a tela se comportar como um celular/coletor centralizado
    <div className="bg-slate-200 h-screen w-full text-gray-800 font-sans flex flex-col overflow-hidden select-none">
      <div className="w-full h-full max-w-md mx-auto bg-gray-100 flex flex-col justify-between shadow-xl relative">
        
        {currentScreen === 'MENU' ? (
          <>
              {/* CABEÇALHO DO MENU */}
          <header className="bg-[#002B49] px-4 py-3 flex flex-col items-center justify-center shadow-md shrink-0">
            <h3 className="!text-white font-bold text-base tracking-widest uppercase m-0 p-0">
              WMS Coletora Zebra
            </h3>
            <span className="!text-slate-300 text-[10px] font-mono mt-1 m-0 p-0">
              v1.0 • IP: 150.X.X.X
            </span>
          </header>

            {/* MENU PRINCIPAL */}
            <main className="p-4 flex-1 flex flex-col justify-center space-y-4 overflow-y-auto">
              <div className="text-center mb-2">
                <span className="text-xs font-bold text-[#002B49] uppercase tracking-wider bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200 inline-block">
                  Selecione a Operação
                </span>
              </div>

              {/* OPÇÃO 1: RECEBIMENTO DEVOLUÇÃO */}
              <button
                onClick={() => setCurrentScreen('RECEBIMENTO_DEVOLUCAO')}
                className="w-full bg-white border border-gray-300 active:bg-blue-50 p-4 rounded-xl shadow-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-900 text-white font-mono font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-blue-900 uppercase">Recebimento Devolução</span>
                    <span className="block text-[11px] text-gray-500">Conferência de NFs e Romaneios</span>
                  </div>
                </div>
              </button>

              {/* OPÇÃO 2: RECEBIMENTO CEGO */}
              <button
                onClick={() => setCurrentScreen('RECEBIMENTO_CEGO')}
                className="w-full bg-white border border-gray-300 active:bg-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-pink-600 text-white font-mono font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-gray-800 uppercase">Recebimento Cego</span>
                    <span className="block text-[11px] text-gray-500">Entrada de paletes e docas</span>
                  </div>
                </div>
              </button>

              {/* OPÇÃO 3: CARREGAMENTO */}
              <button
                onClick={() => alert('Módulo de Carregamento em desenvolvimento')}
                className="w-full bg-white border border-gray-300 active:bg-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between transition cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-200 text-gray-700 font-mono font-bold text-sm w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm text-gray-800 uppercase">Carregamento</span>
                    <span className="block text-[11px] text-gray-500">Expedição e conferência de saída</span>
                  </div>
                </div>
              </button>
            </main>

            {/* RODAPÉ DO MENU */}
            <footer className="bg-gray-200 border-t border-gray-300 px-3 py-3 text-center text-[10px] text-gray-600 font-mono shrink-0">
              Operador: <strong className="text-gray-800">Sem Autenticação</strong>
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