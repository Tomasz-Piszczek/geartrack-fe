import React from 'react';
import { HiChartBar, HiClipboardCheck, HiX } from 'react-icons/hi';

interface AnalyticsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkerAnalytics: () => void;
  onSelectMaterialAudit: () => void;
}

const AnalyticsSelectionModal: React.FC<AnalyticsSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectWorkerAnalytics,
  onSelectMaterialAudit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-background-sidebar rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <HiX className="w-6 h-6" />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          Wybierz typ analizy
        </h2>

        <div className="grid grid-cols-2 gap-4">
          {/* Worker Analytics Option */}
          <button
            onClick={onSelectWorkerAnalytics}
            className="group flex flex-col items-center justify-center p-8 bg-background-card rounded-xl border-2 border-transparent hover:border-main transition-all duration-200 hover:bg-background-card/80"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HiChartBar className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Analiza Pracowników
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Statystyki produkcji, obecność, speed index pracowników
            </p>
          </button>

          {/* Material Audit Option */}
          <button
            onClick={onSelectMaterialAudit}
            className="group flex flex-col items-center justify-center p-8 bg-background-card rounded-xl border-2 border-transparent hover:border-main transition-all duration-200 hover:bg-background-card/80"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <HiClipboardCheck className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Sprawdź Poprawność RW
            </h3>
            <p className="text-sm text-gray-400 text-center">
              Porównanie materiałów oczekiwanych vs wpisanych w zleceniach
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSelectionModal;
