import React, { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { X } from 'lucide-react';
import { useQuote, type ProductionActivity } from '../../context/QuoteContext';
import NumberInput from '../../../../components/common/NumberInput';
import Label from '../../../../components/common/Label';
import Button from '../../../../components/common/Button';
import Checkbox from '../../../../components/common/Checkbox';
import { formatPrice } from '../../../../utils/formatting';

interface ActivityFormData {
  name: string;
  workTimeHours: number;
  workTimeMinutes: number;
  price: number;
  costPerHour: number;
  marginPercent: number;
  ignoreMinQuantity: boolean;
}

const ProductionTab: React.FC = () => {
  const { state, dispatch } = useQuote();
  const [showNewActivityForm, setShowNewActivityForm] = useState(false);
  const [newActivity, setNewActivity] = useState<ActivityFormData>({
    name: '',
    workTimeHours: 0,
    workTimeMinutes: 0,
    price: 0,
    costPerHour: 0,
    marginPercent: 0,
    ignoreMinQuantity: false,
  });

  const handleUpdateActivity = (activityId: string, field: keyof ProductionActivity, value: number | boolean | string) => {
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY',
      activityId,
      updates: { [field]: value },
    });
  };

  const handleAddActivity = () => {
    dispatch({
      type: 'ADD_PRODUCTION_ACTIVITY',
      activity: {
        name: newActivity.name,
        workTimeHours: newActivity.workTimeHours,
        workTimeMinutes: newActivity.workTimeMinutes,
        price: newActivity.price,
        marginPercent: newActivity.marginPercent,
        marginPln: 0,
        ignoreMinQuantity: newActivity.ignoreMinQuantity,
      },
    });

    setNewActivity({
      name: '',
      workTimeHours: 0,
      workTimeMinutes: 0,
      price: 0,
      costPerHour: 0,
      marginPercent: 0,
      ignoreMinQuantity: false,
    });
    setShowNewActivityForm(false);
  };

  const handleRemoveActivity = (activityId: string) => {
    const activity = state.productionActivities.find(a => a.id === activityId);
    if (activity && window.confirm(`Czy na pewno chcesz usunąć etap produkcji "${activity.name}"?`)) {
      dispatch({
        type: 'REMOVE_PRODUCTION_ACTIVITY',
        activityId,
      });
    }
  };

  const handleMarginPlnChange = (activityId: string, marginPln: number) => {
    const activity = state.productionActivities.find(a => a.id === activityId);
    if (!activity) return;

    const marginPercent = activity.price > 0 ? (marginPln / activity.price) * 100 : 0;
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY',
      activityId,
      updates: { marginPln, marginPercent },
    });
  };

  const handleCostPerHourChange = (activityId: string, costPerHour: number) => {
    dispatch({
      type: 'UPDATE_PRODUCTION_ACTIVITY_COST_PER_HOUR',
      activityId,
      costPerHour,
    });
  };

  const renderActivityForm = (
    activity: ProductionActivity | null,
    formData: ActivityFormData | ProductionActivity,
    isNew: boolean = false
  ) => {
    const updateField = isNew
      ? (field: keyof ActivityFormData, value: string | number | boolean) => {
          setNewActivity(prev => ({ ...prev, [field]: value }));
        }
      : (field: keyof ProductionActivity, value: string | number | boolean) => {
          if (activity) {
            handleUpdateActivity(activity.id, field, value);
          }
        };

    const marginPln = isNew
      ? (formData.price * (formData as ActivityFormData).marginPercent) / 100
      : (formData as ProductionActivity).marginPln;

    return (
      <div className="space-y-6 p-4 border border-gray-600 rounded-lg bg-section-grey-dark">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 mr-4">
            <Label htmlFor={`activity-name-${activity?.id || 'new'}`}>Nazwa</Label>
            <input
              id={`activity-name-${activity?.id || 'new'}`}
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="input-style w-full"
              placeholder="Nazwa czynności"
            />
          </div>
          {!isNew && (
            <Button
              size="sm"
              color="failure"
              onClick={() => handleRemoveActivity(activity!.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id={`ignore-min-qty-${activity?.id || 'new'}`}
            checked={formData.ignoreMinQuantity}
            onChange={(e) => updateField('ignoreMinQuantity', e.target.checked)}
          />
          <Label htmlFor={`ignore-min-qty-${activity?.id || 'new'}`} className="text-sm">
            Ignoruj ilość minimalną
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Czas pracy (h):(mm)</Label>
            <div className="flex gap-2 items-center">
              <NumberInput
                value={formData.workTimeHours}
                onChange={(value) => {
                  if (isNew) {
                    const newTotalHours = value + formData.workTimeMinutes / 60;
                    const newPrice = newTotalHours > 0 ? (formData as ActivityFormData).costPerHour * newTotalHours : 0;
                    setNewActivity(prev => ({ ...prev, workTimeHours: value, price: newPrice }));
                  } else {
                    const activity = state.productionActivities.find(a => a.id === (formData as ProductionActivity).id);
                    if (activity) {
                      const newTotalHours = value + activity.workTimeMinutes / 60;
                      const newPrice = newTotalHours > 0 ? activity.costPerHour * newTotalHours : 0;
                      handleUpdateActivity(activity.id, 'workTimeHours', value);
                      handleUpdateActivity(activity.id, 'price', newPrice);
                    }
                  }
                }}
                placeholder="Godziny"
                min={0}
              />
              <span className="text-white">:</span>
              <NumberInput
                value={formData.workTimeMinutes}
                onChange={(value) => {
                  const clampedValue = Math.max(0, Math.min(59, value));
                  if (isNew) {
                    const newTotalHours = formData.workTimeHours + clampedValue / 60;
                    const newPrice = newTotalHours > 0 ? (formData as ActivityFormData).costPerHour * newTotalHours : 0;
                    setNewActivity(prev => ({ ...prev, workTimeMinutes: clampedValue, price: newPrice }));
                  } else {
                    const activity = state.productionActivities.find(a => a.id === (formData as ProductionActivity).id);
                    if (activity) {
                      const newTotalHours = activity.workTimeHours + clampedValue / 60;
                      const newPrice = newTotalHours > 0 ? activity.costPerHour * newTotalHours : 0;
                      handleUpdateActivity(activity.id, 'workTimeMinutes', clampedValue);
                      handleUpdateActivity(activity.id, 'price', newPrice);
                    }
                  }
                }}
                placeholder="Minuty"
                min={0}
                max={59}
              />
            </div>
          </div>

          <div>
            <Label>Koszt</Label>
            <NumberInput
              value={formData.price}
              onChange={(value) => {
                updateField('price', value);
              }}
              min={0}
              step={0.01}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Label>Koszt/h</Label>
            <NumberInput
              value={isNew ? (formData as ActivityFormData).costPerHour : (formData as ProductionActivity).costPerHour || 0}
              onChange={(value) => {
                if (isNew) {
                  const totalHours = formData.workTimeHours + formData.workTimeMinutes / 60;
                  const newPrice = totalHours > 0 ? value * totalHours : 0;
                  setNewActivity(prev => ({ ...prev, costPerHour: value, price: newPrice }));
                } else {
                  handleCostPerHourChange(activity!.id, value);
                }
              }}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <Label>Marża %</Label>
            <NumberInput
              value={formData.marginPercent}
              onChange={(value) => updateField('marginPercent', value)}
              min={0}
              step={0.01}
            />
          </div>

          <div>
            <Label>Marża PLN</Label>
            <NumberInput
              value={marginPln}
              onChange={(value) => {
                if (isNew) {
                  const marginPercent = formData.price > 0 ? (value / formData.price) * 100 : 0;
                  setNewActivity(prev => ({ ...prev, marginPercent }));
                } else {
                  handleMarginPlnChange(activity!.id, value);
                }
              }}
              min={0}
              step={0.01}
            />
          </div>
        </div>

        {!isNew && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-300">Koszt/h: </span>
                <span className="text-white font-medium">{formatPrice((formData as ProductionActivity).total / ((formData.workTimeHours + formData.workTimeMinutes / 60) || 1))} PLN</span>
              </div>
              <div>
                <span className="text-gray-300">Suma: </span>
                <span className="text-white font-medium">{formatPrice((formData as ProductionActivity).total)} PLN</span>
              </div>
            </div>
          </div>
        )}

        {isNew && (
          <div className="flex gap-4">
            <Button color="primary" onClick={handleAddActivity}>
              Dodaj
            </Button>
            <Button color="gray" onClick={() => setShowNewActivityForm(false)}>
              Anuluj
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {state.productionActivities.map((activity) => 
        renderActivityForm(activity, activity, false)
      )}

      {showNewActivityForm && renderActivityForm(null, newActivity, true)}

      {!showNewActivityForm && (
        <div className="text-center">
          <Button
            color="primary"
            onClick={() => setShowNewActivityForm(true)}
          >
            <HiPlus className="w-4 h-4 mr-2" />
            Dodaj etap
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductionTab;