import React, { useState } from 'react';
import { useQuote } from '../../context/QuoteContext';
import type { Material } from '../../context/QuoteContext';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';
import NumberInput from '../../../../components/common/NumberInput';
import Checkbox from '../../../../components/common/Checkbox';
import Label from '../../../../components/common/Label';
import ProductSelect from '../../../../components/common/ProductSelect';
import { useProducts, useProductGroups } from '../../../../hooks/useBiService';
import type { ProductDto } from '../../../../api/bi-service';
import { formatPrice } from '../../../../utils/formatting';

const MaterialsTab: React.FC = () => {
  const { state, dispatch, getSummary } = useQuote();
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(undefined);
  const { isLoading: productsLoading } = useProducts(true, selectedGroupId);
  const { data: productGroups, isLoading: groupsLoading } = useProductGroups();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductDto | null>(null);
  const [selectedProductCode, setSelectedProductCode] = useState('');
  const [customProductName, setCustomProductName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [marginPln, setMarginPln] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [ignoreMinQuantity, setIgnoreMinQuantity] = useState(false);

  const handleAddMaterial = () => {
    const requestedQuantity = parseInt(quantity) || 1;
    let materialName: string;
    let materialPurchasePrice: number;
    let maxQuantity: number;

    if (selectedProduct) {
      materialName = selectedProduct.name;
      materialPurchasePrice = selectedProduct.price;
      maxQuantity = selectedProduct.quantity;
      
      if (requestedQuantity > maxQuantity) {
        alert(`Maksymalna dostępna ilośc to ${maxQuantity}`);
        return;
      }
    } else {
      materialName = customProductName || selectedProductCode || 'Custom Product';
      materialPurchasePrice = parseFloat(purchasePrice) || 0;
    }

    const finalPurchasePrice = parseFloat(purchasePrice) || materialPurchasePrice;
    const finalPricePerUnit = parseFloat(pricePerUnit) || 0;
    const marginPercentValue = parseFloat(marginPercent) || 0;
    const calculatedMarginPln = finalPurchasePrice > 0 && marginPercentValue > 0 
      ? (finalPurchasePrice * marginPercentValue) / 100 
      : finalPricePerUnit - finalPurchasePrice;

    const newMaterial: Material = {
      id: Date.now().toString(),
      name: materialName,
      purchasePrice: finalPurchasePrice,
      marginPercent: finalPurchasePrice > 0 ? ((finalPricePerUnit - finalPurchasePrice) / finalPurchasePrice) * 100 : marginPercentValue,
      marginPln: calculatedMarginPln,
      pricePerUnit: finalPricePerUnit,
      totalPrice: finalPricePerUnit * requestedQuantity,
      quantity: requestedQuantity,
      ignoreMinQuantity,
    };

    dispatch({ type: 'ADD_MATERIAL', material: newMaterial });
    
    setShowAddForm(false);
    setSelectedProduct(null);
    setSelectedProductCode('');
    setCustomProductName('');
    setQuantity('');
    setPurchasePrice('');
    setMarginPercent('');
    setMarginPln('');
    setPricePerUnit('');
    setIgnoreMinQuantity(false);
  };

  const handleUpdateMaterial = (materialId: string, field: string, value: number | boolean) => {
    dispatch({
      type: 'UPDATE_MATERIAL',
      materialId,
      updates: { [field]: value },
    });
  };

  const handleMarginPlnChange = (materialId: string, marginPln: number) => {
    const material = state.materials.find(m => m.id === materialId);
    if (!material) return;

    const marginPercent = material.purchasePrice > 0 ? (marginPln / material.purchasePrice) * 100 : 0;
    const newPricePerUnit = material.purchasePrice + marginPln;
    dispatch({
      type: 'UPDATE_MATERIAL',
      materialId,
      updates: { marginPln, marginPercent, pricePerUnit: newPricePerUnit },
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    const material = state.materials.find(m => m.id === materialId);
    if (material && window.confirm(`Czy na pewno chcesz usunąć surowiec "${material.name}"?`)) {
      dispatch({ type: 'REMOVE_MATERIAL', materialId });
    }
  };

  const handleMarginPercentChange = (value: string) => {
    setMarginPercent(value);
    
    const currentPurchasePrice = parseFloat(purchasePrice) || (selectedProduct ? selectedProduct.price : 0);
    if (value && currentPurchasePrice > 0) {
      const margin = parseFloat(value) || 0;
      const calculatedMarginPln = (currentPurchasePrice * margin) / 100;
      const calculatedPricePerUnit = currentPurchasePrice + calculatedMarginPln;
      setMarginPln(calculatedMarginPln.toFixed(2));
      setPricePerUnit(calculatedPricePerUnit.toFixed(2));
    }
  };

  const handleAddFormMarginPlnChange = (value: string) => {
    setMarginPln(value);
    
    const currentPurchasePrice = parseFloat(purchasePrice) || (selectedProduct ? selectedProduct.price : 0);
    if (value && currentPurchasePrice > 0) {
      const marginPlnValue = parseFloat(value) || 0;
      const calculatedMarginPercent = (marginPlnValue / currentPurchasePrice) * 100;
      const calculatedPricePerUnit = currentPurchasePrice + marginPlnValue;
      setMarginPercent(calculatedMarginPercent.toFixed(2));
      setPricePerUnit(calculatedPricePerUnit.toFixed(2));
    }
  };

  const handlePricePerUnitChange = (value: string) => {
    setPricePerUnit(value);
    
    const currentPurchasePrice = parseFloat(purchasePrice) || (selectedProduct ? selectedProduct.price : 0);
    if (value && currentPurchasePrice > 0) {
      const pricePerUnitValue = parseFloat(value) || 0;
      const calculatedMarginPln = pricePerUnitValue - currentPurchasePrice;
      const calculatedMarginPercent = (calculatedMarginPln / currentPurchasePrice) * 100;
      setMarginPln(calculatedMarginPln.toFixed(2));
      setMarginPercent(calculatedMarginPercent.toFixed(2));
    }
  };

  const handleProductSelect = (product: ProductDto | null) => {
    setSelectedProduct(product);
    
    if (product) {
      setPurchasePrice(product.price.toString());
      setPricePerUnit(product.price.toString());
      setMarginPercent('0');
      setMarginPln('0');
    } else {
      setPricePerUnit('');
      setMarginPercent('');
      setMarginPln('');
      setPurchasePrice('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-medium text-white">Lista surowców</h4>
        <Button onClick={() => setShowAddForm(true)} className="bg-[rgb(223,255,169)] hover:bg-[rgb(200,240,150)] text-black">
          Dodaj
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-background-dark p-4 rounded-lg border space-y-4">
          <h5 className="text-white font-medium">Dodaj nowy surowiec</h5>
          
          <div>
            <Label htmlFor="productGroupSelect">Grupa produktów</Label>
            <select
              id="productGroupSelect"
              value={selectedGroupId || ''}
              onChange={(e) => setSelectedGroupId(e.target.value ? parseInt(e.target.value) : undefined)}
              className="block w-full px-3 py-2 border border-gray-600 bg-background-dark text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={groupsLoading}
            >
              <option value="">Wszystkie grupy</option>
              {productGroups?.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="productSelect">Wybierz produkt</Label>
            <ProductSelect
              value={customProductName}
              onCodeChange={setSelectedProductCode}
              onNameChange={setCustomProductName}
              onProductSelect={handleProductSelect}
              searchBy="name"
              showPrice={true}
              loading={productsLoading}
              filterQuantity={true}
            />
          </div>

          <div className="flex items-center gap-2 mb-4 p-2 rounded">
            <Checkbox
              id="ignoreMaterialMinQty"
              checked={ignoreMinQuantity}
              onChange={(e) => setIgnoreMinQuantity(e.target.checked)}
            />
            <Label htmlFor="ignoreMaterialMinQty" className="text-sm">
              Ignoruj ilość minimalną
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="quantity">
                Ilość
                {selectedProduct && (
                  <span className="text-gray-400 text-xs"> (max: {selectedProduct.quantity})</span>
                )}
              </Label>
              <Input
                type="number"
                max={selectedProduct ? selectedProduct.quantity : undefined}
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="purchasePrice">Cena zakupu</Label>
              <NumberInput
                value={parseFloat(purchasePrice) || 0}
                onChange={(value) => {
                  setPurchasePrice(value.toString());
                  const currentMargin = parseFloat(marginPercent) || 0;
                  const currentMarginPln = parseFloat(marginPln) || 0;
                  if (currentMargin > 0) {
                    const calculatedMarginPln = (value * currentMargin) / 100;
                    const calculatedPricePerUnit = value + calculatedMarginPln;
                    setMarginPln(calculatedMarginPln.toFixed(2));
                    setPricePerUnit(calculatedPricePerUnit.toFixed(2));
                  } else if (currentMarginPln > 0) {
                    const calculatedPricePerUnit = value + currentMarginPln;
                    const calculatedMarginPercent = (currentMarginPln / value) * 100;
                    setMarginPercent(calculatedMarginPercent.toFixed(2));
                    setPricePerUnit(calculatedPricePerUnit.toFixed(2));
                  }
                }}
                step={0.01}
              />
            </div>
            <div>
              <Label htmlFor="margin">Marża %</Label>
              <NumberInput
                value={parseFloat(marginPercent) || 0}
                onChange={(value) => handleMarginPercentChange(value.toString())}
                step={0.01}
              />
            </div>
            <div>
              <Label htmlFor="marginPln">Marża PLN</Label>
              <NumberInput
                value={parseFloat(marginPln) || 0}
                onChange={(value) => handleAddFormMarginPlnChange(value.toString())}
                step={0.01}
              />
            </div>
            <div>
              <Label htmlFor="pricePerUnit">
                Cena za {selectedProduct ? selectedProduct.unitOfMeasure : 'szt'}
              </Label>
              <NumberInput
                value={parseFloat(pricePerUnit) || 0}
                onChange={(value) => handlePricePerUnitChange(value.toString())}
                step={0.01}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAddMaterial}
              className="bg-[rgb(223,255,169)] hover:bg-[rgb(200,240,150)] text-black"
            >
              Dodaj
            </Button>
            <Button
              onClick={() => setShowAddForm(false)}
              color="gray"
            >
              Anuluj
            </Button>
          </div>
        </div>
      )}

      {state.materials.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-background-dark rounded-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="px-4 py-3 text-left text-white">Nazwa</th>
                <th className="px-4 py-3 text-left text-white">Cena Zakupu</th>
                <th className="px-4 py-3 text-left text-white">Ilość</th>
                <th className="px-4 py-3 text-left text-white">Marża %</th>
                <th className="px-4 py-3 text-left text-white">Marża PLN</th>
                <th className="px-4 py-3 text-left text-white">Cena/Szt</th>
                <th className="px-4 py-3 text-left text-white">Cena suma</th>
                <th className="px-4 py-3 text-left text-white">Ignoruj ilość min.</th>
                <th className="px-4 py-3 text-left text-white">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {state.materials.map((material) => (
                <tr key={material.id} className="border-b border-gray-700">
                  <td className="px-4 py-3 text-white">{material.name}</td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={material.purchasePrice}
                      onChange={(value) => handleUpdateMaterial(material.id, 'purchasePrice', value)}
                      step={0.01}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={material.quantity}
                      onChange={(value) => handleUpdateMaterial(material.id, 'quantity', value)}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={material.marginPercent}
                      onChange={(value) => handleUpdateMaterial(material.id, 'marginPercent', value)}
                      step={0.01}
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={material.marginPln}
                      onChange={(value) => handleMarginPlnChange(material.id, value)}
                      step={0.01}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <NumberInput
                      value={material.pricePerUnit}
                      onChange={(value) => handleUpdateMaterial(material.id, 'pricePerUnit', value)}
                      step={0.01}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3 text-white">{formatPrice(material.totalPrice)} PLN</td>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={material.ignoreMinQuantity}
                      onChange={(e) => handleUpdateMaterial(material.id, 'ignoreMinQuantity', e.target.checked)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => handleRemoveMaterial(material.id)}
                      color="failure"
                      size="sm"
                    >
                      Usuń
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.materials.length === 0 && !showAddForm && (
        <div className="text-center py-8 text-gray-400">
          Brak dodanych surowców. Kliknij "Dodaj" aby dodać pierwszy surowiec.
        </div>
      )}

      {state.materials.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-lg font-medium text-white mb-4">Koszt Surowców</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-gray-300">Zakup surowców: </span>
              <span className="text-white font-medium">{formatPrice(getSummary().totalMaterialPurchase)} PLN</span>
            </div>
            <div>
              <span className="text-gray-300">Marża: </span>
              <span className="text-white font-medium">{formatPrice(getSummary().totalMaterialMargin)} PLN</span>
            </div>
            <div>
              <span className="text-gray-300">Suma: </span>
              <span className="text-white font-medium">{formatPrice(getSummary().totalMaterialValue)} PLN</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;