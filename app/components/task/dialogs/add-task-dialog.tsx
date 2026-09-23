import { useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Calendar } from '~/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { AlertCircle, CalendarIcon, Loader2, X } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { pl } from 'date-fns/locale';
import { cn } from '~/utils/utils';
import { getErrorMessage } from '~/utils/error-mapper';
import { useTaskDictionaries } from '~/hooks/use-task-dictionaries';
import { FALLBACK_TASK_PRIORITY_LABELS } from '~/utils/task-helpers';
import type { ApiError, FormErrorState } from '~/interfaces/api-error';
import type { AddTaskRequestPayload, DictionaryItem } from '~/interfaces/task';

interface AddTaskDialogProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSave: (payload: AddTaskRequestPayload) => Promise<void>;
  readonly isLoading?: boolean;
  readonly dialogTitle?: string;
}

export function AddTaskDialog({
  isOpen,
  onClose,
  onSave,
  isLoading = false,
  dialogTitle = 'Dodaj nowe zadanie',
}: AddTaskDialogProps) {
  const { dictionaries, isLoading: isDictionariesLoading } = useTaskDictionaries();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState('12:00');
  const [priority, setPriority] = useState('Medium');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [formError, setFormError] = useState<FormErrorState | null>(null);

  useEffect(() => {
    if (dictionaries?.priorities && dictionaries.priorities.length > 0) {
      const hasMedium = dictionaries.priorities.some((p) => p.value.toLowerCase() === 'medium');
      if (!hasMedium && !priority) {
        setPriority(dictionaries.priorities[0].value);
      }
    }
  }, [dictionaries, priority]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedDate(undefined);
    setDueTime('12:00');
    setPriority('Medium');
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationErrors: string[] = [];
    if (!title.trim()) validationErrors.push('Tytuł zadania jest wymagany.');
    if (!description.trim()) validationErrors.push('Opis zadania jest wymagany.');
    if (!selectedDate) validationErrors.push('Wskaż datę realizacji z kalendarza.');
    if (!priority) validationErrors.push('Wybierz priorytet zadania.');

    if (validationErrors.length > 0) {
      setFormError({
        title: getErrorMessage('VALIDATION_ERROR'),
        details: validationErrors,
      });
      return;
    }

    try {
      const finalDateTime = new Date(selectedDate!);
      const [hours, minutes] = dueTime.split(':').map(Number);
      finalDateTime.setHours(Number.isNaN(hours) ? 12 : hours);
      finalDateTime.setMinutes(Number.isNaN(minutes) ? 0 : minutes);
      finalDateTime.setSeconds(0);
      finalDateTime.setMilliseconds(0);

      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueAt: finalDateTime.toISOString(),
        priority,
      });
      handleClose();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      const responseData = apiError.response?.data;

      const errorCode = responseData?.errorCode;
      const fallback = responseData?.message || apiError.message || 'Nie udało się dodać zadania.';

      setFormError({
        title: getErrorMessage(errorCode, fallback),
        details:
          responseData?.errors && responseData.errors.length > 0 ? responseData.errors : undefined,
      });
    }
  };

  const priorityOptions: DictionaryItem[] =
    dictionaries?.priorities && dictionaries.priorities.length > 0
      ? dictionaries.priorities
      : Object.entries(FALLBACK_TASK_PRIORITY_LABELS).map(([val, label]) => ({
          value: val.charAt(0).toUpperCase() + val.slice(1),
          label,
        }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-120 bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#004a8f]">{dialogTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {formError && (
            <div className="relative flex items-start gap-2.5 p-3 text-red-800 bg-red-50 border border-red-200 rounded-lg text-sm shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 pr-4">
                <p className="font-medium leading-tight">{formError.title}</p>
                {formError.details && formError.details.length > 0 && (
                  <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                    {formError.details.map((detailErr, idx) => (
                      <li key={idx}>{detailErr}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormError(null)}
                className="text-red-400 hover:text-red-700 p-0.5 rounded"
                title="Zamknij"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label htmlFor="task-title" className="block text-xs font-medium text-gray-700 mb-1">
              Tytuł zadania *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Przygotowanie oferty handlowej"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="task-description"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Opis zadania *
            </label>
            <textarea
              id="task-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wprowadź szczegóły zadania..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Termin realizacji *
            </label>
            <div className="flex gap-2">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'flex-1 justify-start text-left font-normal border-gray-300 text-xs py-2 h-9 bg-white',
                      !selectedDate && 'text-gray-500',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                    {selectedDate ? (
                      format(selectedDate, 'dd MMMM yyyy', { locale: pl })
                    ) : (
                      <span>Wybierz datę z kalendarza</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-60 bg-white shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={(date) => date < startOfDay(new Date())}
                    locale={pl}
                  />
                </PopoverContent>
              </Popover>

              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white h-9"
                title="Godzina realizacji"
              />
            </div>
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-xs font-medium text-gray-700 mb-1">
              Priorytet *
            </label>
            <select
              id="task-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={isDictionariesLoading}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#004a8f] bg-white h-9"
            >
              {priorityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <DialogFooter className="pt-4 border-t mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-[#004a8f] text-white hover:bg-blue-800"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Zapisywanie...
                </>
              ) : (
                'Dodaj zadanie'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
