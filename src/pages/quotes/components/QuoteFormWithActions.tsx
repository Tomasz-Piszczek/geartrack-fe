import React from 'react';
import { HiPrinter } from 'react-icons/hi';
import { useQuote } from '../context/QuoteContext';
import QuoteForm from './QuoteForm';
import Button from '../../../components/common/Button';
import { formatPrice } from '../../../utils/formatting';
import type { CreateQuoteDto, UpdateQuoteDto } from '../../../api/quotes';

interface QuoteFormWithActionsProps {
  onSubmit: (data: CreateQuoteDto | UpdateQuoteDto) => void;
  isSubmitting: boolean;
}

const QuoteFormWithActions: React.FC<QuoteFormWithActionsProps> = ({ onSubmit, isSubmitting }) => {
  const { prepareForSubmit, state, getSummary } = useQuote();

  const handleSubmit = () => {
    const data = prepareForSubmit();
    onSubmit(data);
  };

  const handlePrintQuote = () => {
    const summary = getSummary();

    const totalWorkTime = state.productionActivities.reduce((sum, activity) =>
      sum + activity.workTimeHours + activity.workTimeMinutes / 60, 0);
    const totalProductionMargin = state.productionActivities.reduce((sum, activity) =>
      sum + activity.marginPln, 0);
    const totalProductionCost = state.productionActivities.reduce((sum, activity) =>
      sum + activity.price, 0);

    const totalMaterialsMargin = state.materials.reduce((sum, material) =>
      sum + material.marginPln, 0);
    const totalMaterialsPurchasePrice = state.materials.reduce((sum, material) =>
      sum + material.purchasePrice * material.quantity, 0);

    const printContent = `
      <!DOCTYPE html>
      <html lang="pl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wycena ${state.documentNumber}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            .no-print { display: none !important; }
          }
          body { font-family: Arial, sans-serif; font-size: 12px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header h2 { font-size: 18px; margin: 10px 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section h3 { font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .right { text-align: right; }
          .total { font-weight: bold; background-color: #f0f0f0; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .info-label { font-weight: bold; }
        </style>
      </head>
      <body>

        <div class="info-grid">
          <div>
            <div class="info-item">
              <span class="info-label">Kontrahent:</span>
              <span>${state.contractorName} (${state.contractorCode})</span>
            </div>
            <div class="info-item">
              <span class="info-label">Produkt:</span>
              <span>${state.productName} (${state.productCode})</span>
            </div>
          </div>
          <div>
            <div class="info-item">
              <span class="info-label">Ilość minimalna:</span>
              <span>${state.minQuantity}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ilość docelowa:</span>
              <span>${state.totalQuantity}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Czynności produkcyjne</h3>
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Czas pracy (godz.)</th>
                <th>Koszt/h</th>
                <th>Koszt</th>
                <th>Marża %</th>
                <th>Marża PLN</th>
                <th>Razem</th>
              </tr>
            </thead>
            <tbody>
              ${state.productionActivities.map(activity => `
                <tr>
                  <td>${activity.name}</td>
                  <td class="right">${(activity.workTimeHours + activity.workTimeMinutes / 60).toFixed(2)}</td>
                  <td class="right">${formatPrice(activity.costPerHour)} PLN</td>
                  <td class="right">${formatPrice(activity.price)} PLN</td>
                  <td class="right">${activity.marginPercent}%</td>
                  <td class="right">${formatPrice(activity.marginPln)} PLN</td>
                  <td class="right">${formatPrice(activity.total)} PLN</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td></td>
                <td class="right">${totalWorkTime.toFixed(2)}</td>
                <td></td>
                <td class="right">${formatPrice(totalProductionCost)} PLN</td>
                <td></td>
                <td class="right">${formatPrice(totalProductionMargin)} PLN</td>
                <td class="right">${formatPrice(summary.totalProductionValueForMinQty)} PLN</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Surowce</h3>
          <table>
            <thead>
              <tr>
                <th>Nazwa</th>
                <th>Cena zakupu</th>
                <th>Ilość</th>
                <th>Marża %</th>
                <th>Marża PLN</th>
                <th>Cena jednostkowa</th>
                <th>Razem</th>
              </tr>
            </thead>
            <tbody>
              ${state.materials.map(material => `
                <tr>
                  <td>${material.name}</td>
                  <td class="right">${formatPrice(material.purchasePrice)} PLN</td>
                  <td class="right">${material.quantity}</td>
                  <td class="right">${material.marginPercent}%</td>
                  <td class="right">${formatPrice(material.marginPln)} PLN</td>
                  <td class="right">${formatPrice(material.pricePerUnit)} PLN</td>
                  <td class="right">${formatPrice(material.totalPrice)} PLN</td>
                </tr>
              `).join('')}
              <tr class="total">
                <td></td>
                <td class="right">${formatPrice(totalMaterialsPurchasePrice)} PLN</td>
                <td></td>
                <td></td>
                <td class="right">${formatPrice(totalMaterialsMargin)} PLN</td>
                <td></td>
                <td class="right">${formatPrice(summary.totalMaterialValueForMinQty)} PLN</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="section">
          <h3>Podsumowanie</h3>
          <table>
            <tbody>
              <tr>
                <td>Suma produkcji</td>
                <td class="right">${formatPrice(summary.totalProductionValueForMinQty)} PLN</td>
              </tr>
              <tr>
                <td>Suma surowców</td>
                <td class="right">${formatPrice(summary.totalMaterialValueForMinQty)} PLN</td>
              </tr>
              <tr>
                <td>Cena za sztukę:</td>
                <td class="right">${formatPrice((summary.totalMaterialValueForMinQty + summary.totalProductionValueForMinQty) / state.minQuantity)} PLN</td>
              </tr>
              <tr>
                <td>Cena ilość minimalna (${state.minQuantity} szt.):</td>
                <td class="right">${formatPrice(summary.totalMaterialValueForMinQty + summary.totalProductionValueForMinQty)} PLN</td>
              </tr>
              <tr class="total">
                <td>Cena całkowita (${state.totalQuantity} szt.):</td>
                <td class="right">${formatPrice(summary.totalMaterialValueForTotalQty + summary.totalProductionValueForTotalQty)} PLN</td>
              </tr>
            </tbody>
          </table>
        </div>

        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    }
  };

  return (
    <>
      <QuoteForm />
      <div className="mt-6 flex justify-between">
        <Button
          color="gray"
          onClick={handlePrintQuote}
          className="bg-blue-900 hover:bg-blue-800 text-blue-300"
        >
          <HiPrinter className="w-4 h-4 mr-2" />
          Drukuj wycenę
        </Button>
        <Button
          color="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
        >
          Zapisz
        </Button>
      </div>
    </>
  );
};

export default QuoteFormWithActions;
